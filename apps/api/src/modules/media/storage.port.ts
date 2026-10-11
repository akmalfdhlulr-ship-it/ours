export const STORAGE_PORT = 'STORAGE_PORT';

export interface StoragePort {
  generateUploadSignature(
    storageKey: string,
    mimeType: string,
  ): Promise<{
    uploadUrl: string;
    uploadParams: Record<string, any>;
  }>;

  generatePrivateDeliveryUrl(storageKey: string): Promise<string>;

  deleteObject(storageKey: string): Promise<void>;
}
