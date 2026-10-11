export interface CreateSpaceRequest {
  name?: string;
  currencyCode?: string;
  anniversaryDate?: string;
  timezone?: string;
}

export interface UpdateSpaceRequest {
  name?: string;
  currencyCode?: string;
  anniversaryDate?: string;
  timezone?: string;
}

export interface SpaceMemberSummary {
  id: string;
  userId: string;
  role: string;
  status: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface SpaceDetails {
  id: string;
  name: string | null;
  status: string;
  currencyCode: string;
  timezone: string | null;
  anniversaryDate: string | null;
  quotaUsedBytes: number;
  physicalStorageBytes: number;
  activeMediaBytes: number;
  createdAt: string;
  members: SpaceMemberSummary[];
}

export interface CreateSpaceResponse {
  id: string;
  name: string | null;
  status: string;
  currencyCode: string;
  timezone: string | null;
  anniversaryDate: string | null;
  membership: {
    id: string;
    role: string;
    status: string;
  };
}

export interface ArchiveSpaceRequest {
  confirmationPhrase: string;
}

export interface ArchiveSpaceResponse {
  spaceId: string;
  status: string;
  archivedAt: string;
}

export interface ArchivedSpaceMetadata {
  spaceId: string;
  name: string | null;
  partners: string[];
  anniversaryDate: string | null;
  joinedAt: string;
  archivedAt: string;
}
