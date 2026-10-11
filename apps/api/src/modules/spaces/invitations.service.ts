import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@ours/database';
import { INVITATION_CONFIG } from '@ours/core';
import {
  CreateInvitationResponse,
  InvitationMetadata,
  InvitationPreviewResponse,
  JoinResponse,
  RevokeInvitationResponse,
} from '@ours/contracts';
import { RateLimiterService } from '../../common/security/rate-limiter.service';
import {
  generateInvitationToken,
  generatePairingCode,
  hashInvitationToken,
  hmacPairingCode,
  timingSafeCompare,
} from './invitation.util';

@Injectable()
export class InvitationsService {
  private readonly hmacSecret: string;
  private readonly appBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly rateLimiter: RateLimiterService,
  ) {
    this.hmacSecret =
      this.configService.get<string>('pairingCodeHmacSecret') ||
      this.configService.get<string>('PAIRING_CODE_HMAC_SECRET') ||
      process.env.PAIRING_CODE_HMAC_SECRET ||
      'dev-hmac-secret-min-32-chars-long-local-env';

    this.appBaseUrl =
      this.configService.get<string>('appBaseUrl') ||
      process.env.APP_BASE_URL ||
      'https://app.ours.com';
  }

  async createInvitation(
    userId: string,
    spaceId: string,
  ): Promise<CreateInvitationResponse> {
    const membership = await this.prisma.coupleMembership.findFirst({
      where: {
        userId,
        coupleSpaceId: spaceId,
        status: 'ACTIVE',
      },
      include: {
        coupleSpace: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this couple space',
      );
    }

    if (membership.coupleSpace.status !== 'PENDING') {
      throw new BadRequestException(
        'Invitations can only be generated for PENDING couple spaces',
      );
    }

    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);

    const rawPairingCode = generatePairingCode();
    const pairingCodeHmac = hmacPairingCode(rawPairingCode, this.hmacSecret);

    const expiresAt = new Date(
      Date.now() + INVITATION_CONFIG.EXPIRY_HOURS * 3600000,
    );

    // Atomic transaction: revoke any existing PENDING invitation and insert new invitation (BR-C09)
    const invitation = await this.prisma.$transaction(async (tx) => {
      await tx.coupleInvitation.updateMany({
        where: {
          coupleSpaceId: spaceId,
          status: 'PENDING',
        },
        data: {
          status: 'REVOKED',
        },
      });

      return tx.coupleInvitation.create({
        data: {
          coupleSpaceId: spaceId,
          createdById: userId,
          tokenHash,
          pairingCodeHmac,
          pairingCodeKeyId: 'v1',
          status: 'PENDING',
          expiresAt,
        },
      });
    });

    const inviteUrl = `${this.appBaseUrl}/join?token=${rawToken}`;

    return {
      id: invitation.id,
      token: rawToken,
      pairingCode: rawPairingCode,
      inviteUrl,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async listInvitations(
    userId: string,
    spaceId: string,
  ): Promise<InvitationMetadata[]> {
    const membership = await this.prisma.coupleMembership.findFirst({
      where: {
        userId,
        coupleSpaceId: spaceId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this couple space',
      );
    }

    const invitations = await this.prisma.coupleInvitation.findMany({
      where: { coupleSpaceId: spaceId },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      status: inv.status,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
    }));
  }

  async revokeInvitation(
    userId: string,
    spaceId: string,
    invitationId: string,
  ): Promise<RevokeInvitationResponse> {
    const membership = await this.prisma.coupleMembership.findFirst({
      where: {
        userId,
        coupleSpaceId: spaceId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this couple space',
      );
    }

    const invitation = await this.prisma.coupleInvitation.findFirst({
      where: {
        id: invitationId,
        coupleSpaceId: spaceId,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.coupleInvitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    return {
      id: invitationId,
      status: 'REVOKED',
    };
  }

  async previewInvitation(token: string): Promise<InvitationPreviewResponse> {
    const tokenHash = hashInvitationToken(token);

    const invitation = await this.prisma.coupleInvitation.findUnique({
      where: { tokenHash },
      include: {
        coupleSpace: true,
        createdBy: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (
      !invitation ||
      invitation.status !== 'PENDING' ||
      invitation.expiresAt <= new Date()
    ) {
      throw new NotFoundException('Invitation not found or expired');
    }

    return {
      status: invitation.status,
      spaceName: invitation.coupleSpace.name,
      createdByName:
        invitation.createdBy.profile?.displayName || invitation.createdBy.email,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async joinByToken(userId: string, token: string): Promise<JoinResponse> {
    // 1. Check user does not already hold an active couple membership
    const existingMembership = await this.prisma.coupleMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (existingMembership) {
      throw new ConflictException(
        'You already hold an active couple space membership',
      );
    }

    const tokenHash = hashInvitationToken(token);

    // 2. Atomic partner pairing transaction with full verification
    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.coupleInvitation.findUnique({
        where: { tokenHash },
        include: {
          coupleSpace: {
            include: {
              memberships: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new BadRequestException('Invalid invitation token');
      }

      if (
        invitation.status !== 'PENDING' ||
        invitation.expiresAt <= new Date()
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.GONE,
            error: 'GONE',
            message: 'Invitation has expired, been revoked, or already consumed',
          },
          HttpStatus.GONE,
        );
      }

      if (invitation.coupleSpace.status !== 'PENDING') {
        throw new ConflictException(
          'Couple space is already active or archived',
        );
      }

      if (invitation.coupleSpace.memberships.length >= 2) {
        throw new ConflictException('Couple space is already full');
      }

      if (invitation.createdById === userId) {
        throw new BadRequestException(
          'You cannot accept your own invitation',
        );
      }

      // Create PARTNER membership
      const membership = await tx.coupleMembership.create({
        data: {
          userId,
          coupleSpaceId: invitation.coupleSpaceId,
          role: 'PARTNER',
          status: 'ACTIVE',
        },
      });

      // Mark invitation ACCEPTED
      await tx.coupleInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: userId,
          acceptedAt: new Date(),
        },
      });

      // Transition space PENDING -> ACTIVE
      const space = await tx.coupleSpace.update({
        where: { id: invitation.coupleSpaceId },
        data: {
          status: 'ACTIVE',
        },
      });

      return {
        coupleSpace: {
          id: space.id,
          name: space.name,
          status: space.status,
        },
        membership: {
          id: membership.id,
          role: membership.role,
          status: membership.status,
        },
      };
    });
  }

  async joinByCode(
    userId: string,
    pairingCode: string,
    ipAddress = '127.0.0.1',
  ): Promise<JoinResponse> {
    // Abuse protection: 5 failures / 15 minutes per user + IP
    this.rateLimiter.consume(`pair-code:${userId}:${ipAddress}`, {
      max: INVITATION_CONFIG.PAIRING_ATTEMPT_MAX,
      windowMs: INVITATION_CONFIG.PAIRING_ATTEMPT_WINDOW_MS,
    });

    const existingMembership = await this.prisma.coupleMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (existingMembership) {
      throw new ConflictException(
        'You already hold an active couple space membership',
      );
    }

    const normalized = pairingCode.trim().toUpperCase();
    const hmac = hmacPairingCode(normalized, this.hmacSecret);

    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.coupleInvitation.findUnique({
        where: { pairingCodeHmac: hmac },
        include: {
          coupleSpace: {
            include: {
              memberships: true,
            },
          },
        },
      });

      // Timing-safe constant comparison
      const matches = invitation
        ? timingSafeCompare(hmac, invitation.pairingCodeHmac)
        : timingSafeCompare(hmac, hmac);

      if (
        !matches ||
        !invitation ||
        invitation.status !== 'PENDING' ||
        invitation.expiresAt <= new Date()
      ) {
        // Constant error message to prevent enumeration of codes
        throw new BadRequestException('Invalid or expired pairing code');
      }

      if (invitation.coupleSpace.status !== 'PENDING') {
        throw new ConflictException(
          'Couple space is already active or archived',
        );
      }

      if (invitation.coupleSpace.memberships.length >= 2) {
        throw new ConflictException('Couple space is already full');
      }

      if (invitation.createdById === userId) {
        throw new BadRequestException(
          'You cannot accept your own invitation',
        );
      }

      const membership = await tx.coupleMembership.create({
        data: {
          userId,
          coupleSpaceId: invitation.coupleSpaceId,
          role: 'PARTNER',
          status: 'ACTIVE',
        },
      });

      await tx.coupleInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: userId,
          acceptedAt: new Date(),
        },
      });

      const space = await tx.coupleSpace.update({
        where: { id: invitation.coupleSpaceId },
        data: {
          status: 'ACTIVE',
        },
      });

      return {
        coupleSpace: {
          id: space.id,
          name: space.name,
          status: space.status,
        },
        membership: {
          id: membership.id,
          role: membership.role,
          status: membership.status,
        },
      };
    });
  }
}
