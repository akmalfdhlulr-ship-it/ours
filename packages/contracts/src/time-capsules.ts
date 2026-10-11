export interface TimeCapsuleDto {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  content: string | null;
  unlockAt: string;
  isLocked: boolean;
  mediaCount: number;
  mediaUrls?: string[];
  createdAt: string;
}

export interface CreateTimeCapsuleDto {
  title: string;
  content: string;
  unlockAt: string;
  mediaAssetIds?: string[];
}
