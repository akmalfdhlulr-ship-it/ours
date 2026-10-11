import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { colors } from '@ours/design-tokens';
import { api } from '@/services/api';
import { PlaceItem, SavedPlaceItem } from '@ours/contracts';
import { Ionicons } from '@expo/vector-icons';
import { OptionWheel, OptionWheelItem } from '@/components/free-components/OptionWheel';

const AREA_FILTERS = [
  'Semua Wilayah',
  'Jakarta Selatan',
  'Jakarta Pusat',
  'Jakarta Barat',
  'Jakarta Utara',
  'Jakarta Timur',
  'Bandung',
  'Bali',
  'Surabaya',
  'Yogyakarta',
  'Medan',
  'Semarang',
  'Makassar',
  'Malang',
  'Bogor',
  'Solo',
];

const CATEGORY_OPTIONS: OptionWheelItem[] = [
  { id: 'Semua', label: 'Semua', icon: 'grid-outline', color: colors.primaryBlue },
  { id: 'Kuliner', label: 'Restoran', icon: 'restaurant-outline', color: '#EA580C' },
  { id: 'Kafe', label: 'Kafe Romantis', icon: 'cafe-outline', color: '#D97706' },
  { id: 'Alam', label: 'Taman & Alam', icon: 'leaf-outline', color: '#16A34A' },
  { id: 'Budaya', label: 'Seni & Museum', icon: 'business-outline', color: '#7C3AED' },
  { id: 'Aktivitas', label: 'Aktivitas Berdua', icon: 'sparkles-outline', color: '#DB2777' },
  { id: 'Hiburan Malam', label: 'Lounge & Musik', icon: 'musical-notes-outline', color: '#4F46E5' },
];

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<'list' | 'map' | 'saved'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Semua Wilayah');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Detail Modal State
  const [selectedDetailPlace, setSelectedDetailPlace] = useState<PlaceItem | null>(null);
  const [selectedPinPlace, setSelectedPinPlace] = useState<PlaceItem | null>(null);

  const fetchPlaces = useCallback(async () => {
    try {
      setError(null);
      if (activeTab === 'saved') {
        const savedRes = await api.places.getSaved();
        setSavedPlaces(savedRes);
        setSavedIds(new Set(savedRes.map((s) => s.placeId)));
      } else {
        const areaQuery = selectedArea !== 'Semua Wilayah' ? selectedArea : '';
        const combinedQuery = [searchQuery.trim(), areaQuery].filter(Boolean).join(' ') || undefined;

        const [placesRes, savedRes] = await Promise.all([
          api.places.search({
            query: combinedQuery,
            category: selectedCategory === 'Semua' ? undefined : selectedCategory,
          }),
          api.places.getSaved().catch(() => []),
        ]);
        setPlaces(placesRes);
        setSavedIds(new Set(savedRes.map((s) => s.placeId)));
        if (placesRes.length > 0 && !selectedPinPlace) {
          setSelectedPinPlace(placesRes[0]);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat tempat kencan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, selectedCategory, selectedArea]);

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
        setStatusMessage(`"${place.name}" disimpan ke tempat favorit!`);
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal memperbarui status favorit');
    }
  };

  const handleAddToPlan = async (place: PlaceItem) => {
    try {
      await api.wishlist.create({
        title: `Kencan di ${place.name}`,
        category: place.category || 'Kencan',
        description: place.address || undefined,
      });
      setStatusMessage(`"${place.name}" berhasil ditambahkan ke wishlist kencan!`);
      setSelectedDetailPlace(null);
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menambahkan ke wishlist');
    }
  };

  // Places are fetched directly from search API with combined queries (area + keyword)
  const displayedPlaces = places;

  const getPlaceImage = (place: PlaceItem): string => {
    return (
      place.metadata?.imageUrl ||
      place.metadata?.image ||
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80'
    );
  };

  const getPlaceRating = (place: PlaceItem): string | null => {
    const r = place.metadata?.rating;
    return typeof r === 'number' ? r.toFixed(1) : (r ? `${r}` : null);
  };

  const getPlacePrice = (place: PlaceItem): string | null => {
    return place.metadata?.priceLevel || place.metadata?.priceRange || null;
  };

  const getPlaceHours = (place: PlaceItem): string | null => {
    return place.metadata?.openingHours || place.metadata?.bestTime || null;
  };

  return (
    <View style={styles.container}>
      {/* 1. Header & Controls */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.screenTitle}>
              {selectedArea === 'Semua Wilayah' ? 'Jelajahi Indonesia' : `Jelajahi ${selectedArea}`}
            </Text>
            <Text style={styles.screenSubtitle}>Temukan tempat kencan romantis untuk momen berdua</Text>
          </View>
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, activeTab === 'list' && styles.toggleBtnActive]}
              onPress={() => setActiveTab('list')}>
              <Ionicons
                name="list"
                size={16}
                color={activeTab === 'list' ? '#FFFFFF' : '#4B5563'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, activeTab === 'map' && styles.toggleBtnActive]}
              onPress={() => setActiveTab('map')}>
              <Ionicons
                name="map"
                size={16}
                color={activeTab === 'map' ? '#FFFFFF' : '#4B5563'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kafe, restoran, taman, atau aktivitas..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 3. React Bits OptionWheel for Categories */}
        <OptionWheel
          options={CATEGORY_OPTIONS}
          selectedId={selectedCategory}
          onSelect={(id) => setSelectedCategory(id)}
        />

        {/* 4. Area Pills Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.areaScrollContainer}>
          {AREA_FILTERS.map((area) => (
            <TouchableOpacity
              key={area}
              style={[styles.areaPill, selectedArea === area && styles.areaPillActive]}
              onPress={() => setSelectedArea(area)}
              activeOpacity={0.8}>
              <Text style={[styles.areaText, selectedArea === area && styles.areaTextActive]}>
                {area}
              </Text>
            </TouchableOpacity>
          ))}
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

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Mencari tempat kencan romantis...</Text>
        </View>
      ) : activeTab === 'map' ? (
        /* Map View with Pin Synchronization */
        <View style={styles.mapViewContainer}>
          <View style={styles.mapCanvas}>
            <View style={styles.mapGridLines} />
            <View style={styles.mapAreaLabelBox}>
              <Text style={styles.mapAreaText}>Jakarta Pusat</Text>
            </View>
            <View style={[styles.mapAreaLabelBox, { top: '65%', left: '45%' }]}>
              <Text style={styles.mapAreaText}>SCBD / Senopati</Text>
            </View>

            {/* Pinned Places */}
            {displayedPlaces.map((place, idx) => {
              const isSelected = selectedPinPlace?.id === place.id;
              const topPos = 20 + ((idx * 27) % 55) + '%';
              const leftPos = 15 + ((idx * 33) % 65) + '%';
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[
                    styles.mapPinBubble,
                    { top: topPos as any, left: leftPos as any },
                    isSelected && styles.mapPinBubbleSelected,
                  ]}
                  onPress={() => setSelectedPinPlace(place)}
                  activeOpacity={0.85}>
                  <Image source={{ uri: getPlaceImage(place) }} style={styles.mapPinImage} />
                  {isSelected && <View style={styles.mapPinPulse} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Floating Selected Card */}
          {selectedPinPlace && (
            <TouchableOpacity
              style={styles.floatingMapCard}
              onPress={() => setSelectedDetailPlace(selectedPinPlace)}
              activeOpacity={0.9}>
              <Image source={{ uri: getPlaceImage(selectedPinPlace) }} style={styles.floatingMapCardThumb} />
              <View style={styles.floatingMapCardCol}>
                <Text style={styles.floatingMapCardTitle} numberOfLines={1}>
                  {selectedPinPlace.name}
                </Text>
                {getPlaceRating(selectedPinPlace) ? (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {getPlaceRating(selectedPinPlace)} • {selectedPinPlace.category || 'Kencan'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingText}>{selectedPinPlace.category || 'Kencan'}</Text>
                  </View>
                )}
                {getPlacePrice(selectedPinPlace) && (
                  <Text style={styles.floatingMapCardPrice}>{getPlacePrice(selectedPinPlace)}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* List View */
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          {displayedPlaces.length > 0 ? (
            displayedPlaces.map((place) => {
              const isSaved = savedIds.has(place.id);
              const rating = getPlaceRating(place);
              const price = getPlacePrice(place);

              return (
                <TouchableOpacity
                  key={place.id}
                  style={styles.placeCard}
                  onPress={() => setSelectedDetailPlace(place)}
                  activeOpacity={0.92}>
                  <Image
                    source={{ uri: getPlaceImage(place) }}
                    style={styles.placeCardThumb}
                    resizeMode="cover"
                  />

                  <View style={styles.placeCardInfoCol}>
                    <View style={styles.placeCardHeaderRow}>
                      <Text style={styles.placeCardName} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleToggleSave(place)}
                        style={styles.heartBookmarkBtn}>
                        <Ionicons
                          name={isSaved ? 'heart' : 'heart-outline'}
                          size={18}
                          color={isSaved ? '#F43F5E' : '#9CA3AF'}
                        />
                      </TouchableOpacity>
                    </View>

                    {rating ? (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {rating} • {place.category || 'Kencan'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>{place.category || 'Kencan'}</Text>
                      </View>
                    )}

                    <Text style={styles.placeCardArea} numberOfLines={1}>
                      {place.address || 'Indonesia'}
                    </Text>

                    {price && <Text style={styles.placeCardPrice}>{price}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={38} color="#9CA3AF" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>Tidak ada tempat ditemukan</Text>
              <Text style={styles.emptySub}>
                Coba gunakan kata kunci pencarian lain atau pilih area yang berbeda di seluruh Indonesia.
              </Text>
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedArea('Semua Wilayah');
                  setSelectedCategory('Semua');
                }}>
                <Text style={styles.resetFilterBtnText}>Reset Filter</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Place Detail Modal */}
      <Modal visible={!!selectedDetailPlace} transparent animationType="slide">
        <View style={styles.detailModalBackdrop}>
          <View style={styles.detailModalContent}>
            {selectedDetailPlace && (
              <>
                <View style={styles.detailHeroImageContainer}>
                  <Image
                    source={{ uri: getPlaceImage(selectedDetailPlace) }}
                    style={styles.detailHeroImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.detailBackButton}
                    onPress={() => setSelectedDetailPlace(null)}>
                    <Ionicons name="arrow-back" size={20} color="#1F2937" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detailShareButton}
                    onPress={() => handleToggleSave(selectedDetailPlace)}>
                    <Ionicons
                      name={savedIds.has(selectedDetailPlace.id) ? 'heart' : 'heart-outline'}
                      size={20}
                      color={savedIds.has(selectedDetailPlace.id) ? '#F43F5E' : '#1F2937'}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={{ maxHeight: 380 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ padding: 20 }}>
                  <Text style={styles.detailPlaceTitle}>{selectedDetailPlace.name}</Text>

                  {getPlaceRating(selectedDetailPlace) ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={15} color="#F59E0B" />
                      <Text style={[styles.ratingText, { fontSize: 13, fontWeight: '700' }]}>
                        {getPlaceRating(selectedDetailPlace)} • {selectedDetailPlace.category || 'Kencan'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.ratingRow}>
                      <Text style={[styles.ratingText, { fontSize: 13, fontWeight: '700' }]}>
                        {selectedDetailPlace.category || 'Kencan'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailInfoRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginTop: 2 }} />
                    <Text style={styles.detailInfoText}>
                      {selectedDetailPlace.address || 'Indonesia'}
                    </Text>
                  </View>

                  {getPlacePrice(selectedDetailPlace) && (
                    <View style={styles.detailInfoRow}>
                      <Ionicons name="wallet-outline" size={16} color="#2563EB" style={{ marginTop: 2 }} />
                      <Text style={styles.detailInfoText}>{getPlacePrice(selectedDetailPlace)}</Text>
                    </View>
                  )}

                  {getPlaceHours(selectedDetailPlace) && (
                    <View style={styles.detailInfoRow}>
                      <Ionicons name="time-outline" size={16} color="#059669" style={{ marginTop: 2 }} />
                      <Text style={styles.detailInfoText}>{getPlaceHours(selectedDetailPlace)}</Text>
                    </View>
                  )}

                  {selectedDetailPlace.metadata?.atmosphere && (
                    <View style={styles.detailInfoRow}>
                      <Ionicons name="sparkles-outline" size={16} color="#EC4899" style={{ marginTop: 2 }} />
                      <Text style={styles.detailInfoText}>
                        {selectedDetailPlace.metadata.atmosphere}
                      </Text>
                    </View>
                  )}

                  {selectedDetailPlace.metadata?.attribution && (
                    <View style={[styles.detailInfoRow, { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10, marginTop: 6 }]}>
                      <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                      <Text style={[styles.detailInfoText, { color: '#4B5563', fontSize: 11 }]}>
                        Sumber data: {selectedDetailPlace.metadata.attribution}
                      </Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.detailActionButtonsRow}>
                  <TouchableOpacity
                    style={styles.detailPrimaryCTA}
                    onPress={() => handleAddToPlan(selectedDetailPlace)}
                    activeOpacity={0.88}>
                    <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.detailPrimaryCTAText}>Tambah ke Wishlist</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detailSecondaryCTA}
                    onPress={() => {
                      setSelectedDetailPlace(null);
                      setActiveTab('map');
                      setSelectedPinPlace(selectedDetailPlace);
                    }}
                    activeOpacity={0.85}>
                    <Ionicons name="map-outline" size={18} color="#1F2937" />
                    <Text style={styles.detailSecondaryCTAText}>Buka Peta</Text>
                  </TouchableOpacity>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#1F2937',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  areaScrollContainer: {
    gap: 8,
    paddingVertical: 8,
  },
  areaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  areaPillActive: {
    backgroundColor: '#F43F5E',
  },
  areaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  areaTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusToast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 30,
    alignSelf: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statusToastText: {
    fontSize: 12,
    color: '#FFFFFF',
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
    color: '#6B7280',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  placeCardThumb: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  placeCardInfoCol: {
    flex: 1,
  },
  placeCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  placeCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 6,
  },
  heartBookmarkBtn: {
    padding: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  ratingText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  placeCardArea: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  placeCardPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resetFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },
  resetFilterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  mapViewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  mapGridLines: {
    ...StyleSheet.absoluteFill,
    opacity: 0.05,
    borderWidth: 1,
    borderColor: '#000',
  },
  mapAreaLabelBox: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mapAreaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  mapPinBubble: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  mapPinBubbleSelected: {
    borderColor: '#F43F5E',
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  mapPinImage: {
    width: '100%',
    height: '100%',
  },
  mapPinPulse: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  floatingMapCard: {
    position: 'absolute',
    bottom: 95,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  floatingMapCardThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  floatingMapCardCol: {
    flex: 1,
  },
  floatingMapCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  floatingMapCardPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryBlue,
    marginTop: 2,
  },
  detailModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  detailHeroImageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  detailHeroImage: {
    width: '100%',
    height: '100%',
  },
  detailBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailShareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPlaceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  detailInfoText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  detailActionButtonsRow: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  detailPrimaryCTA: {
    flex: 1,
    backgroundColor: colors.primaryBlue,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPrimaryCTAText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailSecondaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  detailSecondaryCTAText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});
