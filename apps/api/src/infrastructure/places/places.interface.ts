export interface PlaceSearchResult {
  providerPlaceId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
}

export interface PlacesAdapter {
  search(query: string, location?: { lat: number; lng: number }): Promise<PlaceSearchResult[]>;
  getDetails(providerPlaceId: string): Promise<PlaceSearchResult | null>;
}

export const PLACES_ADAPTER = Symbol('PLACES_ADAPTER');
