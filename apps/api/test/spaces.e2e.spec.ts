import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@ours/database';
import { EMAIL_ADAPTER } from '../src/infrastructure/email/email.interface';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { hashSha256 } from '../src/modules/auth/token.util';
import {
  hashInvitationToken,
  hmacPairingCode,
} from '../src/modules/spaces/invitation.util';

describe('Couple Spaces & Pairing Endpoints (E2E Contract)', () => {
  let app: INestApplication;
  let mockPrismaService: any;
  let mockEmailAdapter: any;

  const userA = 'user-a-1111-1111-1111-111111111111';
  const userB = 'user-b-2222-2222-2222-222222222222';
  const rawSessionA = 'session-token-user-a-64-character-length-hex-entropy-test-string-01';
  const rawSessionB = 'session-token-user-b-64-character-length-hex-entropy-test-string-02';
  const spaceId = 'space-test-1111-2222-3333-444444444444';
  const hmacSecret = 'dev-hmac-secret-min-32-chars-long-local-env';

  beforeAll(async () => {
    mockEmailAdapter = {
      send: jest.fn().mockResolvedValue(true),
    };

    mockPrismaService = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      checkHealth: jest.fn().mockResolvedValue(true),
      user: {
        findUnique: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      coupleSpace: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      coupleMembership: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      coupleInvitation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(EMAIL_ADAPTER)
      .useValue(mockEmailAdapter)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default session authentication mock
    mockPrismaService.session.findUnique.mockImplementation(({ where }: any) => {
      if (where.tokenHash === hashSha256(rawSessionA)) {
        return Promise.resolve({
          id: 'sess-a',
          userId: userA,
          expiresAt: new Date(Date.now() + 86400000),
          lastActiveAt: new Date(),
          user: { id: userA, email: 'usera@ours.com', emailVerified: true, status: 'ACTIVE' },
        });
      }
      if (where.tokenHash === hashSha256(rawSessionB)) {
        return Promise.resolve({
          id: 'sess-b',
          userId: userB,
          expiresAt: new Date(Date.now() + 86400000),
          lastActiveAt: new Date(),
          user: { id: userB, email: 'userb@ours.com', emailVerified: true, status: 'ACTIVE' },
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('POST /api/v1/spaces', () => {
    it('creates a new PENDING couple space for verified user', async () => {
      mockPrismaService.coupleMembership.findFirst.mockResolvedValue(null);

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleSpace: {
            create: jest.fn().mockResolvedValue({
              id: spaceId,
              name: 'Taylor & Jordan',
              status: 'PENDING',
              currencyCode: 'USD',
              timezone: 'America/New_York',
              anniversaryDate: new Date('2023-08-15'),
            }),
          },
          coupleMembership: {
            create: jest.fn().mockResolvedValue({
              id: 'mem-a',
              role: 'CREATOR',
              status: 'ACTIVE',
            }),
          },
        });
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/spaces')
        .set('Authorization', `Bearer ${rawSessionA}`)
        .send({
          name: 'Taylor & Jordan',
          currencyCode: 'USD',
          anniversaryDate: '2023-08-15',
          timezone: 'America/New_York',
        })
        .expect(201);

      expect(res.body.data.id).toBe(spaceId);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.membership.role).toBe('CREATOR');
    });

    it('rejects space creation if user already holds active membership', async () => {
      mockPrismaService.coupleMembership.findFirst.mockResolvedValue({
        id: 'mem-existing',
        status: 'ACTIVE',
      });

      await request(app.getHttpServer())
        .post('/api/v1/spaces')
        .set('Authorization', `Bearer ${rawSessionA}`)
        .send({ name: 'Duplicate Space' })
        .expect(409);
    });
  });

  describe('POST /api/v1/spaces/:spaceId/invitations', () => {
    it('generates an invitation token and pairing code for pending space', async () => {
      mockPrismaService.coupleMembership.findFirst.mockResolvedValue({
        id: 'mem-a',
        userId: userA,
        coupleSpaceId: spaceId,
        status: 'ACTIVE',
        coupleSpace: { id: spaceId, status: 'PENDING' },
      });

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleInvitation: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            create: jest.fn().mockResolvedValue({
              id: 'inv-1',
              status: 'PENDING',
              expiresAt: new Date(Date.now() + 72 * 3600000),
            }),
          },
        });
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/spaces/${spaceId}/invitations`)
        .set('Authorization', `Bearer ${rawSessionA}`)
        .expect(201);

      expect(res.body.data.id).toBe('inv-1');
      expect(res.body.data.token).toHaveLength(64);
      expect(res.body.data.pairingCode).toHaveLength(6);
      expect(res.body.data.inviteUrl).toContain('/join?token=');
    });
  });

  describe('GET /api/v1/invitations/:token/preview', () => {
    it('returns invitation details without authentication or sensitive hashes', async () => {
      const rawToken = 'sample-invitation-token-64-character-hex-string-for-preview-test-01';
      const tokenHash = hashInvitationToken(rawToken);

      mockPrismaService.coupleInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        tokenHash,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 3600000),
        coupleSpace: { name: 'Taylor & Jordan' },
        createdBy: {
          email: 'usera@ours.com',
          profile: { displayName: 'Taylor' },
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/invitations/${rawToken}/preview`)
        .expect(200);

      expect(res.body.data.spaceName).toBe('Taylor & Jordan');
      expect(res.body.data.createdByName).toBe('Taylor');
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.token).toBeUndefined();
      expect(res.body.data.pairingCode).toBeUndefined();
    });
  });

  describe('POST /api/v1/spaces/join', () => {
    it('pairs partner user and activates couple space', async () => {
      mockPrismaService.coupleMembership.findFirst.mockResolvedValue(null);

      const rawToken = 'join-partner-token-64-char-hex-length-for-e2e-pairing-test-000001';

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          coupleInvitation: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'inv-1',
              coupleSpaceId: spaceId,
              status: 'PENDING',
              createdById: userA,
              expiresAt: new Date(Date.now() + 3600000),
              coupleSpace: {
                id: spaceId,
                name: 'Taylor & Jordan',
                status: 'PENDING',
                memberships: [{ id: 'mem-a', userId: userA }],
              },
            }),
            update: jest.fn().mockResolvedValue({ id: 'inv-1', status: 'ACCEPTED' }),
          },
          coupleMembership: {
            create: jest.fn().mockResolvedValue({
              id: 'mem-b',
              role: 'PARTNER',
              status: 'ACTIVE',
            }),
          },
          coupleSpace: {
            update: jest.fn().mockResolvedValue({
              id: spaceId,
              name: 'Taylor & Jordan',
              status: 'ACTIVE',
            }),
          },
        });
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/spaces/join')
        .set('Authorization', `Bearer ${rawSessionB}`)
        .send({ token: rawToken })
        .expect(200);

      expect(res.body.data.coupleSpace.status).toBe('ACTIVE');
      expect(res.body.data.membership.role).toBe('PARTNER');
    });
  });

  describe('POST /api/v1/spaces/:spaceId/archive', () => {
    it('requires confirmation phrase ARCHIVE and unpairs space', async () => {
      mockPrismaService.coupleMembership.findFirst.mockResolvedValue({
        id: 'mem-a',
        userId: userA,
        coupleSpaceId: spaceId,
        status: 'ACTIVE',
        coupleSpace: { id: spaceId, status: 'ACTIVE' },
      });

      mockPrismaService.$transaction.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/spaces/${spaceId}/archive`)
        .set('Authorization', `Bearer ${rawSessionA}`)
        .send({ confirmationPhrase: 'ARCHIVE' })
        .expect(200);

      expect(res.body.data.status).toBe('ARCHIVED');
      expect(res.body.data.spaceId).toBe(spaceId);
    });

    it('rejects unpair if confirmation phrase is incorrect', async () => {
      mockPrismaService.coupleMembership.findFirst.mockResolvedValue({
        id: 'mem-a',
        userId: userA,
        coupleSpaceId: spaceId,
        status: 'ACTIVE',
        coupleSpace: { id: spaceId, status: 'ACTIVE' },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/spaces/${spaceId}/archive`)
        .set('Authorization', `Bearer ${rawSessionA}`)
        .send({ confirmationPhrase: 'yes' })
        .expect(400);
    });
  });
});
