import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function bootstrap() {
  const timestamp = new Date().toISOString();
  console.log(
    JSON.stringify({
      timestamp,
      level: 'INFO',
      context: 'WorkerBootstrap',
      message: 'OURS Background Worker process started (Phase 03 Foundation)',
    }),
  );

  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = process.env.REDIS_PORT || 6379;

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      context: 'WorkerBootstrap',
      message: `Redis queue target: ${redisHost}:${redisPort} (Deferred processing mode active)`,
    }),
  );

  // Graceful shutdown handling
  const shutdown = () => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        context: 'WorkerBootstrap',
        message: 'OURS Background Worker shutting down gracefully',
      }),
    );
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal worker error:', err);
  process.exit(1);
});
