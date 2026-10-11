export const PLACE_PORT = 'PLACE_PORT';

export interface ProviderPlaceResult {
  provider: string;
  providerPlaceId: string;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  metadata?: Record<string, any>;
}

export interface PlacePort {
  searchPlaces(
    query?: string,
    category?: string,
    latitude?: number,
    longitude?: number,
  ): Promise<ProviderPlaceResult[]>;

  getPlaceDetails(providerPlaceId: string): Promise<ProviderPlaceResult | null>;
}
