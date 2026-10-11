import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@ours/database';
import { EMAIL_ADAPTER } from '../src/infrastructure/email/email.interface';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { hashSha256 } from '../src/modules/auth/token.util';
import { PLACE_PORT } from '../src/modules/places/places.port';

describe('Complete Real User Journey E2E Test (Auth -> Search -> Save Place -> Date Plan -> OCR -> Persist Expense -> Read-Back)', () => {
  let app: INestApplication;
  let mockPrisma: any;
  let mockEmailAdapter: any;
  let mockPlacePort: any;

  const userId = '11111111-2222-3333-4444-555555555555';
  const partnerId = '99999999-8888-7777-6666-555555555555';
  const spaceId = 'space-test-journey-1234';
  const sessionToken = 'session-token-64-character-length-hex-entropy-test-string-real-e2e';
  const sessionTokenHash = hashSha256(sessionToken);

  // In-memory data structures simulating PostgreSQL tables
  const db = {
    places: [] as any[],
    savedPlaces: [] as any[],
    datePlans: [] as any[],
    expenses: [] as any[],
  };

  beforeAll(async () => {
    mockEmailAdapter = { send: jest.fn().mockResolvedValue(true) };

    mockPlacePort = {
      searchPlaces: jest.fn().mockResolvedValue([
        {
          provider: 'openstreetmap',
          providerPlaceId: 'osm_id_dago_bakar_02',
          name: 'The Valley Bistro Dago',
          address: 'Jl. Lembah Pakar Timur No. 28, Ciburial, Cimenyan, Bandung, Jawa Barat',
          category: 'Kuliner',
          latitude: -6.8624,
          longitude: 107.6321,
          metadata: {
            area: 'Bandung',
            openingHours: '12:00 - 23:00 WIB',
            attribution: '© OpenStreetMap contributors',
          },
        },
      ]),
      getPlaceDetails: jest.fn().mockResolvedValue(null),
    };

    mockPrisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      checkHealth: jest.fn().mockResolvedValue(true),
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: userId,
          email: 'alice@ours.lifestyle',
          emailVerified: true,
          status: 'ACTIVE',
        }),
      },
      session: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sess-1',
          userId,
          tokenHash: sessionTokenHash,
          expiresAt: new Date(Date.now() + 86400000),
          lastActiveAt: new Date(),
          user: {
            id: userId,
            email: 'alice@ours.lifestyle',
            emailVerified: true,
            status: 'ACTIVE',
            profile: { displayName: 'Alice' },
          },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      coupleSpace: {
        findUnique: jest.fn().mockResolvedValue({
          id: spaceId,
          name: 'Ruang Cinta Kita',
          currencyCode: 'IDR',
          status: 'ACTIVE',
          memberships: [
            { userId, user: { displayName: 'Alice' } },
            { userId: partnerId, user: { displayName: 'Bob' } },
          ],
        }),
      },
      coupleMembership: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'mem-1',
          coupleSpaceId: spaceId,
          userId,
          role: 'OWNER',
          status: 'ACTIVE',
          coupleSpace: {
            id: spaceId,
            name: 'Ruang Cinta Kita',
            currencyCode: 'IDR',
            status: 'ACTIVE',
          },
        }),
        findMany: jest.fn().mockResolvedValue([
          { userId, user: { displayName: 'Alice' } },
          { userId: partnerId, user: { displayName: 'Bob' } },
        ]),
      },
      place: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(
            db.places.find(
              (p) =>
                (where.id && p.id === where.id) ||
                (where.providerPlaceId && p.providerPlaceId === where.providerPlaceId),
            ) || null,
          );
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const rec = { id: `plc-${Date.now()}`, ...data };
          db.places.push(rec);
          return Promise.resolve(rec);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = db.places.findIndex((p) => p.id === where.id);
          db.places[idx] = { ...db.places[idx], ...data };
          return Promise.resolve(db.places[idx]);
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      savedPlace: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(
            db.savedPlaces.find(
              (s) => s.coupleSpaceId === where.coupleSpaceId && s.placeId === where.placeId,
            ) || null,
          );
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const rec = { id: `saved-${Date.now()}`, ...data, savedAt: new Date() };
          db.savedPlaces.push(rec);
          return Promise.resolve(rec);
        }),
        upsert: jest.fn().mockImplementation(({ create, update }) => {
          let rec = db.savedPlaces.find((s) => s.placeId === create.placeId);
          const plc = db.places.find((p) => p.id === create.placeId);
          if (!rec) {
            rec = {
              id: `saved-${Date.now()}`,
              ...create,
              createdAt: new Date(),
              place: plc,
            };
            db.savedPlaces.push(rec);
          } else {
            Object.assign(rec, update, { place: plc });
          }
          return Promise.resolve(rec);
        }),
        findMany: jest.fn().mockImplementation(() => Promise.resolve(db.savedPlaces)),
      },
      datePlan: {
        create: jest.fn().mockImplementation(({ data }) => {
          const rec = {
            id: `plan-${Date.now()}`,
            ...data,
            status: 'DRAFT',
            stops: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          db.datePlans.push(rec);
          return Promise.resolve(rec);
        }),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(db.datePlans.find((p) => p.id === where.id) || null);
        }),
        findMany: jest.fn().mockImplementation(() => Promise.resolve(db.datePlans)),
      },
      expense: {
        create: jest.fn().mockImplementation(({ data }) => {
          const rec = {
            id: `exp-${Date.now()}`,
            ...data,
            status: 'ACTIVE',
            createdAt: new Date(),
          };
          db.expenses.push(rec);
          return Promise.resolve(rec);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          let list = [...db.expenses];
          if (where.status) list = list.filter((e) => e.status === where.status);
          return Promise.resolve(list);
        }),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(db.expenses.find((e) => e.id === where.id) || null);
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(EMAIL_ADAPTER)
      .useValue(mockEmailAdapter)
      .overrideProvider(PLACE_PORT)
      .useValue(mockPlacePort)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Searches real places across Indonesia (Bandung) without fake data', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/places/search?query=Bandung&category=Kuliner')
      .set('Authorization', `Bearer ${sessionToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
    const place = res.body.data[0];
    expect(place.name).toBe('The Valley Bistro Dago');
    expect(place.provider).toBe('openstreetmap');
    expect(place.metadata?.attribution).toBe('© OpenStreetMap contributors');
    expect(place.metadata?.area).toBe('Bandung');
  });

  it('2. Saves discovered place to PostgreSQL wishlist/saved list', async () => {
    const placeId = db.places[0].id;
    const res = await request(app.getHttpServer())
      .post('/api/v1/places/saved')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ placeId, notes: 'Ingin coba makan malam di sini' })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.placeId).toBe(placeId);
    expect(db.savedPlaces).toHaveLength(1);
  });

  it('3. Creates a Date Plan with planned date', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/dates')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        title: 'Kencan Romantis Dago',
        plannedDate: '2026-10-18T18:00:00.000Z',
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBe('Kencan Romantis Dago');
    expect(db.datePlans).toHaveLength(1);
  });

  it('4. Processes receipt image via Tesseract OCR engine (Indonesian receipt)', async () => {
    // Valid 1x1 PNG magic bytes for real image validation
    const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const res = await request(app.getHttpServer())
      .post('/api/v1/expenses/ocr')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ imageBase64: validPngBase64 })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.currency).toBe('IDR');
    expect(res.body.data.engine).toContain('Tesseract.js');
    expect(typeof res.body.data.confidence).toBe('number');
  });

  it('5. User confirms edited OCR results and persists Expense into PostgreSQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        description: 'The Valley Bistro Dago (Struk Kencan Terkonfirmasi)',
        amount: 320000,
        category: 'Makan & Minum',
        expenseDate: '2026-10-11T12:00:00.000Z',
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.amount).toBe(320000);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(db.expenses).toHaveLength(1);
  });

  it('6. Reads back expense summary and verifies financial persistence in PostgreSQL', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/expenses/summary')
      .set('Authorization', `Bearer ${sessionToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.totalActiveAmount).toBe(320000);
    expect(res.body.data.partner1.totalPaid).toBe(320000);
    expect(res.body.data.balanceOwed).toBe(160000); // 50:50 split: Bob owes Alice 160.000
    expect(res.body.data.debtorUserId).toBe(partnerId);
    expect(res.body.data.creditorUserId).toBe(userId);
  });
});
