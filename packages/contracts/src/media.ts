export type MediaStatus =
  | 'UPLOADING'
  | 'ACTIVE'
  | 'FAILED'
  | 'DELETED'
  | 'PURGING'
  | 'PURGED';

export interface MediaAssetItem {
  id: string;
  coupleSpaceId: string;
  uploadedById: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  status: MediaStatus;
  secureUrl: string;
  capturedAt: string | null;
  createdAt: string;
}

export interface UploadSignatureRequest {
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface UploadSignatureResponse {
  uploadUrl: string;
  storageKey: string;
  uploadParams?: Record<string, any>;
}

export interface CompleteUploadRequest {
  storageKey: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
}

export interface StorageUsageResponse {
  quotaUsedBytes: number;
  physicalStorageBytes: number;
  activeMediaCount: number;
}
