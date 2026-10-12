import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { luminousColors } from '@ours/design-tokens';
import { Ionicons } from '@expo/vector-icons';
import { SettingsDrawerModal } from '@/components/SettingsDrawerModal';
import { api } from '@/services/api';
import { PlaceItem } from '@ours/contracts';
import { useCoupleData } from '@/context/couple-data-context';

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

function getPlaceImage(place: PlaceItem): string {
  if (place.metadata?.imageUrl) return place.metadata.imageUrl;
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

export default function ExploreTabScreen() {
  const router = useRouter();
  const { partnerNames } = useCoupleData();

  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Surprise Generator State
  const [surprisePlace, setSurprisePlace] = useState<PlaceItem | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Fetch real places from backend (backed by OpenStreetMap / Nominatim)
  const fetchPlaces = useCallback(async (queryStr?: string, categoryStr?: string) => {
    setIsLoading(true);
    try {
      const cleanCat =
        categoryStr && categoryStr !== 'Semua'
          ? categoryStr.replace(/[^\w\s]/gi, '').trim()
          : undefined;

      const results = await api.places.search({
        query: queryStr?.trim() || undefined,
        category: cleanCat,
      });

      const list = results || [];
      setPlaces(list);
      if (list.length > 0) {
        setSurprisePlace(list[Math.floor(Math.random() * list.length)]);
      } else {
        setSurprisePlace(null);
      }
    } catch {
      setPlaces([]);
      setSurprisePlace(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const cleanCat =
          activeCategory && activeCategory !== 'Semua'
            ? activeCategory.replace(/[^\w\s]/gi, '').trim()
            : undefined;

        const results = await api.places.search({
          query: searchQuery?.trim() || undefined,
          category: cleanCat,
        });

        if (!isCancelled) {
          const list = results || [];
          setPlaces(list);
          if (list.length > 0) {
            setSurprisePlace(list[Math.floor(Math.random() * list.length)]);
          } else {
            setSurprisePlace(null);
          }
        }
      } catch {
        if (!isCancelled) {
          setPlaces([]);
          setSurprisePlace(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, activeCategory]);

  // Load saved places to reflect user's real bookmarks
  useEffect(() => {
    api.places
      .getSaved()
      .then((savedList) => {
        const map: Record<string, boolean> = {};
        (savedList || []).forEach((item) => {
          map[item.placeId] = true;
        });
        setBookmarkedIds(map);
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = () => {
    fetchPlaces(searchQuery, activeCategory);
  };

  const handleShuffleIdea = () => {
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => spinAnim.setValue(0));

    if (places.length > 0) {
      const nextIdx = Math.floor(Math.random() * places.length);
      setSurprisePlace(places[nextIdx]);
    } else {
      fetchPlaces(searchQuery, activeCategory);
    }
  };

  const toggleBookmark = async (place: PlaceItem) => {
    const isCurrentlySaved = !!bookmarkedIds[place.id];
    setBookmarkedIds((prev) => ({ ...prev, [place.id]: !isCurrentlySaved }));

    try {
      if (isCurrentlySaved) {
        await api.places.unsave(place.id);
      } else {
        await api.places.save({ placeId: place.id });
      }
    } catch {
      // Revert if request fails
      setBookmarkedIds((prev) => ({ ...prev, [place.id]: isCurrentlySaved }));
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.screenRoot}>
      {/* ---------------- Header Bar ---------------- */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatarOverlap}>
            <View style={styles.headerIconCircle1}>
              <Ionicons name="heart" size={17} color={luminousColors.primary} />
            </View>
            <View style={styles.headerIconCircle2}>
              <Ionicons name="compass" size={16} color={luminousColors.secondary} />
            </View>
            <View style={styles.syncedDot} />
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.headerSyncText}>
              OURS <Text style={styles.headerSyncDot}>•</Text> Synced
            </Text>
            <Text style={styles.headerMainTitle}>Jelajah</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowSettingsDrawer(true)}
            activeOpacity={0.75}
            accessibilityLabel="Notifikasi">
            <Ionicons name="notifications-outline" size={22} color={luminousColors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBadge}
            onPress={() => setShowSettingsDrawer(true)}
            activeOpacity={0.8}
            accessibilityLabel="Profil">
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ---------------- Location & Search Bar ---------------- */}
        <View style={styles.searchSection}>
          <View style={styles.locationRow}>
            <View style={styles.locationGroup}>
              <Ionicons name="location" size={17} color={luminousColors.primary} />
              <Text style={styles.locationText}>Jakarta &amp; Sekitarnya</Text>
            </View>
            <View style={styles.curatedBadge}>
              <Text style={styles.curatedBadgeText}>
                {places.length > 0 ? `${places.length} Lokasi Aktif` : 'OpenStreetMap'}
              </Text>
            </View>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={luminousColors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari tempat kencan nyata..."
              placeholderTextColor="#8F6F71"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => router.push('/explore/map' as any)}
              activeOpacity={0.8}>
              <Ionicons name="map-outline" size={18} color={luminousColors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- Filter Chips ---------------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}>
          {[
            'Semua',
            '🍽️ Fine Dining',
            '☕ Kafe Santai',
            '🌿 Piknik Alam',
            '🎨 Galeri Seni',
            '🍨 Dessert & Gelato',
            '🌆 Rooftop',
          ].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chipItem, isActive && styles.chipItemActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.85}>
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </ScrollView>

        {/* ---------------- Surprise Date Generator ---------------- */}
        <View style={styles.generatorCard}>
          <View style={styles.generatorHeaderRow}>
            <View style={styles.generatorTitleGroup}>
              <View style={styles.diceIconBg}>
                <Ionicons name="dice" size={18} color={luminousColors.primary} />
              </View>
              <Text style={styles.generatorKicker}>SURPRISE DATE GENERATOR</Text>
            </View>
            <View style={styles.spontanBadge}>
              <Text style={styles.spontanBadgeText}>Berdua Lebih Spontan</Text>
            </View>
          </View>

          <View style={styles.generatorBody}>
            <Text style={styles.generatorTitle}>
              {surprisePlace ? surprisePlace.name : 'Cari Ide Kencan Spontan'}
            </Text>
            <Text style={styles.generatorDesc}>
              {surprisePlace
                ? surprisePlace.address || `Spot rekomendasi kencan kategori ${surprisePlace.category || 'kuliner'}.`
                : 'Kocok untuk memilih tempat kencan kejutan dari data lokasi nyata berdua!'}
            </Text>
          </View>

          <View style={styles.generatorFooter}>
            <View style={styles.generatorMetaTags}>
              <View style={styles.metaTag}>
                <Ionicons name="compass-outline" size={13} color="#5B4041" />
                <Text style={styles.metaTagText}>
                  {surprisePlace?.category || 'Rekomendasi Nyata'}
                </Text>
              </View>
              {surprisePlace && (
                <TouchableOpacity
                  style={[styles.metaTag, { backgroundColor: luminousColors.primaryContainer }]}
                  onPress={() => router.push(`/places/${surprisePlace.id}` as any)}>
                  <Ionicons name="arrow-forward" size={12} color={luminousColors.onPrimaryContainer} />
                  <Text style={[styles.metaTagText, { color: luminousColors.onPrimaryContainer, fontWeight: '700' }]}>
                    Buka Detail
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.kocokBtn}
              onPress={handleShuffleIdea}
              activeOpacity={0.88}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
              </Animated.View>
              <Text style={styles.kocokBtnText}>Kocok Ide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- Curated Section Title ---------------- */}
        <View style={styles.curatedTitleRow}>
          <View>
            <Text style={styles.curatedMainTitle}>Pilihan Kencan di Sekitar</Text>
            <Text style={styles.curatedSubtitle}>
              Data tempat nyata dari OpenStreetMap untuk momen intim bersama {partnerNames.partner}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/explore/map' as any)} activeOpacity={0.7}>
            <Text style={styles.lihatSemuaLink}>Lihat Peta</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- Curated Place Cards ---------------- */}
        <View style={styles.placesList}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={luminousColors.primary} />
              <Text style={styles.loadingText}>Mencari lokasi kencan nyata...</Text>
            </View>
          ) : places.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={32} color={luminousColors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Tempat Ditemukan</Text>
              <Text style={styles.emptyDesc}>
                Tidak menemukan lokasi dengan kata kunci "{searchQuery}". Coba kata kunci lain atau pilih kategori Semua.
              </Text>
            </View>
          ) : (
            places.map((place) => {
              const placeImg = getPlaceImage(place);
              const isSaved = !!bookmarkedIds[place.id];

              return (
                <TouchableOpacity
                  key={place.id}
                  style={styles.placeCard}
                  onPress={() => router.push(`/places/${place.id}` as any)}
                  activeOpacity={0.92}>
                  <View style={styles.placeImageContainer}>
                    <Image source={{ uri: placeImg }} style={styles.placeImg} />
                    <View style={styles.placeScrim} />

                    <View style={styles.placeTopRow}>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={13} color={luminousColors.primary} />
                        <Text style={styles.ratingText}>
                          {place.metadata?.rating || '4.8'}{' '}
                          <Text style={styles.reviewCount}>
                            ({place.metadata?.reviews || 'Terverifikasi'})
                          </Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.heartBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleBookmark(place);
                        }}
                        activeOpacity={0.8}>
                        <Ionicons
                          name={isSaved ? 'heart' : 'heart-outline'}
                          size={18}
                          color={isSaved ? luminousColors.primary : '#5B4041'}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.placeBottomOverlay}>
                      <View style={styles.locationPill}>
                        <Ionicons name="location" size={13} color="#FFFFFF" />
                        <Text style={styles.locationPillText} numberOfLines={1}>
                          {place.address || 'Jakarta'}
                        </Text>
                      </View>
                      {place.category && (
                        <View style={styles.tagPillCrimson}>
                          <Text style={styles.tagPillText} numberOfLines={1}>
                            {place.category}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.placeCardBody}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeSnippet} numberOfLines={2}>
                      {place.address || 'Tempat kencan pilihan bersama pasangan.'}
                    </Text>

                    <View style={styles.placePriceRow}>
                      <View>
                        <Text style={styles.priceLabel}>Kategori</Text>
                        <Text style={styles.priceValue}>
                          {place.category || 'Kencan Romantis'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.rencanakanBtn}
                        onPress={() => router.push(`/places/${place.id}` as any)}
                        activeOpacity={0.88}>
                        <Text style={styles.rencanakanBtnText}>Rencanakan</Text>
                        <Ionicons name="arrow-forward" size={14} color="#B90538" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ---------------- Weekend Tip Box ---------------- */}
        <View style={styles.tipBox}>
          <View style={styles.tipIconCircle}>
            <Ionicons name="bulb" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.tipTextGroup}>
            <Text style={styles.tipTitle}>Tips Kencan Akhir Pekan</Text>
            <Text style={styles.tipDesc}>
              Ajak {partnerNames.partner} vote tempat favorit lewat tombol hati sebelum berangkat!
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Settings / Profile Drawer */}
      <SettingsDrawerModal
        visible={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },

  // ---------------- Header Bar ----------------
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 14,
    backgroundColor: 'rgba(250, 248, 255, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 226, 253, 0.4)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatarOverlap: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: 48,
    height: 36,
  },
  headerIconCircle1: {
    position: 'absolute',
    left: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DAE2FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FAF8FF',
  },
  headerIconCircle2: {
    position: 'absolute',
    left: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C4E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FAF8FF',
  },
  syncedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#40C2FD',
    borderWidth: 1.5,
    borderColor: '#FAF8FF',
  },
  headerTitles: {
    gap: 1,
  },
  headerSyncText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B4041',
  },
  headerSyncDot: {
    color: '#B90538',
    fontWeight: '800',
  },
  headerMainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#131B2E',
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#B90538',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B90538',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },

  // ---------------- Content ----------------
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: 20,
  },

  // ---------------- Search ----------------
  searchSection: {
    gap: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#131B2E',
  },
  curatedBadge: {
    backgroundColor: '#C4E7FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  curatedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#001E2C',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 9999,
    paddingHorizontal: 16,
    height: 52,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E7FF',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#131B2E',
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------------- Chips ----------------
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chipItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E2E7FF',
  },
  chipItemActive: {
    backgroundColor: '#B90538',
    borderColor: '#B90538',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#131B2E',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // ---------------- Generator ----------------
  generatorCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#B90538',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    gap: 12,
  },
  generatorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generatorTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diceIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFDADB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatorKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B90538',
    letterSpacing: 0.8,
  },
  spontanBadge: {
    backgroundColor: '#FFEBF0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  spontanBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B90538',
  },
  generatorBody: {
    gap: 4,
  },
  generatorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#131B2E',
    lineHeight: 21,
  },
  generatorDesc: {
    fontSize: 12,
    color: '#5B4041',
    lineHeight: 18,
  },
  generatorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  generatorMetaTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F2FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5B4041',
  },
  kocokBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#B90538',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    shadowColor: '#B90538',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  kocokBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ---------------- Curated Section Title ----------------
  curatedTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  curatedMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#131B2E',
  },
  curatedSubtitle: {
    fontSize: 12,
    color: '#5B4041',
    marginTop: 2,
  },
  lihatSemuaLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B90538',
  },

  // ---------------- Places List ----------------
  placesList: {
    gap: 16,
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  emptyBox: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEBF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  emptyDesc: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  placeCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  placeImageContainer: {
    height: 190,
    position: 'relative',
  },
  placeImg: {
    width: '100%',
    height: '100%',
  },
  placeScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  placeTopRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#131B2E',
  },
  reviewCount: {
    fontSize: 10,
    fontWeight: '400',
    color: '#5B4041',
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBottomOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(19, 27, 46, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    maxWidth: '65%',
  },
  locationPillText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tagPillCrimson: {
    backgroundColor: 'rgba(185, 5, 56, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    maxWidth: '32%',
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeCardBody: {
    padding: 16,
    gap: 8,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
  },
  placeSnippet: {
    fontSize: 12,
    color: '#5B4041',
    lineHeight: 18,
  },
  placePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F2FA',
  },
  priceLabel: {
    fontSize: 10,
    color: '#8F6F71',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  rencanakanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBF0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  rencanakanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B90538',
  },

  // ---------------- Tip Box ----------------
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFEBF0',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFDADB',
  },
  tipIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#B90538',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextGroup: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  tipDesc: {
    fontSize: 11,
    color: '#5B4041',
    lineHeight: 16,
  },
});
