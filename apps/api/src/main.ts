import * as dotenv from 'dotenv';
import * as path from 'path';

// Pre-load environment variables across monorepo cwd contexts before NestJS module resolution
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppLogger } from './common/logging/logger.service';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new AppLogger();

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // API Versioning and Prefix (exclude root '/' so visiting domain directly returns status)
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });

  app.getHttpAdapter().get('/', (_req: any, res: any) => {
    res.json({
      name: 'OURS API',
      status: 'online',
      version: '1.0.0',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    });
  });

  // CORS configuration (supports Expo Web preview deployments, mobile, and custom domains)
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`OURS API started successfully on port ${port} (prefix: /api/v1)`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap failure:', err);
  process.exit(1);
});
