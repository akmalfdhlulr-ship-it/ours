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

  // API Versioning and Prefix
  app.setGlobalPrefix('api/v1');

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:8081',
        'http://localhost:19006',
        'http://localhost:3000',
        /^http:\/\/localhost:\d+$/,
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Correlation-ID',
      'X-Requested-With',
      'Accept',
    ],
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
  await app.listen(port);

  logger.log(`OURS API started successfully on port ${port} (prefix: /api/v1)`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap failure:', err);
  process.exit(1);
});
