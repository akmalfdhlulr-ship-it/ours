import { Injectable, Logger } from '@nestjs/common';
import { StorageAdapter, UploadFileOptions, UploadResult } from './storage.interface';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(LocalStorageAdapter.name);

  async upload(buffer: Buffer, options: UploadFileOptions): Promise<UploadResult> {
    const key = `${options.coupleSpaceId}/${options.folder || 'general'}/${options.filename || Date.now()}`;
    this.logger.log(`[LocalStorage] Uploaded mock file key=${key} size=${buffer.length} bytes`);

    return {
      storageKey: key,
      url: `/uploads/${key}`,
      bytes: buffer.length,
      format: options.mimeType.split('/')[1] || 'bin',
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    this.logger.log(`[LocalStorage] Deleted file key=${storageKey}`);
    return true;
  }

  getUrl(storageKey: string): string {
    return `/uploads/${storageKey}`;
  }
}
