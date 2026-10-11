import { validateEnvironment } from '../src/config/env.validation';

describe('validateEnvironment', () => {
  it('should validate valid development configuration', () => {
    const config = validateEnvironment({
      NODE_ENV: 'development',
      PORT: '3000',
      STORAGE_DRIVER: 'local',
    });

    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3000);
    expect(config.storageDriver).toBe('local');
  });

  it('should throw error when invalid NODE_ENV provided', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'staging',
      }),
    ).toThrow('Invalid NODE_ENV');
  });

  it('should require DATABASE_URL in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        PAIRING_CODE_HMAC_SECRET: 'a'.repeat(32),
      }),
    ).toThrow('DATABASE_URL is required in production.');
  });

  it('should require PAIRING_CODE_HMAC_SECRET of at least 32 characters in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/db',
        PAIRING_CODE_HMAC_SECRET: 'short-secret',
      }),
    ).toThrow('PAIRING_CODE_HMAC_SECRET must be at least 32 characters long in production.');
  });

  it('should reject invalid STORAGE_DRIVER', () => {
    expect(() =>
      validateEnvironment({
        STORAGE_DRIVER: 's3',
      }),
    ).toThrow('Invalid STORAGE_DRIVER');
  });
});
