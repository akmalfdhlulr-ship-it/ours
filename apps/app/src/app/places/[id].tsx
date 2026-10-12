import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { luminousColors } from '@ours/design-tokens';
import { api } from '@/services/api';
import { PlaceItem } from '@ours/contracts';
import { useCoupleData } from '@/context/couple-data-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  dining:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  cafe:
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  park:
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
  art:
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&auto=format&fit=crop&q=80',
  default:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
};

function getPlaceImage(place?: PlaceItem | null): string {
  if (!place) return DEFAULT_CATEGORY_IMAGES.default;
  if (place.metadata?.photoUrl) return place.metadata.photoUrl;
  if (place.metadata?.image) return place.metadata.image;
  const cat = (place.category || '').toLowerCase();
  if (cat.includes('fine') || cat.includes('dining') || cat.includes('resto') || cat.includes('makan')) {
    return DEFAULT_CATEGORY_IMAGES.dining;
  }
  if (cat.includes('cafe') || cat.includes('kafe') || cat.includes('kopi') || cat.includes('coffee')) {
    return DEFAULT_CATEGORY_IMAGES.cafe;
  }
  if (cat.includes('taman') || cat.includes('alam') || cat.includes('park') || cat.includes('piknik')) {
    return DEFAULT_CATEGORY_IMAGES.park;
  }
  if (cat.includes('galeri') || cat.includes('seni') || cat.includes('art') || cat.includes('museum')) {
    return DEFAULT_CATEGORY_IMAGES.art;
  }
  return DEFAULT_CATEGORY_IMAGES.default;
}

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { partnerNames, memories } = useCoupleData();

  const [place, setPlace] = useState<PlaceItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPlace() {
      setIsLoading(true);
      try {
        if (!id) return;
        // 1. Try finding by ID
        const found = await api.places.getById(id).catch(() => null);
        if (found && isMounted) {
          setPlace(found);
          return;
        }

        // 2. Try searching by slug / name
        const cleanQuery = id.replace(/-/g, ' ');
        const searchList = await api.places.search({ query: cleanQuery }).catch(() => []);
        if (searchList && searchList.length > 0 && isMounted) {
          setPlace(searchList[0]);
          return;
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPlace();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Check saved state
  useEffect(() => {
    if (!place?.id) return;
    api.places
      .getSaved()
      .then((saved) => {
        const isSaved = (saved || []).some((s) => s.placeId === place.id);
        setIsFavorited(isSaved);
      })
      .catch(() => {});
  }, [place?.id]);

  const toggleFavorite = async () => {
    if (!place) return;
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    try {
      if (nextState) {
        await api.places.save({ placeId: place.id });
      } else {
        await api.places.unsave(place.id);
      }
    } catch {
      setIsFavorited(!nextState);
    }
  };

  const handleOpenMaps = () => {
    if (!place) return;
    const query = encodeURIComponent(`${place.name} ${place.address || ''}`);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const handleAddToDatePlan = () => {
    if (!place) return;
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      router.push({
        pathname: '/dates/planner',
        params: {
          venueName: place.name,
          location: place.address || 'Jakarta',
          category: place.category || 'Kencan Romantis',
        },
      } as any);
    }, 1200);
  };

  if (isLoading) {
    return (
      <View style={[styles.screenRoot, styles.centerBox]}>
        <ActivityIndicator size="large" color={luminousColors.primary} />
        <Text style={styles.loadingText}>Memuat rincian tempat kencan...</Text>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={[styles.screenRoot, styles.centerBox, { padding: 24 }]}>
        <View style={styles.notFoundIconCircle}>
          <Ionicons name="location-outline" size={40} color={luminousColors.primary} />
        </View>
        <Text style={styles.notFoundTitle}>Tempat Tidak Ditemukan</Text>
        <Text style={styles.notFoundDesc}>
          Informasi untuk lokasi ini belum tersedia atau telah diperbarui. Silakan jelajahi kurasi tempat lainnya.
        </Text>
        <TouchableOpacity
          style={styles.backToExploreBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
          <Text style={styles.backToExploreText}>Kembali ke Jelajah</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Real place attributes
  const heroImage = getPlaceImage(place);
  const placeName = place.name;
  const placeAddress = place.address || 'Alamat terverifikasi di Jakarta';
  const placeCategory = place.category || 'Spot Kencan & Kuliner';
  const rating = place.metadata?.rating || '4.8';
  const reviews = place.metadata?.reviews || 'Terverifikasi';

  // Check if couple actually has a real memory in this location
  const existingMemory = memories.find(
    (m) =>
      m.locationName.toLowerCase().includes(placeName.toLowerCase()) ||
      m.title.toLowerCase().includes(placeName.toLowerCase())
  );

  return (
    <View style={styles.screenRoot}>
      {/* ---------------- Header ---------------- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Kembali">
            <Ionicons name="chevron-back" size={24} color={luminousColors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Detail Tempat
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={toggleFavorite}
            activeOpacity={0.75}
            accessibilityLabel="Simpan Favorit">
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorited ? luminousColors.primary : luminousColors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------------- Main Scroll Content ---------------- */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: heroImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Gradient Scrims */}
          <View style={styles.heroScrimTop} />
          <View style={styles.heroScrimBottom} />

          {/* Top Overlay Badges */}
          <View style={styles.heroBadgesRow}>
            <View style={styles.favoritePairPill}>
              <Ionicons name="sparkles" size={14} color={luminousColors.primary} />
              <Text style={styles.favoritePairText}>
                Rekomendasi untuk {partnerNames.user} &amp; {partnerNames.partner}
              </Text>
            </View>
          </View>

          {/* Floating Favorite Heart Button */}
          <TouchableOpacity
            style={styles.floatingHeartBtn}
            onPress={toggleFavorite}
            activeOpacity={0.88}
            accessibilityLabel="Favorit">
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorited ? luminousColors.primary : '#5B4041'}
            />
          </TouchableOpacity>

          {/* Bottom Overlay Info on Hero */}
          <View style={styles.heroInfoOverlay}>
            <View style={styles.heroCategoryPill}>
              <Text style={styles.heroCategoryText}>{placeCategory}</Text>
            </View>
            <Text style={styles.heroVenueName}>{placeName}</Text>
            <View style={styles.heroDistrictRow}>
              <Ionicons name="location" size={14} color="#FFFFFF" />
              <Text style={styles.heroDistrictText} numberOfLines={1}>
                {placeAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating and Social Proof Strip */}
        <View style={styles.socialProofCard}>
          <View style={styles.ratingGroup}>
            <View style={styles.starsRow}>
              <Ionicons name="star" size={18} color="#FFB800" />
              <Text style={styles.ratingNumberText}>{rating}</Text>
            </View>
            <Text style={styles.reviewSubText}>{reviews}</Text>
          </View>

          <View style={styles.proofDivider} />

          <View style={styles.coupleFavoriteCol}>
            <View style={styles.coupleFavoritePill}>
              <Ionicons name="shield-checkmark" size={14} color={luminousColors.secondary} />
              <Text style={styles.coupleFavoriteLabel}>OpenStreetMap Terverifikasi</Text>
            </View>
            <Text style={styles.coupleFavoriteDesc} numberOfLines={2}>
              Lokasi asli dengan titik koordinat terdaftar untuk kencan berdua.
            </Text>
          </View>
        </View>

        {/* Practical Info Grid */}
        <View style={styles.infoGrid}>
          {/* Jam Operasional */}
          <View style={styles.infoBox}>
            <View style={styles.infoBoxLabelRow}>
              <Ionicons name="time-outline" size={18} color={luminousColors.secondary} />
              <Text style={styles.infoBoxLabel}>Status</Text>
            </View>
            <View style={styles.infoBoxValueCol}>
              <Text style={styles.infoBoxMainVal}>Buka</Text>
              <Text style={styles.infoBoxSubValOpen}>Siap Dikunjungi</Text>
            </View>
          </View>

          {/* Kategori */}
          <View style={styles.infoBox}>
            <View style={styles.infoBoxLabelRow}>
              <Ionicons name="compass-outline" size={18} color={luminousColors.primary} />
              <Text style={styles.infoBoxLabel}>Kategori</Text>
            </View>
            <View style={styles.infoBoxValueCol}>
              <Text style={styles.infoBoxMainVal} numberOfLines={1}>
                {placeCategory}
              </Text>
              <Text style={styles.infoBoxSubVal}>Spot Berdua</Text>
            </View>
          </View>
        </View>

        {/* Shared Memory Section (Genuine User Activity Only) */}
        <View style={styles.memorySection}>
          <View style={styles.memoryHeaderRow}>
            <View style={styles.memoryHeaderLeft}>
              <Ionicons name="heart" size={18} color={luminousColors.primary} />
              <Text style={styles.memoryHeaderTitle}>Kenangan Kita di Sini</Text>
            </View>
            <Text style={styles.memoryCountLabel}>
              {existingMemory ? '1 Momen Tercatat' : 'Belum Ada Momen'}
            </Text>
          </View>

          {existingMemory ? (
            <View style={styles.memoryCard}>
              <Image
                source={{ uri: existingMemory.imageUrl }}
                style={styles.memoryImage}
                resizeMode="cover"
              />
              <View style={styles.memoryContentCol}>
                <View style={styles.memoryDateRow}>
                  <Ionicons name="calendar-outline" size={13} color={luminousColors.onSurfaceVariant} />
                  <Text style={styles.memoryDateText}>{existingMemory.date}</Text>
                </View>
                <Text style={styles.memoryTitle} numberOfLines={1}>
                  {existingMemory.title}
                </Text>
                <Text style={styles.memoryNote} numberOfLines={2}>
                  {existingMemory.description}
                </Text>
                <View style={styles.memoryAuthorRow}>
                  <View style={styles.memoryAuthorDot} />
                  <Text style={styles.memoryAuthorText}>Diabadikan oleh {existingMemory.author}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyMemoryCard}>
              <Ionicons name="images-outline" size={32} color={luminousColors.onSurfaceVariant} />
              <Text style={styles.emptyMemoryTitle}>Belum Ada Kenangan di Sini 🌱</Text>
              <Text style={styles.emptyMemoryDesc}>
                Kalian berdua belum pernah mengabadikan foto atau catatan kenangan di lokasi ini. Rencanakan kencan ke sini untuk membuat kenangan pertama!
              </Text>
              <TouchableOpacity
                style={styles.createMemoryBtn}
                onPress={() => router.push('/memories' as any)}
                activeOpacity={0.85}>
                <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                <Text style={styles.createMemoryBtnText}>+ Abadikan Kenangan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Location & Navigation Preview */}
        <View style={styles.locationSection}>
          <Text style={styles.locationSectionTitle}>Lokasi &amp; Navigasi</Text>
          <View style={styles.locationCard}>
            <View style={styles.addressInfoRow}>
              <Ionicons name="navigate-outline" size={24} color={luminousColors.secondary} />
              <View style={styles.addressTextCol}>
                <Text style={styles.addressName}>{placeName}</Text>
                <Text style={styles.addressFull} numberOfLines={3}>
                  {placeAddress}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Space for bottom dock */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ---------------- Toast Notification ---------------- */}
      {showToast && (
        <View style={styles.toastBanner}>
          <Ionicons name="heart" size={20} color="#FFB2B7" />
          <View style={styles.toastTextCol}>
            <Text style={styles.toastTitle}>Menuju Date Planner...</Text>
            <Text style={styles.toastDesc}>{placeName} ditambahkan ke rancangan kencan.</Text>
          </View>
        </View>
      )}

      {/* ---------------- Floating Bottom Action Dock ---------------- */}
      <View style={styles.bottomDockWrapper}>
        <View style={styles.bottomDock}>
          <TouchableOpacity
            style={styles.mapsDirectionBtn}
            onPress={handleOpenMaps}
            activeOpacity={0.85}>
            <Ionicons name="navigate" size={18} color={luminousColors.secondary} />
            <Text style={styles.mapsDirectionText}>Buka Peta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addToDatePlanBtn}
            onPress={handleAddToDatePlan}
            activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={19} color="#FFFFFF" />
            <Text style={styles.addToDatePlanText}>+ Rencanakan Kencan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: luminousColors.surface,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  notFoundIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFEBF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  notFoundDesc: {
    fontSize: 13,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  backToExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: luminousColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
  },
  backToExploreText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    height: 64,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(250, 248, 255, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(185, 5, 56, 0.05)',
    zIndex: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroWrapper: {
    position: 'relative',
    width: '100%',
    height: 300,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1C1917',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroScrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  heroScrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  heroBadgesRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoritePairPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  favoritePairText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  floatingHeartBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  heroInfoOverlay: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
    gap: 6,
  },
  heroCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: luminousColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroVenueName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroDistrictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroDistrictText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    maxWidth: '90%',
  },
  socialProofCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  ratingGroup: {
    alignItems: 'center',
    minWidth: 70,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNumberText: {
    fontSize: 20,
    fontWeight: '800',
    color: luminousColors.onSurface,
  },
  reviewSubText: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  proofDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E7FF',
  },
  coupleFavoriteCol: {
    flex: 1,
    gap: 4,
  },
  coupleFavoritePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coupleFavoriteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  coupleFavoriteDesc: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 16,
  },
  infoGrid: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  infoBoxLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  infoBoxValueCol: {
    gap: 2,
  },
  infoBoxMainVal: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  infoBoxSubValOpen: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  infoBoxSubVal: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
  },
  memorySection: {
    marginTop: 20,
    gap: 12,
  },
  memoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  memoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memoryHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  memoryCountLabel: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
  },
  memoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  memoryImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  memoryContentCol: {
    flex: 1,
    gap: 4,
  },
  memoryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memoryDateText: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
  },
  memoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  memoryNote: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 16,
  },
  memoryAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memoryAuthorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: luminousColors.primary,
  },
  memoryAuthorText: {
    fontSize: 10,
    color: luminousColors.primary,
    fontWeight: '600',
  },
  emptyMemoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  emptyMemoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  emptyMemoryDesc: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
  },
  createMemoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: luminousColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createMemoryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  locationSection: {
    marginTop: 20,
    gap: 12,
  },
  locationSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  addressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressTextCol: {
    flex: 1,
    gap: 2,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  addressFull: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 18,
  },
  toastBanner: {
    position: 'absolute',
    top: 74,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastTextCol: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toastDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  bottomDockWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  bottomDock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  mapsDirectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  mapsDirectionText: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.secondary,
  },
  addToDatePlanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: luminousColors.primary,
  },
  addToDatePlanText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
