import { Injectable, Logger } from '@nestjs/common';
import { PlacesAdapter, PlaceSearchResult } from './places.interface';

@Injectable()
export class MockPlacesAdapter implements PlacesAdapter {
  private readonly logger = new Logger(MockPlacesAdapter.name);

  async search(query: string): Promise<PlaceSearchResult[]> {
    this.logger.log(`[MockPlacesAdapter] search places for "${query}"`);
    return [
      {
        providerPlaceId: 'mock-place-1',
        name: `${query} Garden Cafe`,
        address: '123 Romantic Boulevard',
        latitude: -6.2088,
        longitude: 106.8456,
        rating: 4.8,
      },
    ];
  }

  async getDetails(providerPlaceId: string): Promise<PlaceSearchResult | null> {
    this.logger.log(`[MockPlacesAdapter] getDetails for ${providerPlaceId}`);
    return {
      providerPlaceId,
      name: 'Sunset Bistro',
      address: '456 Lovers Way',
      latitude: -6.2088,
      longitude: 106.8456,
      rating: 4.9,
    };
  }
}
