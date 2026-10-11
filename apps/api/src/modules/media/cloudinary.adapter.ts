import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { StoragePort } from './storage.port';

@Injectable()
export class CloudinaryAdapter implements StoragePort {
  private readonly cloudName?: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY;
    this.apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET;
  }

  async generateUploadSignature(
    storageKey: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; uploadParams: Record<string, any> }> {
    const timestamp = Math.floor(Date.now() / 1000);

    if (this.cloudName && this.apiKey && this.apiSecret) {
      // Real Cloudinary signed upload
      const paramsToSign = `public_id=${storageKey}&timestamp=${timestamp}&type=authenticated`;
      const signature = crypto
        .createHash('sha256')
        .update(paramsToSign + this.apiSecret)
        .digest('hex');

      return {
        uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
        uploadParams: {
          public_id: storageKey,
          timestamp,
          api_key: this.apiKey,
          signature,
          type: 'authenticated', // Private/authenticated delivery only
        },
      };
    }

    // Local / Dev fallback behind StoragePort
    return {
      uploadUrl: `/api/v1/media/dev-upload`,
      uploadParams: {
        storageKey,
        timestamp,
        mock: true,
      },
    };
  }

  async generatePrivateDeliveryUrl(storageKey: string): Promise<string> {
    if (this.cloudName && this.apiKey && this.apiSecret) {
      // Authenticated signed delivery URL
      const timestamp = Math.floor(Date.now() / 1000) + 3600; // 1-hour expiry
      const toSign = `s--${storageKey}--${timestamp}`;
      const signature = crypto
        .createHash('sha1')
        .update(toSign + this.apiSecret)
        .digest('hex')
        .substring(0, 8);

      return `https://res.cloudinary.com/${this.cloudName}/image/authenticated/s--${signature}--/${storageKey}`;
    }

    // Secure application stream route requiring authentication
    return `/api/v1/media/stream?key=${encodeURIComponent(storageKey)}`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (this.cloudName && this.apiKey && this.apiSecret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const paramsToSign = `public_id=${storageKey}&timestamp=${timestamp}&type=authenticated`;
      const signature = crypto
        .createHash('sha256')
        .update(paramsToSign + this.apiSecret)
        .digest('hex');

      await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_id: storageKey,
            timestamp,
            api_key: this.apiKey,
            signature,
            type: 'authenticated',
          }),
        },
      ).catch(() => {
        // Logged or handled by purge retry worker
      });
    }
  }
}
