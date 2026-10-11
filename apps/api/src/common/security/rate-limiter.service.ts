import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface RateLimitConfig {
  max: number;
  windowMs: number;
}

@Injectable()
export class RateLimiterService {
  private readonly hits = new Map<string, number[]>();

  consume(key: string, config: RateLimitConfig): void {
    const now = Date.now();
    const timestamps = this.hits.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < config.windowMs);

    if (validTimestamps.length >= config.max) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    validTimestamps.push(now);
    this.hits.set(key, validTimestamps);

    // Housekeeping to prevent memory leak
    if (this.hits.size > 10000) {
      this.cleanup(now);
    }
  }

  private cleanup(now: number): void {
    for (const [key, timestamps] of this.hits.entries()) {
      const active = timestamps.filter((t) => now - t < 3600000); // 1 hour max window
      if (active.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, active);
      }
    }
  }
}
