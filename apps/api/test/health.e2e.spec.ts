import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@ours/database';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Health Endpoints (E2E / Contract)', () => {
  let app: INestApplication;
  let mockPrismaService: {
    checkHealth: jest.Mock;
    $connect: jest.Mock;
    $disconnect: jest.Mock;
  };

  beforeAll(async () => {
    mockPrismaService = {
      checkHealth: jest.fn().mockResolvedValue(true),
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
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

  describe('GET /api/v1/health/live', () => {
    it('should return 200 OK with process liveness and X-Correlation-ID header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.headers).toHaveProperty('x-correlation-id');
      expect(mockPrismaService.checkHealth).not.toHaveBeenCalled();
    });

    it('should preserve incoming X-Correlation-ID header', async () => {
      const customCorrelationId = 'test-correlation-id-12345';
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .set('X-Correlation-ID', customCorrelationId)
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe(customCorrelationId);
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('should return 200 OK when database dependency is healthy', async () => {
      mockPrismaService.checkHealth.mockResolvedValueOnce(true);

      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        checks: {
          database: 'healthy',
        },
      });
      expect(mockPrismaService.checkHealth).toHaveBeenCalled();
    });

    it('should return 503 Service Unavailable when database dependency fails', async () => {
      mockPrismaService.checkHealth.mockResolvedValueOnce(false);

      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(503);

      expect(response.body.error).toHaveProperty('code', 'ServiceUnavailableException');
      expect(response.body).toHaveProperty('correlationId');
      expect(response.body.error.details).toEqual({
        status: 'error',
        timestamp: expect.any(String),
        checks: {
          database: 'unhealthy',
        },
      });
    });
  });
});
