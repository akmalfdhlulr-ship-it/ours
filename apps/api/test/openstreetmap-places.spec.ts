import { OpenStreetMapPlacesAdapter } from '../src/modules/places/openstreetmap-places.adapter';

describe('OpenStreetMapPlacesAdapter (Real Indonesian Places Discovery via 3-Layer Architecture)', () => {
  let adapter: OpenStreetMapPlacesAdapter;

  beforeEach(() => {
    adapter = new OpenStreetMapPlacesAdapter();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('Layer B: should normalize Photon OpenStreetMap POI results correctly without fake ratings or prices', async () => {
    const mockPhotonResponse = {
      features: [
        {
          geometry: {
            coordinates: [107.6294, -6.9137], // [lon, lat]
          },
          properties: {
            osm_id: 998877,
            osm_type: 'N',
            osm_key: 'amenity',
            osm_value: 'cafe',
            name: 'Cafe Bali Bandung',
            city: 'Bandung',
            district: 'Merdeka',
            state: 'Jawa Barat',
            country: 'Indonesia',
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPhotonResponse),
    } as any);

    const results = await adapter.searchPlaces('Bandung', 'Kafe');

    expect(results).toHaveLength(1);
    const place = results[0];
    expect(place.provider).toBe('openstreetmap');
    expect(place.providerPlaceId).toBe('osm_998877');
    expect(place.name).toBe('Cafe Bali Bandung');
    expect(place.latitude).toBeCloseTo(-6.9137);
    expect(place.longitude).toBeCloseTo(107.6294);
    expect(place.category).toBe('Kafe');
    expect(place.metadata?.attribution).toBe('© OpenStreetMap contributors');
    expect(place.metadata?.area).toBe('Merdeka');
    // Architectural Invariant: Never invent fake ratings or fake prices
    expect(place.metadata?.rating).toBeUndefined();
    expect(place.metadata?.priceRange).toBeUndefined();
  });

  it('Layer A & B: should fall back to Nominatim single lookup if Photon returns empty for specific venue name', async () => {
    const mockNominatimResult = [
      {
        place_id: 123456,
        osm_id: 78910,
        osm_type: 'node',
        lat: '-6.914744',
        lon: '107.609810',
        display_name: 'Saung Punclut, Cidadap, Bandung, Jawa Barat, 40142, Indonesia',
        type: 'restaurant',
        address: {
          city: 'Bandung',
          state: 'Jawa Barat',
          country: 'Indonesia',
        },
      },
    ];

    // First fetch is Photon (returns empty features), second is Nominatim (returns result)
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ features: [] }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockNominatimResult),
      } as any);

    const results = await adapter.searchPlaces('Saung Punclut', 'Kuliner');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Saung Punclut');
    expect(results[0].providerPlaceId).toBe('osm_78910');
  });

  it('should handle complete search failure gracefully with reference venues', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network unreachable'));

    const results = await adapter.searchPlaces('Jakarta');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].provider).toBe('openstreetmap');
  });
});
