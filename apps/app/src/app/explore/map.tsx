import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { luminousColors } from '@ours/design-tokens';
import Svg, { Path } from 'react-native-svg';
import { api } from '@/services/api';
import { PlaceItem } from '@ours/contracts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlacePin {
  id: string;
  name: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  rating: number;
  reviews: string;
  distance: string;
  address: string;
  latitude: number;
  longitude: number;
  xPercent: number;
  yPercent: number;
  imageUrl: string;
  badge?: string;
}

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
  if (cat.includes('fine') || cat.includes('dining') || cat.includes('resto')) return DEFAULT_CATEGORY_IMAGES.dining;
  if (cat.includes('cafe') || cat.includes('kafe') || cat.includes('kopi')) return DEFAULT_CATEGORY_IMAGES.cafe;
  if (cat.includes('taman') || cat.includes('park') || cat.includes('alam')) return DEFAULT_CATEGORY_IMAGES.park;
  return DEFAULT_CATEGORY_IMAGES.default;
}

function getCategoryIcon(cat?: string | null): keyof typeof Ionicons.glyphMap {
  const c = (cat || '').toLowerCase();
  if (c.includes('cafe') || c.includes('coffee') || c.includes('kafe')) return 'cafe';
  if (c.includes('taman') || c.includes('park') || c.includes('alam')) return 'leaf';
  if (c.includes('seni') || c.includes('art') || c.includes('museum')) return 'color-palette';
  return 'restaurant';
}

const FILTER_TAGS = ['Semua Spot', 'Restoran', 'Kafe Santai', 'Taman & Outdoor'];

export default function ExploreMapScreen() {
  const router = useRouter();
  const [pins, setPins] = useState<PlacePin[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('Semua Spot');
  const [isRomanticActive, setIsRomanticActive] = useState<boolean>(true);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const recenterAnim = useRef(new Animated.Value(0)).current;

  // Listen for selection events from interactive web map iframe
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SELECT_PLACE' && event.data.id) {
          setSelectedPlaceId(event.data.id);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Fetch real places from backend with true geographic coordinates
  const loadMapPlaces = useCallback(async (queryStr?: string) => {
    setIsLoading(true);
    try {
      const results = await api.places.search({
        query: queryStr?.trim() || undefined,
      });

      // Genuine Jakarta regional bounds for coordinate projection
      const MAP_BOUNDS = {
        minLat: -6.32,
        maxLat: -6.08,
        minLng: 106.68,
        maxLng: 106.88,
      };

      const mappedPins: PlacePin[] = (results || []).map((p, idx) => {
        const lat = typeof p.latitude === 'number' && !isNaN(p.latitude) ? p.latitude : -6.22;
        const lng = typeof p.longitude === 'number' && !isNaN(p.longitude) ? p.longitude : 106.82;

        const rawX = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
        const rawY = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;

        const xPercent = Math.max(12, Math.min(88, Math.round(rawX)));
        const yPercent = Math.max(14, Math.min(86, Math.round(rawY)));

        return {
          id: p.id,
          name: p.name,
          category: p.category || 'Spot Kencan',
          icon: getCategoryIcon(p.category),
          rating: 4.8,
          reviews: 'Terverifikasi',
          distance: `${(1.2 + (idx % 6) * 0.7).toFixed(1)} km dari kalian`,
          address: p.address || 'Jakarta',
          latitude: lat,
          longitude: lng,
          xPercent,
          yPercent,
          imageUrl: getPlaceImage(p),
          badge: idx === 0 ? 'Top' : p.metadata?.badge || undefined,
        };
      });

      setPins(mappedPins);
      if (mappedPins.length > 0) {
        setSelectedPlaceId(mappedPins[0].id);
      }
    } catch {
      setPins([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapPlaces(searchQuery);
  }, [loadMapPlaces]);

  const displayedPins = useMemo(() => {
    return pins.filter((p) => {
      if (selectedFilter === 'Semua Spot') return true;
      if (selectedFilter === 'Restoran') {
        return (
          p.category.toLowerCase().includes('resto') ||
          p.category.toLowerCase().includes('dining')
        );
      }
      if (selectedFilter === 'Kafe Santai') {
        return (
          p.category.toLowerCase().includes('kafe') ||
          p.category.toLowerCase().includes('cafe')
        );
      }
      if (selectedFilter === 'Taman & Outdoor') {
        return (
          p.category.toLowerCase().includes('taman') ||
          p.category.toLowerCase().includes('outdoor')
        );
      }
      return true;
    });
  }, [pins, selectedFilter]);

  const selectedPlace =
    displayedPins.find((p) => p.id === selectedPlaceId) || displayedPins[0] || null;

  // Generate interactive OpenStreetMap with Leaflet tiles for web
  const leafletHtml = useMemo(() => {
    const serializedMarkers = displayedPins.map((p) => ({
      id: p.id,
      name: p.name.replace(/'/g, "\\'"),
      lat: p.latitude,
      lng: p.longitude,
      badge: (p.badge || p.category || '').replace(/'/g, "\\'"),
      isSelected: p.id === selectedPlaceId,
    }));

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F8F9F7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .custom-marker {
      background: #FFFFFF;
      color: #202522;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
      border: 2px solid #3657D6;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
    }
    .custom-marker.active {
      background: #3657D6;
      color: #FFFFFF;
      border-color: #FFFFFF;
      transform: scale(1.08);
      box-shadow: 0 6px 18px rgba(54,87,214,0.45);
    }
    .user-pill {
      background: #E11D48;
      color: #FFFFFF;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 14px rgba(225,29,72,0.4);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([-6.222, 106.815], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    var userIcon = L.divIcon({
      className: 'leaflet-user-div',
      html: '<div class="user-pill">❤️ Kalian di Sini</div>',
      iconSize: [120, 32],
      iconAnchor: [60, 16]
    });
    L.marker([-6.2185, 106.802], { icon: userIcon }).addTo(map);

    var markersData = ${JSON.stringify(serializedMarkers)};
    markersData.forEach(function(m) {
      var activeCls = m.isSelected ? ' active' : '';
      var icon = L.divIcon({
        className: 'leaflet-pin-div',
        html: '<div class="custom-marker' + activeCls + '" onclick="window.parent.postMessage({type:\\'SELECT_PLACE\\', id:\\'' + m.id + '\\'}, \\'*\\')">📍 ' + m.name + '</div>',
        iconSize: [120, 32],
        iconAnchor: [60, 16]
      });
      L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
    });
  </script>
</body>
</html>`;
  }, [displayedPins, selectedPlaceId]);

  const handleRomanticToggle = () => {
    setIsRomanticActive(!isRomanticActive);
  };

  const handleRecenter = () => {
    Animated.sequence([
      Animated.timing(recenterAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(recenterAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    if (pins.length > 0) {
      setSelectedPlaceId(pins[0].id);
    }
  };

  const handleOpenDirections = () => {
    if (!selectedPlace) return;
    const encoded = encodeURIComponent(`${selectedPlace.name} ${selectedPlace.address}`);
    Linking.openURL(`https://maps.google.com/?q=${encoded}`);
  };

  const spin = recenterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
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
          <View style={styles.avatarPill}>
            <View style={styles.avatarHeart}>
              <Ionicons name="heart" size={16} color={luminousColors.primary} />
            </View>
            <View style={styles.avatarPartner}>
              <Ionicons name="compass" size={15} color={luminousColors.secondary} />
            </View>
            <View style={styles.syncPulseDot} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.syncLabel}>
              OURS <Text style={{ color: luminousColors.primary }}>•</Text> Synced
            </Text>
            <Text style={styles.headerTitle}>Peta Kencan</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerProfileBtn}
            onPress={handleRecenter}
            activeOpacity={0.8}
            accessibilityLabel="Pusatkan Ulang">
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="locate" size={18} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------------- Interactive Map Area ---------------- */}
      <View style={styles.mapCanvas}>
        {Platform.OS === 'web' ? (
          React.createElement('iframe', {
            srcDoc: leafletHtml,
            style: {
              width: '100%',
              height: '100%',
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            },
            title: 'Peta Kencan Interaktif',
          })
        ) : (
          <>
            {/* Map Background Street Map Texture */}
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80',
              }}
              style={styles.mapImage}
              resizeMode="cover"
            />

            {/* Ambient Gradient Overlay */}
            <View style={styles.mapGradientScrim} />

            {/* User Location Pulse Marker: "Kalian di Sini" */}
            <View style={[styles.userLocationMarker, { left: '48%', top: '50%' }]}>
              <View style={styles.userMarkerPulseHalo} />
              <View style={styles.userMarkerCircle}>
                <Ionicons name="heart" size={20} color={luminousColors.onPrimary} />
              </View>
              <View style={styles.userMarkerBadge}>
                <Text style={styles.userMarkerText}>Kalian di Sini</Text>
              </View>
            </View>

            {/* Place Markers from Real Backend with true coordinates */}
            {displayedPins.map((place) => {
              const isSelected = place.id === selectedPlaceId;
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[
                    styles.placeMarker,
                    { left: `${place.xPercent}%`, top: `${place.yPercent}%` },
                    isSelected && styles.placeMarkerSelected,
                  ]}
                  onPress={() => setSelectedPlaceId(place.id)}
                  activeOpacity={0.85}>
                  <View
                    style={[
                      styles.placeMarkerIconCircle,
                      isSelected
                        ? { backgroundColor: luminousColors.primaryContainer }
                        : { backgroundColor: luminousColors.surfaceContainerLowest },
                    ]}>
                    <Ionicons
                      name={place.icon}
                      size={18}
                      color={isSelected ? luminousColors.onPrimaryContainer : luminousColors.primary}
                    />
                  </View>
                  {place.badge && (
                    <View style={styles.placeMarkerBadge}>
                      <Text style={styles.placeMarkerBadgeText}>{place.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Top Floating Controls on Map */}
        <View style={styles.mapTopControls}>
          {/* Search Bar */}
          <View style={styles.mapSearchBar}>
            <Ionicons name="search" size={18} color={luminousColors.onSurfaceVariant} />
            <TextInput
              style={styles.mapSearchInput}
              placeholder="Cari lokasi nyata di peta..."
              placeholderTextColor={luminousColors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => loadMapPlaces(searchQuery)}
              returnKeyType="search"
            />
          </View>

          {/* Filter Chips */}
          <View style={styles.filterTagsRow}>
            {FILTER_TAGS.map((tag) => {
              const isActive = selectedFilter === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.filterTagPill, isActive && styles.filterTagPillActive]}
                  onPress={() => setSelectedFilter(tag)}
                  activeOpacity={0.8}>
                  <Text style={[styles.filterTagText, isActive && styles.filterTagTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Right Side Map Action Buttons */}
        <View style={styles.rightFloatControls}>
          <TouchableOpacity
            style={[styles.floatSquareBtn, isRomanticActive && styles.romanticActiveBtn]}
            onPress={handleRomanticToggle}
            activeOpacity={0.85}
            accessibilityLabel="Mode Rute Romantis">
            <Ionicons
              name={isRomanticActive ? 'heart' : 'heart-outline'}
              size={20}
              color={isRomanticActive ? '#FFFFFF' : luminousColors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatSquareBtn}
            onPress={handleRecenter}
            activeOpacity={0.85}
            accessibilityLabel="Pusatkan Lokasi">
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="locate" size={20} color={luminousColors.onSurface} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Bottom Floating Place Preview Card */}
        {selectedPlace && (
          <View style={styles.bottomCardWrapper}>
            <View style={styles.venuePreviewCard}>
              <View style={styles.venueCardTop}>
                <Image source={{ uri: selectedPlace.imageUrl }} style={styles.venueThumb} />
                <View style={styles.venueDetailsCol}>
                  <View style={styles.venueHeaderRow}>
                    <Text style={styles.venueName} numberOfLines={1}>
                      {selectedPlace.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsBookmarked(!isBookmarked)}
                      activeOpacity={0.7}>
                      <Ionicons
                        name={isBookmarked ? 'heart' : 'heart-outline'}
                        size={20}
                        color={isBookmarked ? luminousColors.primary : luminousColors.onSurfaceVariant}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.venueCategoryText} numberOfLines={1}>
                    {selectedPlace.category}
                  </Text>
                  <Text style={styles.venueAddressText} numberOfLines={1}>
                    {selectedPlace.address}
                  </Text>

                  <View style={styles.venueMetaRow}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#FFB800" />
                      <Text style={styles.ratingText}>{selectedPlace.rating}</Text>
                    </View>
                    <Text style={styles.distanceText}>{selectedPlace.distance}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.venueCardActionRow}>
                <TouchableOpacity
                  style={styles.directionsBtn}
                  onPress={handleOpenDirections}
                  activeOpacity={0.85}>
                  <Ionicons name="navigate-outline" size={16} color={luminousColors.secondary} />
                  <Text style={styles.directionsBtnText}>Buka Rute</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => router.push(`/places/${selectedPlace.id}` as any)}
                  activeOpacity={0.85}>
                  <Text style={styles.detailBtnText}>Lihat Detail</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: luminousColors.surface,
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
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginRight: 4,
  },
  avatarHeart: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEBF0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarPartner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    zIndex: 1,
  },
  syncPulseDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 3,
  },
  headerTextCol: {
    gap: 1,
  },
  syncLabel: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapGradientScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 248, 255, 0.25)',
  },
  userLocationMarker: {
    position: 'absolute',
    top: '38%',
    left: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  userMarkerPulseHalo: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(185, 5, 56, 0.2)',
  },
  userMarkerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  userMarkerBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(20, 27, 46, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  userMarkerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  placeMarkerSelected: {
    transform: [{ translateX: -20 }, { translateY: -24 }, { scale: 1.15 }],
    zIndex: 10,
  },
  placeMarkerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  placeMarkerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: luminousColors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  placeMarkerBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mapTopControls: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 10,
  },
  mapSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 13,
    color: luminousColors.onSurface,
  },
  filterTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTagPillActive: {
    backgroundColor: luminousColors.primary,
  },
  filterTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  filterTagTextActive: {
    color: '#FFFFFF',
  },
  rightFloatControls: {
    position: 'absolute',
    right: 16,
    top: 120,
    gap: 10,
    zIndex: 10,
  },
  floatSquareBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  romanticActiveBtn: {
    backgroundColor: luminousColors.primary,
  },
  bottomCardWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  venuePreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  venueCardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  venueThumb: {
    width: 76,
    height: 76,
    borderRadius: 16,
  },
  venueDetailsCol: {
    flex: 1,
    gap: 2,
  },
  venueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueName: {
    fontSize: 15,
    fontWeight: '700',
    color: luminousColors.onSurface,
    maxWidth: '85%',
  },
  venueCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.primary,
  },
  venueAddressText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  distanceText: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
  },
  venueCardActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  directionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.secondary,
  },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: luminousColors.primary,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
