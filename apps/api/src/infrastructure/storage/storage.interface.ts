export interface UploadFileOptions {
  coupleSpaceId: string;
  folder?: string;
  filename?: string;
  mimeType: string;
}

export interface UploadResult {
  storageKey: string;
  url: string;
  bytes: number;
  format: string;
}

export interface StorageAdapter {
  upload(buffer: Buffer, options: UploadFileOptions): Promise<UploadResult>;
  delete(storageKey: string): Promise<boolean>;
  getUrl(storageKey: string): string;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');
