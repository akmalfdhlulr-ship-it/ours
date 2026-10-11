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
import { api } from '@/services/api';
import { PlaceItem, SavedPlaceItem } from '@ours/contracts';
import { Ionicons } from '@expo/vector-icons';

const AREA_FILTERS = [
  'Semua Jakarta',
  'Jakarta Pusat',
  'Jakarta Utara',
  'Jakarta Selatan',
  'Jakarta Barat',
  'Jakarta Timur',
];

interface CategoryItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  iconColor: string;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  { id: 'Kafe', label: 'Kafe', icon: 'cafe', bgColor: '#FEE2E2', iconColor: '#F43F5E' },
  { id: 'Restoran', label: 'Restoran', icon: 'restaurant', bgColor: '#FFEDD5', iconColor: '#EA580C' },
  { id: 'Museum', label: 'Museum', icon: 'business', bgColor: '#E0F2FE', iconColor: '#0284C7' },
  { id: 'Taman', label: 'Taman', icon: 'leaf', bgColor: '#DCFCE7', iconColor: '#16A34A' },
  { id: 'Aktivitas', label: 'Aktivitas', icon: 'ribbon', bgColor: '#EDE9FE', iconColor: '#7C3AED' },
];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Semua Jakarta');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDetailPlace, setSelectedDetailPlace] = useState<PlaceItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    try {
      const areaParam = selectedArea !== 'Semua Jakarta' ? selectedArea : '';
      const combinedQuery = [searchQuery.trim(), areaParam].filter(Boolean).join(' ') || undefined;

      const [placesRes, savedRes] = await Promise.all([
        api.places.search({
          query: combinedQuery,
          category: selectedCategory || undefined,
        }),
        api.places.getSaved().catch(() => []),
      ]);

      setPlaces(placesRes);
      setSavedIds(new Set(savedRes.map((s: SavedPlaceItem) => s.placeId)));
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, selectedArea]);

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
      setStatusMessage(`"${place.name}" ditambahkan ke Wishlist!`);
      setSelectedDetailPlace(null);
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menambahkan ke wishlist');
    }
  };

  const displayedPlaces = places.filter((p) => {
    if (showSavedOnly) return savedIds.has(p.id);
    return true;
  });

  return (
    <View style={styles.container}>
      {/* 1. Header (Jelajahi Jakarta + Heart outline) */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.screenTitle}>Jelajahi Jakarta</Text>
          <TouchableOpacity
            style={styles.headerHeartBtn}
            onPress={() => setShowSavedOnly(!showSavedOnly)}
            activeOpacity={0.75}>
            <Ionicons
              name={showSavedOnly ? 'heart' : 'heart-outline'}
              size={24}
              color={showSavedOnly ? '#F43F5E' : '#1E293B'}
            />
          </TouchableOpacity>
        </View>

        {/* 2. Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari tempat, aktivitas, atau area..."
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

        {/* 3. Horizontal Area Pills */}
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
                <Text style={[styles.areaText, isActive && styles.areaTextActive]}>
                  {area}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. Category Round Buttons Row */}
        <View style={styles.categoryRow}>
          {CATEGORY_ITEMS.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryItemCol}
                onPress={() =>
                  setSelectedCategory(isCatActive ? null : cat.id)
                }
                activeOpacity={0.8}>
                <View
                  style={[
                    styles.categoryRoundIcon,
                    { backgroundColor: isCatActive ? '#F43F5E' : cat.bgColor },
                  ]}>
                  <Ionicons
                    name={cat.icon}
                    size={20}
                    color={isCatActive ? '#FFFFFF' : cat.iconColor}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    isCatActive && { color: '#F43F5E', fontWeight: '700' },
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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

      {/* 5. Places List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F43F5E" />
          <Text style={styles.loadingText}>Memuat rekomendasi kencan Jakarta...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F43F5E"
            />
          }>
          {displayedPlaces.length > 0 ? (
            displayedPlaces.map((place) => {
              const isSaved = savedIds.has(place.id);
              const meta: any = place.metadata || {};
              const rating = typeof meta.rating === 'number' ? meta.rating.toFixed(1) : (meta.rating || '4.7');
              const reviews = meta.reviewsCount || '1.1K';
              const price = meta.priceLevel || 'Rp 150.000 – 300.000 / orang';
              const imgUrl =
                meta.imageUrl ||
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80';

              return (
                <TouchableOpacity
                  key={place.id}
                  style={styles.placeCard}
                  onPress={() => setSelectedDetailPlace(place)}
                  activeOpacity={0.92}>
                  {/* Left: Thumbnail Image */}
                  <Image
                    source={{ uri: imgUrl }}
                    style={styles.placeCardThumb}
                    resizeMode="cover"
                  />

                  {/* Middle: Details */}
                  <View style={styles.placeCardInfoCol}>
                    <Text style={styles.placeCardName} numberOfLines={1}>
                      {place.name}
                    </Text>

                    {/* Rating & Category */}
                    <View style={styles.metaRow}>
                      <Ionicons name="star" size={13} color="#F59E0B" style={{ marginRight: 4 }} />
                      <Text style={styles.ratingNumber}>{rating}</Text>
                      <Text style={styles.reviewsText}> ({reviews}) · {place.category || 'Restoran'}</Text>
                    </View>

                    {/* Location Pin */}
                    <View style={styles.metaRow}>
                      <Ionicons name="location-sharp" size={13} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {place.address || 'Jakarta'}
                      </Text>
                    </View>

                    {/* Price Range */}
                    <View style={styles.metaRow}>
                      <Ionicons name="pricetag" size={12} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.priceText} numberOfLines={1}>
                        {price}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Heart Bookmark Icon */}
                  <TouchableOpacity
                    style={styles.heartButton}
                    onPress={() => handleToggleSave(place)}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={isSaved ? 'heart' : 'heart-outline'}
                      size={22}
                      color="#F43F5E"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={42} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Tidak ada tempat ditemukan</Text>
              <Text style={styles.emptySub}>
                Coba pilih area lain atau reset kata kunci pencarian Anda.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* 6. Place Detail Modal */}
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
                  <Text style={styles.detailTitle}>{selectedDetailPlace.name}</Text>
                  <Text style={styles.detailCategoryBadge}>
                    {(selectedDetailPlace.metadata as any)?.cuisine || selectedDetailPlace.category}
                  </Text>
                  <Text style={styles.detailAddress}>
                    📍 {selectedDetailPlace.address || 'Jakarta'}
                  </Text>
                  <Text style={styles.detailPrice}>
                    🏷️ {(selectedDetailPlace.metadata as any)?.priceLevel || 'Rp 150.000 – 300.000 / orang'}
                  </Text>
                  <Text style={styles.detailAtmosphere}>
                    {(selectedDetailPlace.metadata as any)?.atmosphere ||
                      'Tempat kencan pilihan sempurna dengan nuansa nyaman dan romantis untuk momen spesial berdua.'}
                  </Text>

                  <View style={styles.detailActionRow}>
                    <TouchableOpacity
                      style={styles.detailWishlistBtn}
                      onPress={() => handleAddToWishlist(selectedDetailPlace)}>
                      <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.detailWishlistBtnText}>Tambah ke Rencana Kencan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailSaveBtn}
                      onPress={() => handleToggleSave(selectedDetailPlace)}>
                      <Ionicons
                        name={savedIds.has(selectedDetailPlace.id) ? 'heart' : 'heart-outline'}
                        size={20}
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
    paddingBottom: 12,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerHeartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  // Area Filter Pills
  areaScrollContainer: {
    paddingVertical: 2,
    gap: 8,
    marginBottom: 16,
  },
  areaPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  areaPillActive: {
    backgroundColor: '#F43F5E',
    borderColor: '#F43F5E',
  },
  areaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  areaTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Category Icons Row
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  categoryItemCol: {
    alignItems: 'center',
    gap: 6,
  },
  categoryRoundIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  // Places List Content
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 14,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  placeCardThumb: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  placeCardInfoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
    gap: 4,
  },
  placeCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewsText: {
    fontSize: 12,
    color: '#64748B',
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  priceText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  heartButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
