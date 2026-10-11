import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { PlaceItem, SavedPlaceItem } from '@ours/contracts';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AREA_FILTERS = [
  'Semua Wilayah',
  'Jakarta Selatan',
  'Jakarta Pusat',
  'Jakarta Barat',
  'Jakarta Utara',
  'Jakarta Timur',
];

interface CategoryItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  { id: 'Semua', label: 'Semua', icon: 'grid' },
  { id: 'Kafe Romantis', label: 'Kafe Romantis', icon: 'cafe' },
  { id: 'Fine Dining', label: 'Fine Dining', icon: 'restaurant' },
  { id: 'Outdoor & Alam', label: 'Outdoor & Alam', icon: 'leaf' },
  { id: 'Taman Santai', label: 'Taman Santai', icon: 'flower' },
];

const AUTHENTIC_INDONESIA_PLACES: any[] = [
  {
    id: 'pl-el-chef',
    name: 'El Chef Restaurant Cafe',
    category: 'Restoran',
    address: 'Jalan KH Ahmad Dahlan, Kebayoran Baru',
    coupleSpaceId: null,
    provider: 'verified',
    providerPlaceId: 'el_chef_01',
    latitude: -6.2425,
    longitude: 106.7925,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      badge: 'Eropa',
      tags: ['Restoran', 'Date Night'],
      rating: 4.8,
      reviewsCount: 320,
      priceLevel: 'Rp 100k – 200k',
      area: 'Jakarta Selatan',
      imageUrl:
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
      atmosphere: 'Suasana bistro Eropa dengan interior hangat, sajian steak dan pasta lezat untuk kencan intim.',
      openingHours: '10:00 – 22:00 WIB',
    },
  },
  {
    id: 'pl-gubug-berkah',
    name: 'Gubug Berkah',
    category: 'Kafe',
    address: 'Jalan Ciater Barat, BSD City, Tangsel',
    coupleSpaceId: null,
    provider: 'verified',
    providerPlaceId: 'gubug_berkah_02',
    latitude: -6.3142,
    longitude: 106.6912,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      badge: 'Asri',
      tags: ['Kafe', 'Outdoor'],
      rating: 4.5,
      reviewsCount: 230,
      priceLevel: 'Rp 50k – 100k',
      area: 'Tangerang',
      imageUrl:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      atmosphere: 'Saung tradisional dengan angin sepoi-sepoi dan kolam ikan asri, ramah untuk bercengkrama santai berdua.',
      openingHours: '10:00 – 21:00 WIB',
    },
  },
  {
    id: 'pl-skye',
    name: 'SKYE Bar & Restaurant',
    category: 'Restoran',
    address: 'Menara BCA Lantai 56, Thamrin',
    coupleSpaceId: null,
    provider: 'verified',
    providerPlaceId: 'skye_03',
    latitude: -6.1953,
    longitude: 106.8228,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      badge: 'Rooftop',
      tags: ['Romantic View', 'Fine Dine'],
      rating: 4.7,
      reviewsCount: 542,
      priceLevel: 'Rp 200k – 500k',
      area: 'Jakarta Pusat',
      imageUrl:
        'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
      atmosphere: 'Pemandangan skyline gemerlap Jakarta dari lantai 56 dengan koktail artisan dan menu internasional modern.',
      openingHours: '16:00 – 01:00 WIB',
    },
  },
  {
    id: 'pl-taman-literasi',
    name: 'Taman Literasi Blok M',
    category: 'Taman',
    address: 'Jl. Sisingamangaraja, Kebayoran Baru',
    coupleSpaceId: null,
    provider: 'verified',
    providerPlaceId: 'taman_literasi_04',
    latitude: -6.2443,
    longitude: 106.7978,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      badge: 'Taman',
      tags: ['Buku & Piknik', 'Santai'],
      rating: 4.6,
      reviewsCount: 412,
      priceLevel: 'Gratis',
      area: 'Jakarta Selatan',
      imageUrl:
        'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80',
      atmosphere: 'Taman terbuka hijau dengan perpustakaan ramah komunitas, spot membaca dan jalan sore yang menyegarkan.',
      openingHours: '07:00 – 22:00 WIB',
    },
  },
  {
    id: 'pl-plataran-menteng',
    name: 'Plataran Menteng',
    category: 'Restoran',
    address: 'Jl. HOS Cokroaminoto No.42, Menteng, Jakarta Pusat, DKI Jakarta 10350',
    coupleSpaceId: null,
    provider: 'verified',
    providerPlaceId: 'plataran_menteng_05',
    latitude: -6.1945,
    longitude: 106.8315,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      badge: 'Pilihan Favorit Daniel & Sasa',
      tags: ['Restoran', 'Indonesia', 'Romantis', 'Outdoor'],
      rating: 4.7,
      reviewsCount: 892,
      isVerified: true,
      priceLevel: 'Rp 200.000 – 400.000 / orang',
      distance: '2.4 km dari lokasimu',
      openingHours: 'Buka sekarang • 11.00 – 22.00',
      reservationNote: 'Batas reservasi makan malam 21.00',
      paymentNote: 'Menerima QRIS, Kartu Debit, & Kartu Kredit',
      atmosphere: 'Restoran dengan suasana khas Indonesia yang elegan dan asri, cocok untuk makan malam spesial serta merayakan momen kebersamaan.',
      highlightRecommendation: 'Cocok Buat Anniversary',
      recommendationPercentage: '88% pasangan merekomendasikan tempat ini',
      imageUrl:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      area: 'Jakarta Pusat',
    },
  },
];

interface MapMarker {
  id: string;
  name: string;
  xPercent: number;
  yPercent: number;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeId?: string;
}

const JAKARTA_MAP_MARKERS: MapMarker[] = [
  { id: 'm1', name: 'Plataran Menteng', xPercent: 48, yPercent: 37, category: 'Restoran', icon: 'restaurant' },
  { id: 'm2', name: 'El Chef Restaurant Cafe', xPercent: 33, yPercent: 47, category: 'Restoran', icon: 'restaurant' },
  { id: 'm3', name: 'SKYE Bar & Restaurant', xPercent: 43, yPercent: 36, category: 'Restoran', icon: 'wine' },
  { id: 'm4', name: 'Taman Literasi Blok M', xPercent: 41, yPercent: 55, category: 'Taman', icon: 'leaf' },
  { id: 'm5', name: 'Gubug Berkah', xPercent: 23, yPercent: 54, category: 'Kafe', icon: 'cafe' },
];

export default function ExploreScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Semua Wilayah');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [places, setPlaces] = useState<PlaceItem[]>(AUTHENTIC_INDONESIA_PLACES);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Place for Map Card & Detail Modal
  const [selectedMapPlace, setSelectedMapPlace] = useState<PlaceItem | null>(AUTHENTIC_INDONESIA_PLACES[4]);
  const [selectedDetailPlace, setSelectedDetailPlace] = useState<PlaceItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    try {
      const areaParam = selectedArea !== 'Semua Wilayah' ? selectedArea : '';
      const catParam = selectedCategory !== 'Semua' ? selectedCategory : '';
      const combinedQuery = [searchQuery.trim(), areaParam].filter(Boolean).join(' ') || undefined;

      const [placesRes, savedRes] = await Promise.all([
        api.places.search({
          query: combinedQuery,
          category: catParam || undefined,
        }),
        api.places.getSaved().catch(() => []),
      ]);

      // Combine authentic places with API places so real curated spots are prioritized
      const existingNames = new Set(placesRes.map((p) => p.name.toLowerCase()));
      const filteredCurated = AUTHENTIC_INDONESIA_PLACES.filter(
        (cp) => !existingNames.has(cp.name.toLowerCase()),
      );
      const combined = [...AUTHENTIC_INDONESIA_PLACES, ...placesRes.filter((p) => !AUTHENTIC_INDONESIA_PLACES.some((ap) => ap.name.toLowerCase() === p.name.toLowerCase()))];

      // Apply search query / category / area filter
      const q = searchQuery.toLowerCase().trim();
      const filtered = combined.filter((p) => {
        const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q);
        const pArea = (p.metadata as any)?.area || '';
        const matchesArea = selectedArea === 'Semua Wilayah' || pArea.toLowerCase().includes(selectedArea.toLowerCase()) || (p.address || '').toLowerCase().includes(selectedArea.toLowerCase());
        const pCat = p.category || (p.metadata as any)?.tags?.[0] || '';
        const matchesCat = selectedCategory === 'Semua' || pCat.toLowerCase().includes(selectedCategory.toLowerCase()) || (p.metadata as any)?.tags?.some((t: string) => t.toLowerCase().includes(selectedCategory.toLowerCase()));
        return matchesQuery && matchesArea && matchesCat;
      });

      setPlaces(filtered);
      setSavedIds(new Set(savedRes.map((s: SavedPlaceItem) => s.placeId)));

      if (filtered.length > 0 && !selectedMapPlace) {
        setSelectedMapPlace(filtered[0]);
      }
    } catch {
      // Fallback to client curated list
      setPlaces(AUTHENTIC_INDONESIA_PLACES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, selectedArea, selectedMapPlace]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlaces();
  };

  const handleToggleSave = async (place: PlaceItem) => {
    const isSaved = savedIds.has(place.id);
    try {
      if (isSaved) {
        await api.places.unsave(place.id);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(place.id);
          return next;
        });
        setStatusMessage(`"${place.name}" dihapus dari favorit`);
      } else {
        await api.places.save({ placeId: place.id });
        setSavedIds((prev) => new Set([...prev, place.id]));
        setStatusMessage(`"${place.name}" disimpan ke favorit!`);
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal memperbarui status favorit');
    }
  };

  const handleAddToWishlist = async (place: PlaceItem) => {
    try {
      await api.wishlist.create({
        title: `Kencan di ${place.name}`,
        category: place.category || 'Kencan',
        description: place.address || undefined,
      });
      setStatusMessage(`"${place.name}" ditambahkan ke Rencana Kencan!`);
      setSelectedDetailPlace(null);
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menambahkan ke rencana');
    }
  };

  const displayedPlaces = places.filter((p) => {
    if (showSavedOnly) return savedIds.has(p.id);
    return true;
  });

  return (
    <View style={styles.container}>
      {/* ================= 1. HEADER SECTION (MATCHING IMAGE 2) ================= */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.screenTitle}>Jelajahi Kencan</Text>
              <Ionicons name="heart" size={20} color="#F43F5E" />
            </View>
            <Text style={styles.screenSubtitle}>
              Temukan spot romantis terbaik untuk Daniel & Sasa
            </Text>
          </View>
          <View style={styles.coupleAvatarBadge}>
            <Text style={styles.coupleAvatarText}>D • S</Text>
          </View>
        </View>

        {/* ================= 2. SEARCH BAR & QUICK FILTERS (MATCHING IMAGE 2) ================= */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={17} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari kafe, restoran romantis, taman..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Red Filter Button */}
          <TouchableOpacity
            style={styles.filterSquareBtn}
            onPress={() => setSelectedCategory('Semua')}
            activeOpacity={0.85}>
            <Ionicons name="options" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Map View Toggle Button */}
          <TouchableOpacity
            style={[styles.mapToggleBtn, viewMode === 'map' && styles.mapToggleBtnActive]}
            onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            activeOpacity={0.85}>
            <Ionicons
              name="map-outline"
              size={18}
              color={viewMode === 'map' ? '#F43F5E' : '#4B5563'}
            />
          </TouchableOpacity>
        </View>

        {/* ================= 3. CATEGORY PILLS ROW ================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}>
          {CATEGORY_ITEMS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}>
                <Ionicons
                  name={cat.icon}
                  size={15}
                  color={isActive ? '#FFFFFF' : '#475569'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ================= 4. AREA PILLS ROW ================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.areaScrollContainer}>
          {AREA_FILTERS.map((area) => {
            const isActive = selectedArea === area;
            return (
              <TouchableOpacity
                key={area}
                style={[styles.areaPill, isActive && styles.areaPillActive]}
                onPress={() => setSelectedArea(area)}
                activeOpacity={0.8}>
                <Text style={[styles.areaPillText, isActive && styles.areaPillTextActive]}>
                  {area}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.areaPillArrow}>
            <Ionicons name="chevron-forward" size={14} color="#64748B" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Status Toast */}
      {statusMessage && (
        <View style={styles.statusToast}>
          <Text style={styles.statusToastText}>{statusMessage}</Text>
          <TouchableOpacity onPress={() => setStatusMessage(null)}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ================= 5. MAIN CONTENT (LIST VIEW VS MAP VIEW) ================= */}
      {viewMode === 'list' ? (
        /* ================= LIST VIEW ================= */
        loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Memuat rekomendasi kencan Indonesia...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
            }>
            {displayedPlaces.length > 0 ? (
              displayedPlaces.map((place) => {
                const isSaved = savedIds.has(place.id);
                const meta: any = place.metadata || {};
                const rating = typeof meta.rating === 'number' ? meta.rating.toFixed(1) : (meta.rating || '4.8');
                const reviews = meta.reviewsCount || '320';
                const price = meta.priceLevel || 'Rp 100.000 - 200.000';
                const tags: string[] = meta.tags || [place.category || 'Restoran'];
                const imgUrl =
                  meta.imageUrl ||
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';

                return (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.placeCard}
                    onPress={() => setSelectedDetailPlace(place)}
                    activeOpacity={0.93}>
                    {/* Left: Thumbnail Image with Badge Overlay */}
                    <View style={styles.placeCardImageWrapper}>
                      <Image source={{ uri: imgUrl }} style={styles.placeCardImage} resizeMode="cover" />
                      {(meta.badge || meta.visualTag || tags[0]) && (
                        <View style={styles.thumbnailBadge}>
                          <Text style={styles.thumbnailBadgeText}>{meta.badge || meta.visualTag || tags[0]}</Text>
                        </View>
                      )}
                    </View>

                    {/* Middle: Details */}
                    <View style={styles.placeCardBody}>
                      {/* Top Row: Tags + Heart Button */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.tagBadgeRow}>
                          <View style={styles.tagBadgePrimary}>
                            <Text style={styles.tagBadgeTextPrimary}>{tags[0] || 'Restoran'}</Text>
                          </View>
                          {tags[1] && (
                            <View style={styles.tagBadgeSecondary}>
                              <Text style={styles.tagBadgeTextSecondary}>{tags[1]}</Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.cardHeartBtn}
                          onPress={() => handleToggleSave(place)}
                          activeOpacity={0.7}>
                          <Ionicons
                            name={isSaved ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isSaved ? '#E11D48' : '#94A3B8'}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Place Title */}
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {place.name}
                      </Text>

                      {/* Rating & Price Row */}
                      <View style={styles.metaRow}>
                        <Ionicons name="star" size={13} color="#F59E0B" style={{ marginRight: 3 }} />
                        <Text style={styles.ratingText}>{rating}</Text>
                        <Text style={styles.reviewsCountText}>({reviews})</Text>
                        <Text style={styles.metaDividerBullet}>•</Text>
                        <Text style={styles.priceText}>{price}</Text>
                      </View>

                      {/* Address Row */}
                      <View style={styles.addressRow}>
                        <Ionicons
                          name="location-sharp"
                          size={12}
                          color="#94A3B8"
                          style={{ marginRight: 3, marginTop: 1 }}
                        />
                        <Text style={styles.addressText} numberOfLines={1}>
                          {place.address || 'Jakarta'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>Tidak ada tempat ditemukan</Text>
                <Text style={styles.emptySub}>
                  Coba pilih area lain atau sesuaikan filter kategori pencarian Anda.
                </Text>
              </View>
            )}
          </ScrollView>
        )
      ) : (
        /* ================= MAP VIEW ================= */
        <View style={styles.mapContainer}>
          {/* Stylized Realistic Vector Map Canvas */}
          <View style={styles.stylizedMapBg}>
            {/* Map River & Roads simulation */}
            <View style={styles.mapWaterBody} />
            <View style={styles.mapMainRoadH} />
            <View style={styles.mapMainRoadV} />
            <View style={styles.mapDiagonalRoad1} />
            <View style={styles.mapDiagonalRoad2} />

            {/* Region Labels */}
            <Text style={[styles.mapRegionText, { top: '15%', left: '42%' }]}>Jakarta Utara</Text>
            <Text style={[styles.mapRegionText, { top: '38%', left: '16%' }]}>Jakarta Barat</Text>
            <Text style={[styles.mapRegionText, { top: '36%', left: '42%' }]}>Jakarta Pusat</Text>
            <Text style={[styles.mapRegionText, { top: '48%', left: '64%' }]}>Jakarta Timur</Text>
            <Text style={[styles.mapRegionText, { top: '64%', left: '32%' }]}>Jakarta Selatan</Text>

            {/* Map Markers */}
            {JAKARTA_MAP_MARKERS.map((marker) => {
              const matchedPlace =
                places.find((p) => p.name.toLowerCase().includes(marker.name.toLowerCase().slice(0, 6))) ||
                selectedMapPlace;
              const isSelected = selectedMapPlace?.name.includes(marker.name.slice(0, 6));

              return (
                <TouchableOpacity
                  key={marker.id}
                  style={[
                    styles.mapPinContainer,
                    { top: `${marker.yPercent}%`, left: `${marker.xPercent}%` },
                  ]}
                  onPress={() => {
                    if (matchedPlace) setSelectedMapPlace(matchedPlace);
                  }}
                  activeOpacity={0.85}>
                  <View style={[styles.mapPinCircle, isSelected && styles.mapPinCircleActive]}>
                    <Ionicons
                      name={isSelected ? 'heart' : marker.icon}
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={[styles.mapPinTriangle, isSelected && styles.mapPinTriangleActive]} />
                </TouchableOpacity>
              );
            })}

            {/* Location Crosshair Target Button */}
            <TouchableOpacity style={styles.mapTargetBtn} activeOpacity={0.8}>
              <Ionicons name="locate" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* Floating Selected Venue Card on Map */}
          {selectedMapPlace && (
            <View style={styles.floatingMapCard}>
              <View style={styles.floatingCardTopRow}>
                <Image
                  source={{
                    uri:
                      (selectedMapPlace.metadata as any)?.imageUrl ||
                      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
                  }}
                  style={styles.floatingCardImage}
                  resizeMode="cover"
                />
                <View style={styles.floatingCardInfoCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.floatingCardTitle} numberOfLines={1}>
                      {selectedMapPlace.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleToggleSave(selectedMapPlace)}
                      activeOpacity={0.7}>
                      <Ionicons
                        name={savedIds.has(selectedMapPlace.id) ? 'heart' : 'heart-outline'}
                        size={18}
                        color={savedIds.has(selectedMapPlace.id) ? '#F43F5E' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 3 }} />
                    <Text style={styles.floatingRatingText}>
                      {(selectedMapPlace.metadata as any)?.rating || '4.6'} ({(selectedMapPlace.metadata as any)?.reviewsCount || '287'})
                    </Text>
                    <View style={styles.floatingBadgePill}>
                      <Text style={styles.floatingBadgeText}>{selectedMapPlace.category || 'Restoran'}</Text>
                    </View>
                  </View>

                  <Text style={styles.floatingPriceText}>
                    🏷️ {(selectedMapPlace.metadata as any)?.priceLevel || 'Rp 150.000 - 300.000'}
                  </Text>
                  <Text style={styles.floatingAddressText} numberOfLines={1}>
                    📍 {selectedMapPlace.address || 'Jl. Senopati No. 8, Kebayoran Baru, Jakarta Selatan'}
                  </Text>
                </View>
              </View>

              {/* Two CTA Buttons */}
              <View style={styles.floatingActionRow}>
                <TouchableOpacity
                  style={styles.floatingDetailBtn}
                  onPress={() => setSelectedDetailPlace(selectedMapPlace)}
                  activeOpacity={0.85}>
                  <Text style={styles.floatingDetailBtnText}>Lihat Detail</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.floatingRouteBtn}
                  onPress={() => {
                    setStatusMessage(`Membuka navigasi rute ke ${selectedMapPlace.name}...`);
                  }}
                  activeOpacity={0.88}>
                  <Ionicons name="navigate" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.floatingRouteBtnText}>Rute ke Sini</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ================= 6. PLACE DETAIL MODAL (Matching Image 1: PlaceDetailScreen) ================= */}
      <Modal visible={!!selectedDetailPlace} transparent={false} animationType="slide">
        {selectedDetailPlace && (() => {
          const meta = (selectedDetailPlace.metadata as any) || {};
          const heroImg =
            meta.imageUrl ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
          const ratingVal = typeof meta.rating === 'number' ? meta.rating.toFixed(1) : (meta.rating || '4.7');
          const reviewsCount = meta.reviewsCount || '892';
          const tags: string[] = meta.tags || ['Restoran', 'Indonesia', 'Romantis', 'Outdoor'];
          const streetAddress = selectedDetailPlace.address || 'Jl. HOS Cokroaminoto No.42';
          const cityAddress = 'Menteng, Jakarta Pusat, DKI Jakarta 10350';
          const distanceText = meta.distance || '2.4 km dari lokasimu';
          const openingHours = meta.openingHours || '11.00 – 22.00';
          const priceRange = meta.priceLevel || 'Rp 200.000 – 400.000 / orang';
          const atmosphereDesc =
            meta.atmosphere ||
            'Restoran dengan suasana khas Indonesia yang elegan dan asri, cocok untuk makan malam spesial serta merayakan momen kebersamaan.';
          const isSaved = savedIds.has(selectedDetailPlace.id);

          const openExternalMap = () => {
            const query = encodeURIComponent(`${selectedDetailPlace.name} ${streetAddress}`);
            const mapUrl = Platform.select({
              ios: `maps:0,0?q=${query}`,
              default: `https://www.google.com/maps/search/?api=1&query=${query}`,
            });
            Linking.openURL(mapUrl);
          };

          return (
            <SafeAreaView style={styles.detailScreenContainer}>
              {/* Top Navigation Header */}
              <View style={styles.detailScreenHeader}>
                <TouchableOpacity
                  style={styles.detailBackCircleBtn}
                  onPress={() => setSelectedDetailPlace(null)}
                  activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={20} color="#1F2937" />
                </TouchableOpacity>

                <Text style={styles.detailHeaderTitle}>Tambah Rencana Kencan</Text>

                <View style={styles.detailHeaderAvatar}>
                  <Ionicons name="person" size={18} color="#FFFFFF" />
                </View>
              </View>

              {/* Scrollable Detail Content */}
              <ScrollView
                style={styles.detailScrollContent}
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}>
                {/* Hero Photo Section with Badge & Counter */}
                <View style={styles.detailHeroPhotoCard}>
                  <Image source={{ uri: heroImg }} style={styles.detailHeroImg} resizeMode="cover" />
                  <View style={styles.detailHeroOverlay} />

                  {/* Badge: Pilihan Favorit Daniel & Sasa */}
                  <View style={styles.detailHeroFavBadge}>
                    <Ionicons name="heart" size={14} color="#F43F5E" />
                    <Text style={styles.detailHeroFavText}>Pilihan Favorit Daniel & Sasa</Text>
                  </View>

                  {/* Photo Counter */}
                  <View style={styles.detailHeroCounterBadge}>
                    <Ionicons name="camera-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.detailHeroCounterText}>1/18</Text>
                  </View>
                </View>

                {/* Title, Rating & Verification */}
                <View style={styles.detailHeaderSection}>
                  <Text style={styles.detailPlaceTitle}>{selectedDetailPlace.name}</Text>
                  <View style={styles.detailRatingRow}>
                    <View style={styles.detailStarRatingBox}>
                      <Ionicons name="star" size={17} color="#F59E0B" />
                      <Text style={styles.detailRatingNumber}>{ratingVal}</Text>
                    </View>
                    <Text style={styles.detailReviewsText}>({reviewsCount} ulasan)</Text>
                    <Text style={styles.detailDot}>•</Text>
                    <View style={styles.detailVerifiedBadge}>
                      <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                      <Text style={styles.detailVerifiedText}>Terverifikasi</Text>
                    </View>
                  </View>
                </View>

                {/* Category & Atmosphere Tags */}
                <View style={styles.detailTagsWrapper}>
                  {tags.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.detailTagPill,
                        idx === 0
                          ? styles.detailTagPillRose
                          : idx === 2
                          ? styles.detailTagPillSoftRose
                          : styles.detailTagPillGray,
                      ]}>
                      <Text
                        style={[
                          styles.detailTagText,
                          idx === 0
                            ? styles.detailTagTextRose
                            : idx === 2
                            ? styles.detailTagTextSoftRose
                            : styles.detailTagTextGray,
                        ]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Location & Interactive Mini Map Card */}
                <View style={styles.detailLocationCard}>
                  <View style={styles.detailLocationHeader}>
                    <View style={styles.detailLocationPinIcon}>
                      <Ionicons name="location-sharp" size={20} color="#F43F5E" />
                    </View>
                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <Text style={styles.detailStreetAddress}>{streetAddress}</Text>
                      <Text style={styles.detailCityAddress}>{cityAddress}</Text>
                      <Text style={styles.detailDistanceLabel}>{distanceText}</Text>
                    </View>
                  </View>

                  {/* Interactive Mini Map Box */}
                  <View style={styles.detailMiniMapBox}>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80',
                      }}
                      style={styles.detailMiniMapImage}
                      resizeMode="cover"
                    />
                    {/* Center Fork & Knife Pin */}
                    <View style={styles.detailMapCenterPin}>
                      <Text style={{ fontSize: 16 }}>🍴</Text>
                    </View>

                    {/* Directions Button on Mini Map */}
                    <TouchableOpacity
                      style={styles.detailMapDirectionBtn}
                      onPress={openExternalMap}
                      activeOpacity={0.8}>
                      <Ionicons name="paper-plane" size={12} color="#2563EB" />
                      <Text style={styles.detailMapDirectionText}>Petunjuk Arah</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Operational Hours, Price & Description Card */}
                <View style={styles.detailInfoCard}>
                  {/* Hours */}
                  <View style={styles.detailInfoRow}>
                    <View style={[styles.detailInfoIconCircle, { backgroundColor: '#ECFDF5' }]}>
                      <Ionicons name="time-outline" size={20} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailInfoTitle}>
                        Buka sekarang • <Text style={{ color: '#334155', fontWeight: '600' }}>{openingHours}</Text>
                      </Text>
                      <Text style={styles.detailInfoSub}>Batas reservasi makan malam 21.00</Text>
                    </View>
                  </View>

                  <View style={styles.detailInfoDivider} />

                  {/* Price */}
                  <View style={styles.detailInfoRow}>
                    <View style={[styles.detailInfoIconCircle, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="card-outline" size={20} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailInfoTitle}>
                        {priceRange}
                      </Text>
                      <Text style={styles.detailInfoSub}>Menerima QRIS, Kartu Debit, & Kartu Kredit</Text>
                    </View>
                  </View>

                  <View style={styles.detailInfoDivider} />

                  {/* Description */}
                  <View style={styles.detailInfoRow}>
                    <View style={[styles.detailInfoIconCircle, { backgroundColor: '#EEF2FF' }]}>
                      <Ionicons name="book-outline" size={20} color="#4F46E5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailAtmosphereText}>{atmosphereDesc}</Text>
                    </View>
                  </View>
                </View>

                {/* Highlight Banner: Cocok Buat Anniversary */}
                <TouchableOpacity
                  style={styles.detailAnniversaryBanner}
                  onPress={() => handleAddToWishlist(selectedDetailPlace)}
                  activeOpacity={0.85}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                    <View style={styles.detailAnniversaryIconCircle}>
                      <Ionicons name="gift" size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailAnniversaryTitle}>Cocok Buat Anniversary</Text>
                      <Text style={styles.detailAnniversarySub}>88% pasangan merekomendasikan tempat ini</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#E11D48" />
                </TouchableOpacity>
              </ScrollView>

              {/* Floating Bottom Action Bar */}
              <View style={styles.detailBottomActionBar}>
                {/* Secondary Button: Buka Peta */}
                <TouchableOpacity
                  style={styles.detailBottomSecondaryBtn}
                  onPress={openExternalMap}
                  activeOpacity={0.8}>
                  <Ionicons name="navigate-outline" size={17} color="#2563EB" />
                  <Text style={styles.detailBottomSecondaryText}>Buka Peta</Text>
                </TouchableOpacity>

                {/* Primary Button: Tambah ke Rencana */}
                <TouchableOpacity
                  style={styles.detailBottomPrimaryBtn}
                  onPress={() => {
                    handleAddToWishlist(selectedDetailPlace);
                    setSelectedDetailPlace(null);
                  }}
                  activeOpacity={0.88}>
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.detailBottomPrimaryText}>Tambah ke Rencana</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          );
        })()}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  doodleHeartsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  doodleHeartLeft: {
    transform: [{ rotate: '-12deg' }],
  },
  doodleHeartRight: {
    transform: [{ rotate: '15deg' }],
  },
  // Search Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  coupleAvatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  coupleAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterSquareBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  mapToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapToggleBtnActive: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  toggleButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconBtnActive: {
    backgroundColor: '#2563EB',
  },
  toggleIconBtnInactive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  // Category Scroll
  categoryScrollContainer: {
    paddingVertical: 2,
    gap: 8,
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Area Scroll
  areaScrollContainer: {
    paddingVertical: 2,
    gap: 8,
  },
  areaPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  areaPillActive: {
    backgroundColor: '#F43F5E',
    borderColor: '#F43F5E',
  },
  areaPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  areaPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  areaPillArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // List Content
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110,
    gap: 12,
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  placeCardImage: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  placeCardBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginRight: 6,
  },
  cardHeartBtn: {
    padding: 2,
  },
  tagBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 3,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagBadgePrimary: {
    backgroundColor: '#EFF6FF',
  },
  tagBadgeSecondary: {
    backgroundColor: '#F1F5F9',
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagBadgeTextPrimary: {
    color: '#2563EB',
  },
  tagBadgeTextSecondary: {
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  metaDividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  priceText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
  },
  // Map View
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#EBF4F6',
  },
  stylizedMapBg: {
    flex: 1,
    backgroundColor: '#E9F1EE',
    position: 'relative',
    overflow: 'hidden',
  },
  mapWaterBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#BAE6FD',
    opacity: 0.7,
  },
  mapMainRoadH: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FDE68A',
  },
  mapMainRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '46%',
    width: 8,
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FDE68A',
  },
  mapDiagonalRoad1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 250,
    height: 4,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '35deg' }],
  },
  mapDiagonalRoad2: {
    position: 'absolute',
    top: '60%',
    left: '30%',
    width: 280,
    height: 4,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-25deg' }],
  },
  mapRegionText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: -0.3,
    opacity: 0.85,
  },
  mapPinContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 32,
    height: 38,
    marginLeft: -16,
    marginTop: -38,
  },
  mapPinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPinCircleActive: {
    backgroundColor: '#F43F5E',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  mapPinTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2563EB',
    marginTop: -1,
  },
  mapPinTriangleActive: {
    borderTopColor: '#F43F5E',
  },
  mapTargetBtn: {
    position: 'absolute',
    bottom: 230,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  // Floating Map Card
  floatingMapCard: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  floatingCardTopRow: {
    flexDirection: 'row',
  },
  floatingCardImage: {
    width: 86,
    height: 86,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  floatingCardInfoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  floatingCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  floatingRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 6,
  },
  floatingBadgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  floatingBadgeText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '600',
  },
  floatingPriceText: {
    fontSize: 11,
    color: '#64748B',
    marginVertical: 2,
  },
  floatingAddressText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  floatingActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  floatingDetailBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDetailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  floatingRouteBtn: {
    flex: 1.2,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F43F5E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingRouteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Status Toast
  statusToast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99,
  },
  statusToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  // PlaceCard Badge & Info Styles
  placeCardImageWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    borderRadius: 20,
    overflow: 'hidden',
  },
  thumbnailBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  thumbnailBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  reviewsCountText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  metaDividerBullet: {
    color: '#CBD5E1',
    marginHorizontal: 2,
  },

  // PlaceDetailScreen (Matching Image 1)
  detailScreenContainer: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  detailScreenHeader: {
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8F9FF',
  },
  detailBackCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  detailHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  detailScrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  detailHeroPhotoCard: {
    position: 'relative',
    width: '100%',
    height: 288,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
    backgroundColor: '#E2E8F0',
  },
  detailHeroImg: {
    width: '100%',
    height: '100%',
  },
  detailHeroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  detailHeroFavBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  detailHeroFavText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailHeroCounterBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailHeroCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailHeaderSection: {
    marginBottom: 12,
  },
  detailPlaceTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  detailRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  detailStarRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailRatingNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailReviewsText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  detailDot: {
    color: '#CBD5E1',
  },
  detailVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailVerifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  detailTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailTagPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  detailTagPillRose: {
    backgroundColor: '#FFE4E6',
  },
  detailTagPillSoftRose: {
    backgroundColor: '#FFF1F2',
  },
  detailTagPillGray: {
    backgroundColor: '#F1F5F9',
  },
  detailTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailTagTextRose: {
    color: '#E11D48',
  },
  detailTagTextSoftRose: {
    color: '#BE123C',
  },
  detailTagTextGray: {
    color: '#475569',
  },
  detailLocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  detailLocationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  detailLocationPinIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStreetAddress: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailCityAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailDistanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
    marginTop: 4,
  },
  detailMiniMapBox: {
    position: 'relative',
    width: '100%',
    height: 144,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailMiniMapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.75,
  },
  detailMapCenterPin: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  detailMapDirectionBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  detailMapDirectionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  detailInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailInfoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailInfoSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailInfoDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginVertical: 12,
  },
  detailAtmosphereText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  detailAnniversaryBanner: {
    backgroundColor: '#FFF1F2',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailAnniversaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAnniversaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailAnniversarySub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE123C',
    marginTop: 2,
  },
  detailBottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailBottomSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailBottomSecondaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailBottomPrimaryBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  detailBottomPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
