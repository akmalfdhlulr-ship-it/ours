import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  ChangePasswordResponse,
  UserMeResponse,
  UserMembershipItem,
} from '@ours/contracts';
import { PasswordService } from '../auth/password.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async getMe(userId: string): Promise<UserMeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeMembership = await this.prisma.coupleMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      profile: {
        displayName: user.profile?.displayName ?? '',
        avatarUrl: user.profile?.avatarUrl ?? null,
        dateOfBirth: user.profile?.dateOfBirth
          ? user.profile.dateOfBirth.toISOString().split('T')[0]
          : null,
        timezone: user.profile?.timezone ?? 'UTC',
      },
      activeMembership: activeMembership
        ? {
            coupleSpaceId: activeMembership.coupleSpaceId,
            role: activeMembership.role,
            status: activeMembership.status,
            joinedAt: activeMembership.joinedAt.toISOString(),
          }
        : null,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserMeResponse['profile']> {
    const data: {
      displayName?: string;
      dateOfBirth?: Date;
      timezone?: string;
    } = {};

    if (dto.displayName !== undefined) {
      data.displayName = dto.displayName.trim();
    }
    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth = new Date(dto.dateOfBirth);
    }
    if (dto.timezone !== undefined) {
      data.timezone = dto.timezone.trim();
    }

    const updatedProfile = await this.prisma.userProfile.update({
      where: { userId },
      data,
    });

    return {
      displayName: updatedProfile.displayName,
      avatarUrl: updatedProfile.avatarUrl,
      dateOfBirth: updatedProfile.dateOfBirth
        ? updatedProfile.dateOfBirth.toISOString().split('T')[0]
        : null,
      timezone: updatedProfile.timezone,
    };
  }

  async changePassword(
    userId: string,
    currentSessionId: string,
    dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidCurrent = await this.passwordService.verifyPassword(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isValidCurrent) {
      throw new BadRequestException('Current password does not match');
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword);

    // Atomic transaction: update password and revoke all other sessions
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
        },
      }),
      this.prisma.session.deleteMany({
        where: {
          userId,
          id: { not: currentSessionId },
        },
      }),
    ]);

    return { updated: true };
  }

  async getMemberships(userId: string): Promise<UserMembershipItem[]> {
    const memberships = await this.prisma.coupleMembership.findMany({
      where: { userId },
      include: {
        coupleSpace: true,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return memberships.map((m) => ({
      id: m.id,
      coupleSpaceId: m.coupleSpaceId,
      spaceName: m.coupleSpace.name,
      status: m.status,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      archivedAt: m.archivedAt ? m.archivedAt.toISOString() : null,
    }));
  }
}
