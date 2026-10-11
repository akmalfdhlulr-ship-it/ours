import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import { LivenessResponse, ReadinessResponse } from '@ours/contracts';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const isDbHealthy = await this.prisma.checkHealth();

    if (!isDbHealthy) {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'unhealthy',
        },
      });
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
      },
    };
  }
}
