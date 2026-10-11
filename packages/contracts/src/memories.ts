import { MediaAssetItem } from './media';

export interface MemoryMediaItem {
  id: string;
  mediaAssetId: string;
  mediaAsset: MediaAssetItem;
  sortOrder: number;
  caption: string | null;
}

export interface MemoryItem {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  description: string | null;
  memoryDate: string;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  linkedVisitId: string | null;
  linkedDatePlanId: string | null;
  isFavorite: boolean;
  media: MemoryMediaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryRequest {
  title: string;
  description?: string;
  memoryDate: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  linkedVisitId?: string;
  linkedDatePlanId?: string;
  isFavorite?: boolean;
  mediaAssetIds?: string[];
}

export interface UpdateMemoryRequest {
  title?: string;
  description?: string;
  memoryDate?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  isFavorite?: boolean;
  mediaAssetIds?: string[];
}

export interface AlbumItem {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  description: string | null;
  coverMediaId: string | null;
  coverMedia?: MediaAssetItem | null;
  memoriesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlbumRequest {
  title: string;
  description?: string;
  coverMediaId?: string;
  memoryIds?: string[];
}

export interface UpdateAlbumRequest {
  title?: string;
  description?: string;
  coverMediaId?: string;
}
