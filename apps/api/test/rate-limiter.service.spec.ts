import { RateLimiterService } from '../src/common/security/rate-limiter.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('RateLimiterService', () => {
  let rateLimiter: RateLimiterService;

  beforeEach(() => {
    rateLimiter = new RateLimiterService();
  });

  it('should allow requests below the maximum limit', () => {
    expect(() => {
      rateLimiter.consume('test:key', { max: 3, windowMs: 1000 });
      rateLimiter.consume('test:key', { max: 3, windowMs: 1000 });
      rateLimiter.consume('test:key', { max: 3, windowMs: 1000 });
    }).not.toThrow();
  });

  it('should throw 429 TOO_MANY_REQUESTS when limit is exceeded', () => {
    rateLimiter.consume('test:key2', { max: 2, windowMs: 1000 });
    rateLimiter.consume('test:key2', { max: 2, windowMs: 1000 });

    try {
      rateLimiter.consume('test:key2', { max: 2, windowMs: 1000 });
      fail('Expected HttpException 429');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(HttpException);
      const httpErr = err as HttpException;
      expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const res = httpErr.getResponse() as Record<string, unknown>;
      expect(res.error).toBe('TOO_MANY_REQUESTS');
    }
  });

  it('should track limits independently for different keys', () => {
    rateLimiter.consume('ip:1', { max: 1, windowMs: 1000 });
    expect(() => {
      rateLimiter.consume('ip:2', { max: 1, windowMs: 1000 });
    }).not.toThrow();
  });
});
