import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageAdapter, UploadFileOptions, UploadResult } from './storage.interface';

@Injectable()
export class CloudinaryStorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(CloudinaryStorageAdapter.name);
  private readonly cloudName?: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>('cloudinaryCloudName') || process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = this.configService.get<string>('cloudinaryApiKey') || process.env.CLOUDINARY_API_KEY;
    this.apiSecret = this.configService.get<string>('cloudinaryApiSecret') || process.env.CLOUDINARY_API_SECRET;

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Cloudinary credentials missing in production environment');
      }
      this.logger.warn('Cloudinary credentials incomplete in development; calls will fail if invoked');
    }
  }

  async upload(buffer: Buffer, options: UploadFileOptions): Promise<UploadResult> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary adapter is not fully configured with credentials');
    }

    const publicId = `${options.coupleSpaceId}/${options.folder || 'general'}/${options.filename || Date.now()}`;
    this.logger.log(`[Cloudinary] Mock upload simulated for ${publicId} (${buffer.length} bytes)`);

    return {
      storageKey: publicId,
      url: `https://res.cloudinary.com/${this.cloudName}/image/upload/${publicId}`,
      bytes: buffer.length,
      format: options.mimeType.split('/')[1] || 'bin',
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    this.logger.log(`[Cloudinary] Mock delete simulated for ${storageKey}`);
    return true;
  }

  getUrl(storageKey: string): string {
    return `https://res.cloudinary.com/${this.cloudName || 'ours'}/image/upload/${storageKey}`;
  }
}
