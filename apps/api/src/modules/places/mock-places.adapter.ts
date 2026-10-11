import { Injectable } from '@nestjs/common';
import { PlacePort, ProviderPlaceResult } from './places.port';

const MOCK_FIXTURES: ProviderPlaceResult[] = [
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_social_house',
    name: 'Social House Grand Indonesia',
    address: 'Thamrin, Jakarta Pusat',
    category: 'Restoran',
    latitude: -6.1954,
    longitude: 106.8228,
    metadata: {
      atmosphere: 'Restoran modern hangat dengan pemandangan bundaran HI, cocok untuk kencan santai maupun perayaan',
      priceLevel: 'Rp 100.000 – 200.000 / orang',
      cuisine: 'Western & Asian Modern Dining',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewsCount: '1.2K',
      area: 'Jakarta Pusat',
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_plataran_menteng',
    name: 'Plataran Menteng',
    address: 'Menteng, Jakarta Pusat',
    category: 'Restoran',
    latitude: -6.1912,
    longitude: 106.8315,
    metadata: {
      atmosphere: 'Mansion kolonial klasik nan anggun dengan pohon rindang, interior mewah, dan kuliner warisan nusantara',
      priceLevel: 'Rp 200.000 – 400.000 / orang',
      cuisine: 'Indonesian Heritage Fine Dining',
      imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewsCount: '812',
      area: 'Jakarta Pusat',
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_patio_senopati',
    name: 'Patio Jakarta',
    address: 'Senopati, Jakarta Selatan',
    category: 'Kafe',
    latitude: -6.2341,
    longitude: 106.8123,
    metadata: {
      atmosphere: 'Kafe taman asri bertema rustic Italia dengan pencahayaan hangat, ideal untuk ngobrol intim berdua',
      priceLevel: 'Rp 75.000 – 150.000 / orang',
      cuisine: 'Artisan Coffee, Pastry & Italian Casual',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      rating: 4.5,
      reviewsCount: '620',
      area: 'Jakarta Selatan',
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_oro_italian',
    name: 'ORO Italian Restaurant',
    address: 'Senayan, Jakarta Pusat',
    category: 'Restoran',
    latitude: -6.2238,
    longitude: 106.7995,
    metadata: {
      atmosphere: 'Suasana romantis elegan dengan lilin temaram, wine cellar istimewa, dan pasta buatan tangan segar',
      priceLevel: 'Rp 300.000 – 500.000 / orang',
      cuisine: 'Authentic Italian & Wine Pairings',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewsCount: '1.1K',
      area: 'Jakarta Pusat',
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_oku_kempinski',
    name: 'OKU Jakarta',
    address: 'SCBD, Jakarta Selatan',
    category: 'Restoran',
    latitude: -6.1951,
    longitude: 106.8236,
    metadata: {
      atmosphere: 'Nuansa zen kontemporer Jepang dengan hidangan modern yang memukau dan layanan kelas dunia',
      priceLevel: 'Rp 500.000 – 1.000.000 / orang',
      cuisine: 'Contemporary Japanese Fine Dining',
      imageUrl: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      reviewsCount: '943',
      area: 'Jakarta Selatan',
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_museum_macan',
    name: 'Museum MACAN',
    address: 'Kebon Jeruk, Jakarta Barat',
    category: 'Museum',
    latitude: -6.1908,
    longitude: 106.7681,
    metadata: {
      atmosphere: 'Galeri seni modern & kontemporer kelas dunia, penuh instalasi visual estetik untuk kencan berkesan',
      priceLevel: 'Rp 70.000 – 90.000 / orang',
      cuisine: 'Galeri Seni & Budaya',
      imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewsCount: '3.5K',
      area: 'Jakarta Barat',
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_hutan_kota_gbk',
    name: 'Hutan Kota GBK by Plataran',
    address: 'Senayan, Jakarta Pusat',
    category: 'Taman',
    latitude: -6.2201,
    longitude: 106.8045,
    metadata: {
      atmosphere: 'Oase hijau terbuka berlatar belakang gedung pencakar langit Jakarta, sangat cocok untuk piknik sore',
      priceLevel: 'Rp 50.000 – 100.000 / orang',
      cuisine: 'Taman Terbuka & Kafe Santai',
      imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewsCount: '5.4K',
      area: 'Jakarta Pusat',
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_taman_suropati',
    name: 'Taman Suropati',
    address: 'Menteng, Jakarta Pusat',
    category: 'Taman',
    latitude: -6.1996,
    longitude: 106.8327,
    metadata: {
      atmosphere: 'Pohon trembesi teduh, air mancur, burung merpati, dan musisi akustik biola di akhir pekan',
      priceLevel: 'Gratis',
      cuisine: 'Taman Publik Bersejarah',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewsCount: '2.8K',
      area: 'Jakarta Pusat',
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_moja_museum',
    name: 'MoJA Museum',
    address: 'Gelora Bung Karno, Jakarta Pusat',
    category: 'Aktivitas',
    latitude: -6.2185,
    longitude: 106.8012,
    metadata: {
      atmosphere: 'Aktivitas seru bermain sepatu roda retro dan melukis kanvas bersama pasangan di ruangan penuh warna',
      priceLevel: 'Rp 125.000 – 140.000 / orang',
      cuisine: 'Roller Skate & Interactive Art',
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewsCount: '1.9K',
      area: 'Jakarta Pusat',
      mocked: true,
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_henshin_westin',
    name: 'Henshin The Westin',
    address: 'Kuningan, Jakarta Selatan',
    category: 'Restoran',
    latitude: -6.2234,
    longitude: 106.8306,
    metadata: {
      atmosphere: 'Restoran lantai 67 tertinggi dengan panorama 360 derajat gemerlap lampu malam kota Jakarta',
      priceLevel: 'Rp 350.000 – 700.000 / orang',
      cuisine: 'Nikkei Peruvian-Japanese Cuisine',
      imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      reviewsCount: '2.1K',
      area: 'Jakarta Selatan',
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
