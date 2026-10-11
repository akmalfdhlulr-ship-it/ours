import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/modules/health/health.controller';
import { HealthService } from '../src/modules/health/health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockHealthService: { getLiveness: jest.Mock; getReadiness: jest.Mock };

  beforeEach(async () => {
    mockHealthService = {
      getLiveness: jest.fn().mockReturnValue({
        status: 'ok',
        timestamp: '2026-10-11T00:00:00.000Z',
        uptime: 10,
      }),
      getReadiness: jest.fn().mockResolvedValue({
        status: 'ok',
        timestamp: '2026-10-11T00:00:00.000Z',
        checks: { database: 'healthy' },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should delegate getLiveness to HealthService', () => {
    const res = controller.getLiveness();
    expect(res.status).toBe('ok');
    expect(mockHealthService.getLiveness).toHaveBeenCalled();
  });

  it('should delegate getReadiness to HealthService', async () => {
    const res = await controller.getReadiness();
    expect(res.status).toBe('ok');
    expect(mockHealthService.getReadiness).toHaveBeenCalled();
  });
});
