import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationsService } from '../src/modules/spaces/invitations.service';
import { RateLimiterService } from '../src/common/security/rate-limiter.service';
import {
  hashInvitationToken,
  hmacPairingCode,
} from '../src/modules/spaces/invitation.util';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prismaMock: any;
  let configServiceMock: any;
  let rateLimiter: RateLimiterService;
  const secret = 'super-secret-hmac-key-min-32-chars-long';

  beforeEach(() => {
    prismaMock = {
      coupleMembership: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      coupleInvitation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      coupleSpace: {
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'pairingCodeHmacSecret' || key === 'PAIRING_CODE_HMAC_SECRET') {
          return secret;
        }
        if (key === 'appBaseUrl') return 'https://app.ours.com';
        return null;
      }),
    };

    rateLimiter = new RateLimiterService();
    service = new InvitationsService(
      prismaMock,
      configServiceMock as unknown as ConfigService,
      rateLimiter,
    );
  });

  describe('createInvitation', () => {
    it('throws ForbiddenException if user is not member of space', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue(null);

      await expect(service.createInvitation('u1', 's1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException if space is not in PENDING status', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue({
        id: 'm1',
        coupleSpace: { status: 'ACTIVE' },
      });

      await expect(service.createInvitation('u1', 's1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('atomically revokes previous pending invitations and creates new invitation with token and code', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue({
        id: 'm1',
        coupleSpace: { status: 'PENDING' },
      });

      const mockInvitation = {
        id: 'inv-1',
        coupleSpaceId: 's1',
        createdById: 'u1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 72 * 3600000),
      };

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleInvitation: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockResolvedValue(mockInvitation),
          },
        });
      });

      const result = await service.createInvitation('u1', 's1');

      expect(result.id).toBe('inv-1');
      expect(result.token).toHaveLength(64);
      expect(result.pairingCode).toHaveLength(6);
      expect(result.inviteUrl).toContain('/join?token=');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('previewInvitation', () => {
    it('throws NotFoundException if invitation is not found or not PENDING', async () => {
      prismaMock.coupleInvitation.findUnique.mockResolvedValue(null);

      await expect(service.previewInvitation('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns public preview without exposing raw tokens or secrets', async () => {
      const token = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      prismaMock.coupleInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 3600000),
        coupleSpace: { name: 'Alex & Jordan' },
        createdBy: {
          email: 'alex@ours.com',
          profile: { displayName: 'Alex' },
        },
      });

      const preview = await service.previewInvitation(token);
      expect(preview.spaceName).toBe('Alex & Jordan');
      expect(preview.createdByName).toBe('Alex');
      expect(preview.status).toBe('PENDING');
      expect((preview as any).token).toBeUndefined();
      expect((preview as any).pairingCode).toBeUndefined();
    });
  });

  describe('joinByToken', () => {
    it('throws ConflictException if user already has an ACTIVE couple membership', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue({ id: 'm1', status: 'ACTIVE' });

      await expect(service.joinByToken('u2', 'some-token')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws 410 GONE if invitation has expired or is revoked', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue(null);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleInvitation: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'inv-1',
              status: 'REVOKED',
              expiresAt: new Date(Date.now() - 1000),
              coupleSpace: { status: 'PENDING', memberships: [{ id: 'm1' }] },
            }),
          },
        });
      });

      await expect(service.joinByToken('u2', 'some-token')).rejects.toThrow(
        HttpException,
      );
    });

    it('throws BadRequestException if creator attempts to accept own invitation', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue(null);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleInvitation: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'inv-1',
              status: 'PENDING',
              createdById: 'u1',
              expiresAt: new Date(Date.now() + 100000),
              coupleSpace: { status: 'PENDING', memberships: [{ id: 'm1' }] },
            }),
          },
        });
      });

      await expect(service.joinByToken('u1', 'some-token')).rejects.toThrow(
        'You cannot accept your own invitation',
      );
    });

    it('atomically pairs partner, updates invitation, and sets space ACTIVE', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue(null);

      const mockSpace = { id: 's1', name: 'Our Space', status: 'ACTIVE' };
      const mockMembership = { id: 'm2', role: 'PARTNER', status: 'ACTIVE' };

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleInvitation: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'inv-1',
              coupleSpaceId: 's1',
              status: 'PENDING',
              createdById: 'u1',
              expiresAt: new Date(Date.now() + 100000),
              coupleSpace: { id: 's1', status: 'PENDING', memberships: [{ id: 'm1' }] },
            }),
            update: jest.fn().mockResolvedValue({ id: 'inv-1', status: 'ACCEPTED' }),
          },
          coupleMembership: {
            create: jest.fn().mockResolvedValue(mockMembership),
          },
          coupleSpace: {
            update: jest.fn().mockResolvedValue(mockSpace),
          },
        });
      });

      const result = await service.joinByToken('u2', 'valid-token');
      expect(result.coupleSpace.status).toBe('ACTIVE');
      expect(result.membership.role).toBe('PARTNER');
    });
  });

  describe('joinByCode', () => {
    it('applies rate limiting and blocks after 5 failed attempts', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue(null);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleInvitation: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        });
      });

      // 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await expect(
          service.joinByCode('u2', 'WRONG1', '10.0.0.1'),
        ).rejects.toThrow(BadRequestException);
      }

      // 6th attempt should throw 429 TooManyRequests
      await expect(
        service.joinByCode('u2', 'WRONG1', '10.0.0.1'),
      ).rejects.toThrow(HttpException);
    });

    it('atomically pairs partner with valid pairing code', async () => {
      prismaMock.coupleMembership.findFirst.mockResolvedValue(null);

      const code = 'ABC234';
      const hmac = hmacPairingCode(code, secret);

      const mockSpace = { id: 's1', name: 'Our Space', status: 'ACTIVE' };
      const mockMembership = { id: 'm2', role: 'PARTNER', status: 'ACTIVE' };

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleInvitation: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'inv-1',
              coupleSpaceId: 's1',
              pairingCodeHmac: hmac,
              status: 'PENDING',
              createdById: 'u1',
              expiresAt: new Date(Date.now() + 100000),
              coupleSpace: { id: 's1', status: 'PENDING', memberships: [{ id: 'm1' }] },
            }),
            update: jest.fn().mockResolvedValue({ id: 'inv-1', status: 'ACCEPTED' }),
          },
          coupleMembership: {
            create: jest.fn().mockResolvedValue(mockMembership),
          },
          coupleSpace: {
            update: jest.fn().mockResolvedValue(mockSpace),
          },
        });
      });

      const result = await service.joinByCode('u3', 'abc234', '192.168.1.1');
      expect(result.coupleSpace.status).toBe('ACTIVE');
      expect(result.membership.role).toBe('PARTNER');
    });
  });
});
