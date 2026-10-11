export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  DATABASE_URL?: string;
  directUrl?: string;
  DIRECT_URL?: string;
  pairingCodeHmacSecret: string;
  PAIRING_CODE_HMAC_SECRET?: string;
  storageDriver: 'local' | 'cloudinary';
  cloudinaryUrl?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
}

export function validateEnvironment(config: Record<string, unknown>): AppConfig {
  const nodeEnv = (config.NODE_ENV as string) || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be 'development', 'production', or 'test'.`);
  }

  const port = parseInt(config.PORT as string, 10) || 3000;
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${config.PORT}. Must be between 1 and 65535.`);
  }

  const databaseUrl = (config.DATABASE_URL as string) || (process.env.DATABASE_URL as string);
  if (!databaseUrl && nodeEnv === 'production') {
    throw new Error('DATABASE_URL is required in production.');
  }

  // Ensure process.env.DATABASE_URL is synchronized if resolved from config file
  if (databaseUrl && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
  }
  if (config.DIRECT_URL && !process.env.DIRECT_URL) {
    process.env.DIRECT_URL = config.DIRECT_URL as string;
  }

  const pairingCodeHmacSecret = (config.PAIRING_CODE_HMAC_SECRET as string) || (process.env.PAIRING_CODE_HMAC_SECRET as string);
  if (nodeEnv === 'production' && (!pairingCodeHmacSecret || pairingCodeHmacSecret.length < 32)) {
    throw new Error('PAIRING_CODE_HMAC_SECRET must be at least 32 characters long in production.');
  }

  const storageDriver = (config.STORAGE_DRIVER as 'local' | 'cloudinary') || 'local';
  if (!['local', 'cloudinary'].includes(storageDriver)) {
    throw new Error(`Invalid STORAGE_DRIVER: ${storageDriver}. Must be 'local' or 'cloudinary'.`);
  }

  if (storageDriver === 'cloudinary' && nodeEnv === 'production') {
    if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
      throw new Error('CLOUDINARY credentials are required when STORAGE_DRIVER is cloudinary in production.');
    }
  }

  return {
    nodeEnv: nodeEnv as 'development' | 'production' | 'test',
    port,
    databaseUrl: databaseUrl || '',
    DATABASE_URL: databaseUrl || '',
    directUrl: config.DIRECT_URL as string | undefined,
    DIRECT_URL: config.DIRECT_URL as string | undefined,
    pairingCodeHmacSecret: pairingCodeHmacSecret || 'dev-hmac-secret-min-32-chars-long-local-env',
    PAIRING_CODE_HMAC_SECRET: pairingCodeHmacSecret || 'dev-hmac-secret-min-32-chars-long-local-env',
    storageDriver,
    cloudinaryUrl: config.CLOUDINARY_URL as string | undefined,
    cloudinaryCloudName: config.CLOUDINARY_CLOUD_NAME as string | undefined,
    cloudinaryApiKey: config.CLOUDINARY_API_KEY as string | undefined,
    cloudinaryApiSecret: config.CLOUDINARY_API_SECRET as string | undefined,
  };
}
