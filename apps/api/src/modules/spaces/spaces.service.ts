import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@ours/database';
import { UNPAIR_CONFIG } from '@ours/core';
import {
  ArchivedSpaceMetadata,
  ArchiveSpaceResponse,
  CreateSpaceResponse,
  SpaceDetails,
} from '@ours/contracts';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { ArchiveSpaceDto } from './dto/archive-space.dto';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async createSpace(userId: string, dto: CreateSpaceDto): Promise<CreateSpaceResponse> {
    // Check if user already holds any ACTIVE couple membership
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

    const anniversaryDate = dto.anniversaryDate ? new Date(dto.anniversaryDate) : null;
    const currencyCode = dto.currencyCode?.toUpperCase().trim() || 'USD';
    const name = dto.name?.trim() || null;
    const timezone = dto.timezone?.trim() || null;

    // Transactionally create PENDING space and CREATOR membership
    const result = await this.prisma.$transaction(async (tx) => {
      const space = await tx.coupleSpace.create({
        data: {
          name,
          currencyCode,
          anniversaryDate,
          timezone,
          status: 'PENDING',
        },
      });

      const membership = await tx.coupleMembership.create({
        data: {
          userId,
          coupleSpaceId: space.id,
          role: 'CREATOR',
          status: 'ACTIVE',
        },
      });

      return { space, membership };
    });

    return {
      id: result.space.id,
      name: result.space.name,
      status: result.space.status,
      currencyCode: result.space.currencyCode,
      timezone: result.space.timezone,
      anniversaryDate: result.space.anniversaryDate
        ? result.space.anniversaryDate.toISOString().split('T')[0]
        : null,
      membership: {
        id: result.membership.id,
        role: result.membership.role,
        status: result.membership.status,
      },
    };
  }

  async getSpace(userId: string, spaceId: string): Promise<SpaceDetails> {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { id: spaceId },
      include: {
        memberships: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Couple space not found');
    }

    const isMember = space.memberships.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException(
        'You do not have access to this couple space',
      );
    }

    return this.mapSpaceDetails(space);
  }

  async getCurrentSpace(userId: string): Promise<SpaceDetails | null> {
    const membership = await this.prisma.coupleMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        coupleSpace: {
          include: {
            memberships: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return null;
    }

    return this.mapSpaceDetails(membership.coupleSpace);
  }

  async updateSpace(
    userId: string,
    spaceId: string,
    dto: UpdateSpaceDto,
  ): Promise<SpaceDetails> {
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

    if (membership.coupleSpace.status === 'ARCHIVED') {
      throw new ForbiddenException(
        'Archived spaces cannot be modified',
      );
    }

    const data: {
      name?: string | null;
      currencyCode?: string;
      anniversaryDate?: Date | null;
      timezone?: string | null;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim() || null;
    }
    if (dto.currencyCode !== undefined) {
      data.currencyCode = dto.currencyCode.toUpperCase().trim();
    }
    if (dto.anniversaryDate !== undefined) {
      data.anniversaryDate = dto.anniversaryDate ? new Date(dto.anniversaryDate) : null;
    }
    if (dto.timezone !== undefined) {
      data.timezone = dto.timezone.trim() || null;
    }

    const updated = await this.prisma.coupleSpace.update({
      where: { id: spaceId },
      data,
      include: {
        memberships: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    return this.mapSpaceDetails(updated);
  }

  async archiveSpace(
    userId: string,
    spaceId: string,
    dto: ArchiveSpaceDto,
  ): Promise<ArchiveSpaceResponse> {
    if (dto.confirmationPhrase !== UNPAIR_CONFIG.CONFIRMATION_PHRASE) {
      throw new BadRequestException(
        `Confirmation phrase must be exactly ${UNPAIR_CONFIG.CONFIRMATION_PHRASE}`,
      );
    }

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

    const now = new Date();

    // Atomic unpair transaction: archive space, archive all memberships, revoke invitations
    await this.prisma.$transaction([
      this.prisma.coupleSpace.update({
        where: { id: spaceId },
        data: { status: 'ARCHIVED' },
      }),
      this.prisma.coupleMembership.updateMany({
        where: { coupleSpaceId: spaceId, status: 'ACTIVE' },
        data: {
          status: 'ARCHIVED',
          archivedAt: now,
        },
      }),
      this.prisma.coupleInvitation.updateMany({
        where: { coupleSpaceId: spaceId, status: 'PENDING' },
        data: { status: 'REVOKED' },
      }),
    ]);

    return {
      spaceId,
      status: 'ARCHIVED',
      archivedAt: now.toISOString(),
    };
  }

  async getArchivedSpaces(userId: string): Promise<ArchivedSpaceMetadata[]> {
    const memberships = await this.prisma.coupleMembership.findMany({
      where: {
        userId,
        status: 'ARCHIVED',
      },
      include: {
        coupleSpace: {
          include: {
            memberships: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        archivedAt: 'desc',
      },
    });

    return memberships.map((m) => ({
      spaceId: m.coupleSpace.id,
      name: m.coupleSpace.name,
      partners: m.coupleSpace.memberships.map(
        (sm) => sm.user.profile?.displayName || sm.user.email,
      ),
      anniversaryDate: m.coupleSpace.anniversaryDate
        ? m.coupleSpace.anniversaryDate.toISOString().split('T')[0]
        : null,
      joinedAt: m.joinedAt.toISOString(),
      archivedAt: m.archivedAt ? m.archivedAt.toISOString() : '',
    }));
  }

  private mapSpaceDetails(space: any): SpaceDetails {
    return {
      id: space.id,
      name: space.name,
      status: space.status,
      currencyCode: space.currencyCode,
      timezone: space.timezone,
      anniversaryDate: space.anniversaryDate
        ? space.anniversaryDate.toISOString().split('T')[0]
        : null,
      quotaUsedBytes: Number(space.quotaUsedBytes),
      physicalStorageBytes: Number(space.physicalStorageBytes),
      activeMediaBytes: 0,
      createdAt: space.createdAt.toISOString(),
      members: space.memberships.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        status: m.status,
        displayName: m.user.profile?.displayName || m.user.email,
        avatarUrl: m.user.profile?.avatarUrl || null,
        joinedAt: m.joinedAt.toISOString(),
      })),
    };
  }
}
