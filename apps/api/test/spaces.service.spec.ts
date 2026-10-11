import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SpacesService } from '../src/modules/spaces/spaces.service';

describe('SpacesService', () => {
  let service: SpacesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      coupleMembership: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      coupleSpace: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      coupleInvitation: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new SpacesService(prismaMock);
  });

  describe('createSpace', () => {
    it('throws ConflictException if user already has an ACTIVE couple membership', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue({ id: 'm1', status: 'ACTIVE' });

      await expect(
        service.createSpace('u1', { name: 'Our Space' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates PENDING space and CREATOR membership within a transaction', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue(null);

      const mockSpace = {
        id: 's1',
        name: 'Our Love',
        currencyCode: 'USD',
        timezone: 'UTC',
        anniversaryDate: new Date('2024-05-20'),
        status: 'PENDING',
      };
      const mockMembership = {
        id: 'm1',
        role: 'CREATOR',
        status: 'ACTIVE',
      };

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleSpace: {
            create: jest.fn().mockResolvedValue(mockSpace),
          },
          coupleMembership: {
            create: jest.fn().mockResolvedValue(mockMembership),
          },
        });
      });

      const result = await service.createSpace('u1', {
        name: 'Our Love',
        currencyCode: 'usd',
        anniversaryDate: '2024-05-20',
        timezone: 'UTC',
      });

      expect(result.id).toBe('s1');
      expect(result.status).toBe('PENDING');
      expect(result.membership.role).toBe('CREATOR');
    });
  });

  describe('getSpace', () => {
    it('throws NotFoundException if space does not exist', async () => {
      prismaMock.coupleSpace.findUnique.mockResolvedValue(null);

      await expect(service.getSpace('u1', 's1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if user is not a member of the space', async () => {
      prismaMock.coupleSpace.findUnique.mockResolvedValue({
        id: 's1',
        memberships: [{ userId: 'other-user' }],
      });

      await expect(service.getSpace('u1', 's1')).rejects.toThrow(ForbiddenException);
    });

    it('returns space details when user is a member', async () => {
      const mockSpace = {
        id: 's1',
        name: 'Our Space',
        status: 'ACTIVE',
        currencyCode: 'USD',
        timezone: 'UTC',
        anniversaryDate: null,
        quotaUsedBytes: BigInt(100),
        physicalStorageBytes: BigInt(200),
        createdAt: new Date(),
        memberships: [
          {
            id: 'm1',
            userId: 'u1',
            role: 'CREATOR',
            status: 'ACTIVE',
            joinedAt: new Date(),
            user: {
              email: 'test@ours.com',
              profile: { displayName: 'Alex', avatarUrl: null },
            },
          },
        ],
      };
      prismaMock.coupleSpace.findUnique.mockResolvedValue(mockSpace);

      const result = await service.getSpace('u1', 's1');
      expect(result.id).toBe('s1');
      expect(result.members).toHaveLength(1);
      expect(result.members[0].displayName).toBe('Alex');
    });
  });

  describe('archiveSpace (unpair)', () => {
    it('throws BadRequestException if confirmation phrase is not ARCHIVE', async () => {
      await expect(
        service.archiveSpace('u1', 's1', { confirmationPhrase: 'delete' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException if user is not active member', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue(null);

      await expect(
        service.archiveSpace('u1', 's1', { confirmationPhrase: 'ARCHIVE' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('atomically archives space, memberships, and revokes invitations', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
        coupleSpaceId: 's1',
        status: 'ACTIVE',
      });
      prismaMock.$transaction.mockResolvedValue([]);

      const result = await service.archiveSpace('u1', 's1', {
        confirmationPhrase: 'ARCHIVE',
      });

      expect(result.status).toBe('ARCHIVED');
      expect(result.spaceId).toBe('s1');
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('getArchivedSpaces', () => {
    it('returns archived spaces metadata list for user', async () => {
      prismaMock.coupleMembership.findMany.mockResolvedValue([
        {
          joinedAt: new Date('2024-01-01'),
          archivedAt: new Date('2024-06-01'),
          coupleSpace: {
            id: 's-old',
            name: 'Old Love',
            anniversaryDate: null,
            memberships: [
              {
                user: {
                  email: 'ex@ours.com',
                  profile: { displayName: 'Sam' },
                },
              },
            ],
          },
        },
      ]);

      const list = await service.getArchivedSpaces('u1');
      expect(list).toHaveLength(1);
      expect(list[0].spaceId).toBe('s-old');
      expect(list[0].partners).toContain('Sam');
    });
  });
});
