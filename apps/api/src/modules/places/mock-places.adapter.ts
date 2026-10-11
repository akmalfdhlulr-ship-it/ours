import { Injectable } from '@nestjs/common';
import { PlacePort, ProviderPlaceResult } from './places.port';

const MOCK_FIXTURES: ProviderPlaceResult[] = [
  {
    provider: 'fixtures',
    providerPlaceId: 'fixture_place_01',
    name: 'Bistro Lilin Klasik Dharmawangsa',
    address: 'Jl. Dharmawangsa Raya No. 14, Jakarta Selatan',
    category: 'Kuliner',
    latitude: -6.2558,
    longitude: 106.7972,
    metadata: {
      atmosphere: 'Cahaya lilin hangat, interior kayu klasik, makan malam intim',
      priceLevel: 'RpRpRp',
      cuisine: 'Fine Dining Nusantara & Kontemporer',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'fixture_place_02',
    name: 'Taman Kaca & Rumah Botanika Dago',
    address: 'Jl. Dago Pakar Utara No. 57, Bandung',
    category: 'Alam',
    latitude: -6.8524,
    longitude: 107.6321,
    metadata: {
      atmosphere: 'Dikelilingi tanaman asri, udara pegunungan sejuk, cahaya senja emas',
      bestTime: 'Senja Hari (16:00 - 18:00)',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'fixture_place_03',
    name: 'Observatorium Bintang & Langit Malam',
    address: 'Kawasan Wisata Dataran Tinggi Lembang',
    category: 'Budaya',
    latitude: -6.8185,
    longitude: 107.6152,
    metadata: {
      atmosphere: 'Kubah langit gelap bertabur bintang, teropong rasi bintang berdua',
      featuredEvent: 'Malam Observasi Pasangan Bawah Bintang',
      imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'fixture_place_04',
    name: 'The Velvet Cellar Jazz Lounge',
    address: 'Jl. Senopati No. 22, Kebayoran Baru',
    category: 'Hiburan Malam',
    latitude: -6.2309,
    longitude: 106.8105,
    metadata: {
      atmosphere: 'Lampu temaram vintage, alunan jazz akustik live, mocktail artisan',
      imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'fixture_place_05',
    name: 'Studio Keramik & Tembikar Pasangan',
    address: 'Jl. Kemang Timur No. 10, Jakarta Selatan',
    category: 'Aktivitas',
    latitude: -6.2718,
    longitude: 106.8193,
    metadata: {
      atmosphere: 'Kreatif & menyenangkan, membuat cangkir keramik berdua dengan tanah liat',
      duration: '2 Jam',
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'fixture_place_06',
    name: 'Tebing Panorama Senja Uluwatu',
    address: 'Pecatu, Kuta Selatan, Badung, Bali',
    category: 'Pemandangan',
    latitude: -8.8291,
    longitude: 115.0849,
    metadata: {
      atmosphere: 'Angin laut lepas, cakrawala matahari terbenam dramatis, gazebo pribadi',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      rating: 5.0,
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'fixture_place_07',
    name: 'Atelier Racik Parfum Aroma Berdua',
    address: 'Jl. Gunawarman No. 3, Jakarta Selatan',
    category: 'Aktivitas',
    latitude: -6.2372,
    longitude: 106.8094,
    metadata: {
      atmosphere: 'Meracik aroma wewangian khas yang menjadi simbol kenangan cinta kita',
      duration: '90 Menit',
      imageUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      mocked: true,
    },
  },
];

@Injectable()
export class MockPlacesAdapter implements PlacePort {
  async searchPlaces(
    query?: string,
    category?: string,
  ): Promise<ProviderPlaceResult[]> {
    let results = [...MOCK_FIXTURES];

    if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'semua') {
      const catLower = category.toLowerCase();
      results = results.filter((p) => p.category.toLowerCase().includes(catLower));
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    return results;
  }

  async getPlaceDetails(providerPlaceId: string): Promise<ProviderPlaceResult | null> {
    const match = MOCK_FIXTURES.find((p) => p.providerPlaceId === providerPlaceId);
    return match || null;
  }
}
