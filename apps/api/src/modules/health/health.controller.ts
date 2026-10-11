import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';
import { LivenessResponse, ReadinessResponse } from '@ours/contracts';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getRootHealth(): LivenessResponse {
    return this.healthService.getLiveness();
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  getLiveness(): LivenessResponse {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async getReadiness(): Promise<ReadinessResponse> {
    return this.healthService.getReadiness();
  }
}
