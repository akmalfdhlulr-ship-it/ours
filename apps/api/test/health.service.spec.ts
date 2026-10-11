import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from '../src/modules/health/health.service';
import { PrismaService } from '@ours/database';

describe('HealthService', () => {
  let service: HealthService;
  let mockPrismaService: { checkHealth: jest.Mock };

  beforeEach(async () => {
    mockPrismaService = {
      checkHealth: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  describe('getLiveness', () => {
    it('should return ok with uptime and timestamp without checking database', () => {
      const result = service.getLiveness();
      expect(result.status).toBe('ok');
      expect(typeof result.uptime).toBe('number');
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
      expect(mockPrismaService.checkHealth).not.toHaveBeenCalled();
    });
  });

  describe('getReadiness', () => {
    it('should return ok when database is healthy', async () => {
      mockPrismaService.checkHealth.mockResolvedValue(true);
      const result = await service.getReadiness();
      expect(result.status).toBe('ok');
      expect(result.checks.database).toBe('healthy');
    });

    it('should throw ServiceUnavailableException when database is unhealthy', async () => {
      mockPrismaService.checkHealth.mockResolvedValue(false);
      await expect(service.getReadiness()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
