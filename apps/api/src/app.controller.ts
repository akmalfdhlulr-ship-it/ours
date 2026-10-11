import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      name: 'OURS API',
      status: 'online',
      version: '1.0.0',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    };
  }
}
