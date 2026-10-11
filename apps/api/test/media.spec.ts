import { ConfigService } from '@nestjs/config';
import { CloudinaryAdapter } from '../src/modules/media/cloudinary.adapter';

describe('CloudinaryAdapter (Media Storage & Signing)', () => {
  let adapter: CloudinaryAdapter;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'test-cloud';
        if (key === 'CLOUDINARY_API_KEY') return 'test-key-123';
        if (key === 'CLOUDINARY_API_SECRET') return 'test-secret-456';
        return undefined;
      }),
    };
    adapter = new CloudinaryAdapter(mockConfigService as ConfigService);
  });

  it('should generate real Cloudinary signed upload parameters', async () => {
    const res = await adapter.generateUploadSignature('couples/space-1/memories/img-1.jpg', 'image/jpeg');

    expect(res.uploadUrl).toBe('https://api.cloudinary.com/v1_1/test-cloud/auto/upload');
    expect(res.uploadParams.public_id).toBe('couples/space-1/memories/img-1.jpg');
    expect(res.uploadParams.api_key).toBe('test-key-123');
    expect(res.uploadParams.type).toBe('authenticated');
    expect(typeof res.uploadParams.signature).toBe('string');
    expect(res.uploadParams.signature.length).toBe(64); // SHA-256 hex
    expect(typeof res.uploadParams.timestamp).toBe('number');
  });

  it('should generate private authenticated delivery URL with signature', async () => {
    const url = await adapter.generatePrivateDeliveryUrl('couples/space-1/memories/img-1.jpg');

    expect(url).toContain('https://res.cloudinary.com/test-cloud/image/authenticated/s--');
    expect(url).toContain('--/couples/space-1/memories/img-1.jpg');
  });

  it('should fall back gracefully to local dev endpoint when credentials are not configured', async () => {
    const emptyConfigService: Partial<ConfigService> = {
      get: jest.fn().mockReturnValue(undefined),
    };
    const devAdapter = new CloudinaryAdapter(emptyConfigService as ConfigService);
    // In dev without credentials, it falls back to local route
    const res = await devAdapter.generateUploadSignature('test-key', 'image/png');
    expect(res.uploadUrl).toBe('/api/v1/media/dev-upload');
    expect(res.uploadParams.mock).toBe(true);

    const deliveryUrl = await devAdapter.generatePrivateDeliveryUrl('test-key');
    expect(deliveryUrl).toBe('/api/v1/media/stream?key=test-key');
  });
});
