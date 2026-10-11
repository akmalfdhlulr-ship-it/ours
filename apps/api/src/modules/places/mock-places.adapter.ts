import { Injectable } from '@nestjs/common';
import { PlacePort, ProviderPlaceResult } from './places.port';

const MOCK_FIXTURES: ProviderPlaceResult[] = [
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_el_chef',
    name: 'El Chef Restaurant Cafe',
    address: 'Jalan KH Ahmad Dahlan, Kebayoran Baru, Jakarta Selatan',
    category: 'Restoran',
    latitude: -6.2425,
    longitude: 106.7932,
    metadata: {
      atmosphere: 'Suasana bistro Eropa yang intim dan elegan dengan pencahayaan hangat, cocok untuk makan malam berdua',
      priceLevel: 'Rp 100.000 - 200.000',
      cuisine: 'Restoran · Eropa',
      tags: ['Restoran', 'Eropa'],
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      reviewsCount: '320',
      area: 'Jakarta Selatan',
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_gubug_berkah',
    name: 'Gubug Berkah',
    address: 'Jalan Ciater Barat, BSD City, Tangerang Selatan',
    category: 'Kafe Romantis',
    latitude: -6.3156,
    longitude: 106.6892,
    metadata: {
      atmosphere: 'Kafe taman asri bernuansa alam terbuka dengan saung tradisional yang nyaman untuk kencan santai',
      priceLevel: 'Rp 50.000 - 100.000',
      cuisine: 'Kafe · Indonesia',
      tags: ['Kafe', 'Indonesia'],
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      rating: 4.5,
      reviewsCount: '230',
      area: 'Jakarta Selatan',
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_skye_bar',
    name: 'SKYE Bar & Restaurant',
    address: 'Menara BCA Lantai 56, Thamrin, Jakarta Pusat',
    category: 'Restoran',
    latitude: -6.1953,
    longitude: 106.8214,
    metadata: {
      atmosphere: 'Rooftop dining ikonik lantai 56 dengan pemandangan cakrawala malam Jakarta dan cocktail bar mewah',
      priceLevel: 'Rp 200.000 - 500.000',
      cuisine: 'Rooftop · Bar',
      tags: ['Rooftop', 'Bar'],
      imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewsCount: '542',
      area: 'Jakarta Pusat',
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_taman_literasi',
    name: 'Taman Literasi Blok M',
    address: 'Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan',
    category: 'Taman',
    latitude: -6.2443,
    longitude: 106.7978,
    metadata: {
      atmosphere: 'Ruang hijau terbuka publik terintegrasi MRT dengan amfiteater, perpustakaan mini, dan kafe kekinian',
      priceLevel: 'Gratis',
      cuisine: 'Taman · Aktivitas',
      tags: ['Taman', 'Aktivitas'],
      imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewsCount: '412',
      area: 'Jakarta Selatan',
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_harlow',
    name: 'Harlow Jakarta',
    address: 'Jl. Senopati No. 8, Kebayoran Baru, Jakarta Selatan',
    category: 'Restoran',
    latitude: -6.2301,
    longitude: 106.8091,
    metadata: {
      atmosphere: 'Bistro kontemporer di Senopati dengan interior industrial chic hangat, pasta artisanal, dan wine bar',
      priceLevel: 'Rp 150.000 - 300.000',
      cuisine: 'Restoran · Modern Dining',
      tags: ['Restoran'],
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewsCount: '287',
      area: 'Jakarta Selatan',
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_ottera_cafe',
    name: 'Ottera Cafe',
    address: 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan',
    category: 'Kafe Romantis',
    latitude: -6.2335,
    longitude: 106.8112,
    metadata: {
      atmosphere: 'Kafe estetik berkonsep minimalis dengan specialty coffee, artisan pasta, dan tiramisu lezat',
      priceLevel: 'Rp 50.000 - 120.000',
      cuisine: 'Kafe · Makan & Minum',
      tags: ['Kafe', 'Makan & Minum'],
      imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewsCount: '390',
      area: 'Jakarta Selatan',
    },
  },
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
      priceLevel: 'Rp 100.000 - 250.000',
      cuisine: 'Western & Asian Modern Dining',
      tags: ['Restoran', 'Bar'],
      imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewsCount: '1.2K',
      area: 'Jakarta Pusat',
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
      atmosphere: 'Mansion kolonial klasik nan anggun dengan pohon rindang, interior mewah, dan kuliner nusantara',
      priceLevel: 'Rp 200.000 - 400.000',
      cuisine: 'Indonesian Heritage Fine Dining',
      tags: ['Restoran', 'Indonesia'],
      imageUrl: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewsCount: '812',
      area: 'Jakarta Pusat',
    },
  },
  {
    provider: 'fixtures',
    providerPlaceId: 'jkt_museum_macan',
    name: 'Museum MACAN',
    address: 'Kebon Jeruk, Jakarta Barat',
    category: 'Aktivitas',
    latitude: -6.1908,
    longitude: 106.7681,
    metadata: {
      atmosphere: 'Galeri seni modern & kontemporer kelas dunia, penuh instalasi visual estetik untuk kencan berkesan',
      priceLevel: 'Rp 70.000 - 90.000',
      cuisine: 'Galeri Seni & Budaya',
      tags: ['Aktivitas', 'Museum'],
      imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewsCount: '3.5K',
      area: 'Jakarta Barat',
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
      priceLevel: 'Rp 125.000 - 140.000',
      cuisine: 'Roller Skate & Interactive Art',
      tags: ['Aktivitas'],
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewsCount: '1.9K',
      area: 'Jakarta Pusat',
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
