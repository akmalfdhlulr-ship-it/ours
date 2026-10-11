import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
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
  { id: 'Restoran', label: 'Restoran', icon: 'restaurant' },
  { id: 'Kafe Romantis', label: 'Kafe Romantis', icon: 'cafe' },
  { id: 'Taman', label: 'Taman', icon: 'leaf' },
  { id: 'Aktivitas', label: 'Aktivitas', icon: 'sparkles' },
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
  { id: 'm1', name: 'Harlow Jakarta', xPercent: 37, yPercent: 51, category: 'Restoran', icon: 'restaurant' },
  { id: 'm2', name: 'El Chef Restaurant Cafe', xPercent: 33, yPercent: 47, category: 'Restoran', icon: 'restaurant' },
  { id: 'm3', name: 'SKYE Bar & Restaurant', xPercent: 43, yPercent: 36, category: 'Restoran', icon: 'wine' },
  { id: 'm4', name: 'Taman Literasi Blok M', xPercent: 41, yPercent: 55, category: 'Taman', icon: 'leaf' },
  { id: 'm5', name: 'Museum MACAN', xPercent: 23, yPercent: 34, category: 'Aktivitas', icon: 'sparkles' },
  { id: 'm6', name: 'Plataran Menteng', xPercent: 48, yPercent: 37, category: 'Restoran', icon: 'restaurant' },
  { id: 'm7', name: 'Ottera Cafe', xPercent: 44, yPercent: 49, category: 'Kafe Romantis', icon: 'cafe' },
];

export default function ExploreScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Semua Wilayah');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Place for Map Card & Detail Modal
  const [selectedMapPlace, setSelectedMapPlace] = useState<PlaceItem | null>(null);
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

      setPlaces(placesRes);
      setSavedIds(new Set(savedRes.map((s: SavedPlaceItem) => s.placeId)));

      if (placesRes.length > 0 && !selectedMapPlace) {
        // Find Harlow or first place for map default
        const harlow = placesRes.find((p) => p.name.includes('Harlow')) || placesRes[0];
        setSelectedMapPlace(harlow);
      }
    } catch {
      // Graceful fallback
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
      {/* ================= 1. HEADER SECTION ================= */}
      <View style={styles.header}>
        {viewMode === 'list' ? (
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.screenTitle}>Jelajahi Indonesia</Text>
              <Text style={styles.screenSubtitle}>
                Temukan tempat kencan, kuliner, dan aktivitas terbaik.
              </Text>
            </View>
            <View style={styles.doodleHeartsBox}>
              <View style={styles.doodleHeartLeft}>
                <Ionicons name="heart" size={18} color="#F43F5E" />
              </View>
              <View style={styles.doodleHeartRight}>
                <Ionicons name="heart" size={14} color="#FDA4AF" />
              </View>
            </View>
          </View>
        ) : null}

        {/* ================= 2. SEARCH BAR & LIST/MAP TOGGLE ================= */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                viewMode === 'map'
                  ? 'Cari tempat di Jakarta...'
                  : 'Cari kafe, restoran, taman, atau aktivitas...'
              }
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

          {/* List & Map Toggle Icon Buttons */}
          <View style={styles.toggleButtonGroup}>
            <TouchableOpacity
              style={[
                styles.toggleIconBtn,
                viewMode === 'list' ? styles.toggleIconBtnActive : styles.toggleIconBtnInactive,
              ]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.85}>
              <Ionicons
                name="list"
                size={18}
                color={viewMode === 'list' ? '#FFFFFF' : '#2563EB'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleIconBtn,
                viewMode === 'map' ? styles.toggleIconBtnActive : styles.toggleIconBtnInactive,
              ]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.85}>
              <Ionicons
                name="map"
                size={18}
                color={viewMode === 'map' ? '#FFFFFF' : '#2563EB'}
              />
            </TouchableOpacity>
          </View>
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
                    {/* Left: Thumbnail Image */}
                    <Image source={{ uri: imgUrl }} style={styles.placeCardImage} resizeMode="cover" />

                    {/* Middle: Details */}
                    <View style={styles.placeCardBody}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {place.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.cardHeartBtn}
                          onPress={() => handleToggleSave(place)}
                          activeOpacity={0.7}>
                          <Ionicons
                            name={isSaved ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isSaved ? '#F43F5E' : '#94A3B8'}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Tag Badges */}
                      <View style={styles.tagBadgeRow}>
                        {tags.map((tag, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.tagBadge,
                              idx === 0 ? styles.tagBadgePrimary : styles.tagBadgeSecondary,
                            ]}>
                            <Text
                              style={[
                                styles.tagBadgeText,
                                idx === 0 ? styles.tagBadgeTextPrimary : styles.tagBadgeTextSecondary,
                              ]}>
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Rating & Price Row */}
                      <View style={styles.metaRow}>
                        <Ionicons name="star" size={13} color="#F59E0B" style={{ marginRight: 3 }} />
                        <Text style={styles.ratingText}>
                          {rating} ({reviews})
                        </Text>
                        <View style={styles.metaDividerDot} />
                        <Ionicons name="cash-outline" size={13} color="#64748B" style={{ marginRight: 3 }} />
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

      {/* ================= 6. PLACE DETAIL MODAL ================= */}
      <Modal visible={!!selectedDetailPlace} transparent animationType="slide">
        <View style={styles.detailBackdrop}>
          <View style={styles.detailCard}>
            {selectedDetailPlace && (
              <>
                <View style={styles.detailHeroImageContainer}>
                  <Image
                    source={{
                      uri:
                        (selectedDetailPlace.metadata as any)?.imageUrl ||
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
                    }}
                    style={styles.detailHeroImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.detailCloseBtn}
                    onPress={() => setSelectedDetailPlace(null)}>
                    <Ionicons name="close" size={20} color="#1F2937" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailBody}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.detailTitle}>{selectedDetailPlace.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="star" size={16} color="#F59E0B" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>
                        {(selectedDetailPlace.metadata as any)?.rating || '4.8'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailCategoryBadge}>
                    {(selectedDetailPlace.metadata as any)?.cuisine || selectedDetailPlace.category}
                  </Text>
                  <Text style={styles.detailAddress}>
                    📍 {selectedDetailPlace.address || 'Jakarta'}
                  </Text>
                  <Text style={styles.detailPrice}>
                    🏷️ {(selectedDetailPlace.metadata as any)?.priceLevel || 'Rp 100.000 - 200.000'}
                  </Text>
                  <Text style={styles.detailAtmosphere}>
                    {(selectedDetailPlace.metadata as any)?.atmosphere ||
                      'Tempat kencan pilihan sempurna dengan nuansa nyaman dan romantis untuk momen spesial berdua.'}
                  </Text>

                  <View style={styles.detailActionRow}>
                    <TouchableOpacity
                      style={styles.detailWishlistBtn}
                      onPress={() => handleAddToWishlist(selectedDetailPlace)}>
                      <Ionicons name="heart" size={16} color="#FFFFFF" />
                      <Text style={styles.detailWishlistBtnText}>Tambah ke Rencana Kencan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailSaveBtn}
                      onPress={() => handleToggleSave(selectedDetailPlace)}>
                      <Ionicons
                        name={savedIds.has(selectedDetailPlace.id) ? 'heart' : 'heart-outline'}
                        size={22}
                        color="#F43F5E"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
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
  // Detail Modal
  detailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  detailHeroImageContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  detailHeroImage: {
    width: '100%',
    height: '100%',
  },
  detailCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: {
    padding: 24,
    gap: 8,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  detailCategoryBadge: {
    fontSize: 13,
    color: '#F43F5E',
    fontWeight: '700',
  },
  detailAddress: {
    fontSize: 13,
    color: '#64748B',
  },
  detailPrice: {
    fontSize: 13,
    color: '#64748B',
  },
  detailAtmosphere: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginTop: 6,
  },
  detailActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  detailWishlistBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailWishlistBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  detailSaveBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
