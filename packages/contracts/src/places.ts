export interface PlaceItem {
  id: string;
  provider: string | null;
  providerPlaceId: string | null;
  name: string;
  address: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata?: Record<string, any> | null;
  isSaved?: boolean;
}

export interface SearchPlacesQuery {
  query?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
}

export interface SavePlaceRequest {
  placeId: string;
  notes?: string;
}

export interface SavedPlaceItem {
  id: string;
  placeId: string;
  place: PlaceItem;
  notes: string | null;
  savedAt: string;
}

export interface CreateManualPlaceRequest {
  name: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
}
