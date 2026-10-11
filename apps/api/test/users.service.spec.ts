import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../src/modules/users/users.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let mockPrisma: any;
  let mockPasswordService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userProfile: {
        update: jest.fn(),
      },
      coupleMembership: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      session: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    mockPasswordService = {
      verifyPassword: jest.fn(),
      hashPassword: jest.fn().mockResolvedValue('new-hash-456'),
    };

    usersService = new UsersService(mockPrisma, mockPasswordService);
  });

  describe('getMe', () => {
    it('should return profile and active membership if present', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'alex@example.com',
        emailVerified: true,
        profile: {
          displayName: 'Alex',
          avatarUrl: null,
          dateOfBirth: new Date('1995-03-20'),
          timezone: 'Asia/Jakarta',
        },
      });
      mockPrisma.coupleMembership.findFirst.mockResolvedValue({
        coupleSpaceId: 'cs-1',
        role: 'CREATOR',
        status: 'ACTIVE',
        joinedAt: new Date('2026-01-01'),
      });

      const res = await usersService.getMe('u-1');
      expect(res.email).toBe('alex@example.com');
      expect(res.profile.displayName).toBe('Alex');
      expect(res.profile.dateOfBirth).toBe('1995-03-20');
      expect(res.activeMembership?.coupleSpaceId).toBe('cs-1');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(usersService.getMe('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword (Policy BR-I05)', () => {
    it('should change password and revoke all other sessions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        passwordHash: 'old-hash-123',
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);

      const res = await usersService.changePassword('u-1', 'current-session-id', {
        currentPassword: 'OldValidPass123',
        newPassword: 'NewValidPass456',
      });

      expect(res.updated).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'u-1',
          id: { not: 'current-session-id' },
        },
      });
    });

    it('should throw BadRequestException if current password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        passwordHash: 'old-hash-123',
      });
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      await expect(
        usersService.changePassword('u-1', 'current-session-id', {
          currentPassword: 'WrongPassword',
          newPassword: 'NewValidPass456',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
