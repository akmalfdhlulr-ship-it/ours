import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { luminousColors } from '@ours/design-tokens';
import { useCoupleData, SharedMemory } from '../../context/couple-data-context';

const CATEGORY_TABS = [
  'Semua Momen',
  '✈️ Liburan & Trip',
  '☕ Kencan Kuliner',
  '💌 Hari Spesial',
];

export default function SharedMemoriesScreen() {
  const router = useRouter();
  const {
    memories,
    addMemory,
    deleteMemory,
    refreshMemories,
    partnerNames,
    activeRole,
  } = useCoupleData();

  const [activeTab, setActiveTab] = useState<string>('Semua Momen');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [selectedMemory, setSelectedMemory] = useState<SharedMemory | null>(null);

  // Add Memory Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newImageUri, setNewImageUri] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>(partnerNames.user);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMemories();
    } catch (err: any) {
      console.warn('Refresh memories error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Launch Image Picker from gallery
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Galeri', 'Aplikasi memerlukan izin galeri untuk memilih foto kenangan.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setNewImageUri(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setNewImageUri(asset.uri);
        }
      }
    } catch (err: any) {
      Alert.alert('Kendala Galeri', err?.message || 'Gagal memilih foto.');
    }
  };

  // Launch Camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Kamera', 'Aplikasi memerlukan izin kamera untuk memotret momen.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setNewImageUri(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setNewImageUri(asset.uri);
        }
      }
    } catch (err: any) {
      Alert.alert('Kendala Kamera', err?.message || 'Gagal membuka kamera.');
    }
  };

  const handleSaveMemory = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Judul Wajib Diisi', 'Berikan judul manis untuk momen kencan ini.');
      return;
    }

    if (!newImageUri) {
      Alert.alert('Foto Wajib Dipilih 📸', 'Ambil foto dari kamera atau pilih dari galeri foto kencan aslimu.');
      return;
    }

    setIsSaving(true);
    try {
      await addMemory({
        title: newTitle.trim(),
        description: newDescription.trim() || 'Momen manis yang tak terlupakan bersama.',
        locationName: newLocation.trim() || 'Jakarta',
        date: 'Hari Ini',
        author: newAuthor,
        imageUrl: newImageUri,
      });

      setIsAddModalOpen(false);
      setNewTitle('');
      setNewLocation('');
      setNewDescription('');
      setNewImageUri('');
    } catch (err: any) {
      Alert.alert('Kendala Simpan', err?.message || 'Gagal menyimpan momen ke ruang berdua.');
    } finally {
      setIsSaving(false);
    }
  };

  const highlightMemory = memories[0];

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
          <View style={styles.avatarPill}>
            <View style={styles.avatarHeart}>
              <Ionicons name="heart" size={16} color={luminousColors.primary} />
            </View>
            <View style={styles.avatarPartner}>
              <Ionicons name="person" size={15} color={luminousColors.secondary} />
            </View>
            <View style={styles.syncPulseDot} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.syncLabel}>
              OURS <Text style={{ color: luminousColors.primary }}>•</Text> Bersama
            </Text>
            <Text style={styles.headerTitle}>Ruang Kita</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.75}
            accessibilityLabel="Tambah Foto">
            <Ionicons name="add" size={22} color={luminousColors.primary} />
          </TouchableOpacity>
          <View style={styles.headerProfileBtn}>
            <Ionicons name="person" size={16} color={luminousColors.onPrimary} />
          </View>
        </View>
      </View>

      {/* ---------------- Main Scroll View ---------------- */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }>
        {/* Title Header */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Buku Waktu Berdua</Text>
          <Text style={styles.pageSubtitle}>
            {memories.length === 0
              ? 'Mulai simpan kenangan pertama kalian berdua'
              : `${memories.length} Momen Kasih Tersimpan`}
          </Text>
        </View>

        {/* Category Horizontal Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}>
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.categoryTabText,
                    isActive && styles.categoryTabTextActive,
                  ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ---------------- CLEAN EMPTY STATE ---------------- */}
        {memories.length === 0 ? (
          <View style={styles.cleanEmptyContainer}>
            <View style={styles.emptyIconGlowBox}>
              <Ionicons name="images-outline" size={48} color={luminousColors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Buku Waktu Masih Bersih 🌱</Text>
            <Text style={styles.emptyDesc}>
              Setiap kisah cinta yang hebat dimulai dari satu langkah kecil. Abadikan foto kencan
              pertamamu berdua untuk membuka lembaran memori cinta kalian.
            </Text>

            <TouchableOpacity
              style={styles.emptyCtaBtn}
              onPress={() => setIsAddModalOpen(true)}
              activeOpacity={0.88}>
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
              <Text style={styles.emptyCtaText}>+ Ambil Foto Pertama Berdua 📸</Text>
            </TouchableOpacity>

            <View style={styles.emptyHintCard}>
              <Ionicons name="heart" size={16} color={luminousColors.primary} />
              <Text style={styles.emptyHintText}>
                Foto yang kamu simpan akan langsung terlihat di ponsel {partnerNames.partner} juga!
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* ---------------- Highlight Hero Polaroid ---------------- */}
            {highlightMemory && (
              <View style={styles.heroPolaroidCard}>
                <View style={styles.heroPolaroidInner}>
                  <View style={styles.heroImageWrapper}>
                    <Image
                      source={{ uri: highlightMemory.imageUrl }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                    <View style={styles.heroDateBadge}>
                      <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                      <Text style={styles.heroDateBadgeText}>{highlightMemory.date}</Text>
                    </View>
                  </View>

                  <View style={styles.heroCaptionCol}>
                    <Text style={styles.heroTitle}>{highlightMemory.title}</Text>
                    <Text style={styles.heroLocation}>📍 {highlightMemory.locationName}</Text>
                    <Text style={styles.heroDescription}>"{highlightMemory.description}"</Text>
                    <View style={styles.heroAuthorBadge}>
                      <Ionicons name="person-circle-outline" size={14} color={luminousColors.secondary} />
                      <Text style={styles.heroAuthorText}>
                        Diabadikan oleh {highlightMemory.author}
                      </Text>
                    </View>
                  </View>

                  {/* Audio Memo Bar (if present) */}
                  {highlightMemory.audioTitle && (
                    <TouchableOpacity
                      style={styles.audioPlayerBar}
                      onPress={() => setIsPlayingAudio(!isPlayingAudio)}
                      activeOpacity={0.85}>
                      <View style={styles.playIconCircle}>
                        <Ionicons
                          name={isPlayingAudio ? 'pause' : 'play'}
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={styles.audioTitleCol}>
                        <Text style={styles.audioTitleText}>{highlightMemory.audioTitle}</Text>
                        <Text style={styles.audioDurationText}>
                          {isPlayingAudio ? 'Memutar...' : highlightMemory.audioDuration}
                        </Text>
                      </View>
                      <Ionicons
                        name="volume-medium-outline"
                        size={18}
                        color={luminousColors.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ---------------- Polaroid Gallery Grid ---------------- */}
            <View style={styles.gallerySection}>
              <View style={styles.galleryHeaderRow}>
                <Text style={styles.gallerySectionTitle}>Semua Lembaran Kenangan</Text>
                <TouchableOpacity onPress={() => setIsAddModalOpen(true)}>
                  <Text style={styles.addMoreLink}>+ Tambah Foto</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.polaroidGrid}>
                {memories.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.polaroidGridItem}
                    onPress={() => setSelectedMemory(item)}
                    activeOpacity={0.88}>
                    <View style={styles.gridImageWrapper}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.gridImage}
                        resizeMode="cover"
                      />
                      <View style={styles.gridAuthorTag}>
                        <Text style={styles.gridAuthorText}>{item.author}</Text>
                      </View>
                    </View>
                    <View style={styles.gridMetaBox}>
                      <Text style={styles.gridItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.gridItemDate}>{item.date}</Text>
                      <Text style={styles.gridItemQuote} numberOfLines={2}>
                        "{item.description}"
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ---------------- ADD PHOTO MODAL ---------------- */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Abadikan Kenangan Berdua</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Image Preview or Pick Buttons */}
              {newImageUri ? (
                <View style={styles.imagePreviewBox}>
                  <Image source={{ uri: newImageUri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.changeImageBtn}
                    onPress={() => setNewImageUri('')}>
                    <Text style={styles.changeImageText}>Ganti Foto</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerOptions}>
                  <TouchableOpacity
                    style={styles.pickerOptionBtn}
                    onPress={handlePickImage}
                    activeOpacity={0.8}>
                    <Ionicons name="images-outline" size={24} color={luminousColors.primary} />
                    <Text style={styles.pickerOptionText}>Pilih dari Galeri</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerOptionBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}>
                    <Ionicons name="camera-outline" size={24} color={luminousColors.secondary} />
                    <Text style={styles.pickerOptionText}>Buka Kamera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Title Input */}
              <Text style={styles.inputLabel}>Judul Momen *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Kencan Pertama di Rooftop Cafe"
                placeholderTextColor={luminousColors.outline}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              {/* Location Input */}
              <Text style={styles.inputLabel}>Lokasi Kencan</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Senopati, Jakarta Selatan"
                placeholderTextColor={luminousColors.outline}
                value={newLocation}
                onChangeText={setNewLocation}
              />

              {/* Description Input */}
              <Text style={styles.inputLabel}>Cerita Singkat / Kesan Manis</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Tuliskan tawa atau hal kecil yang bikin momen ini spesial..."
                placeholderTextColor={luminousColors.outline}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
              />

              {/* Author Selector */}
              <Text style={styles.inputLabel}>Siapa yang Mengabadikan?</Text>
              <View style={styles.authorSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.authorChip,
                    newAuthor === partnerNames.user && styles.authorChipActive,
                  ]}
                  onPress={() => setNewAuthor(partnerNames.user)}>
                  <Text
                    style={[
                      styles.authorChipText,
                      newAuthor === partnerNames.user && styles.authorChipTextActive,
                    ]}>
                    {partnerNames.user} (Kamu)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.authorChip,
                    newAuthor === partnerNames.partner && styles.authorChipActive,
                  ]}
                  onPress={() => setNewAuthor(partnerNames.partner)}>
                  <Text
                    style={[
                      styles.authorChipText,
                      newAuthor === partnerNames.partner && styles.authorChipTextActive,
                    ]}>
                    {partnerNames.partner}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveMemoryBtn, isSaving && { opacity: 0.8 }]}
              onPress={handleSaveMemory}
              disabled={isSaving}
              activeOpacity={0.88}>
              {isSaving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.saveMemoryBtnText}>Menyimpan ke Ruang Berdua...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.saveMemoryBtnText}>Simpan ke Buku Waktu ✨</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ---------------- DETAIL PHOTO & STORY MODAL ---------------- */}
      <Modal
        visible={!!selectedMemory}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMemory(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedMemory?.title}
                </Text>
                <Text style={{ fontSize: 12, color: luminousColors.onSurfaceVariant, marginTop: 2 }}>
                  📍 {selectedMemory?.locationName} • {selectedMemory?.date}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMemory(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedMemory && (
                <View style={{ alignItems: 'center', marginVertical: 12 }}>
                  <Image
                    source={{ uri: selectedMemory.imageUrl }}
                    style={{ width: '100%', height: 260, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F8F6FA',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 14,
                      marginTop: 10,
                      alignSelf: 'flex-start',
                    }}>
                    <Ionicons name="person-circle-outline" size={16} color={luminousColors.primary} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: luminousColors.onSurface }}>
                      Diabadikan oleh {selectedMemory.author}
                    </Text>
                  </View>
                </View>
              )}

              <View style={{ backgroundColor: '#FAF8F6', padding: 14, borderRadius: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: luminousColors.primary }}>
                <Text style={{ fontSize: 14, fontStyle: 'italic', color: luminousColors.onSurface, lineHeight: 22 }}>
                  "{selectedMemory?.description}"
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#FFEBEE',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                  onPress={() => {
                    if (selectedMemory) {
                      deleteMemory(selectedMemory.id);
                      setSelectedMemory(null);
                    }
                  }}>
                  <Ionicons name="trash-outline" size={16} color="#D32F2F" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#D32F2F', fontWeight: '700', fontSize: 13 }}>Hapus Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: luminousColors.primary,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => setSelectedMemory(null)}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Tutup Tampilan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: luminousColors.surface,
  },
  header: {
    height: 64,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(185, 5, 56, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 16,
    position: 'relative',
    gap: 2,
  },
  avatarHeart: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPartner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: luminousColors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncPulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerTextCol: {
    marginLeft: 4,
  },
  syncLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: luminousColors.onSurfaceVariant,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: luminousColors.onSurface,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 218, 219, 0.5)',
  },
  headerProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  titleSection: {
    gap: 2,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: luminousColors.onSurface,
  },
  pageSubtitle: {
    fontSize: 13,
    color: luminousColors.onSurfaceVariant,
  },
  tabsScroll: {
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  categoryTabActive: {
    backgroundColor: luminousColors.primary,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cleanEmptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  emptyIconGlowBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: luminousColors.onSurface,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  emptyCtaBtn: {
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 218, 219, 0.45)',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginTop: 10,
  },
  emptyHintText: {
    flex: 1,
    fontSize: 11,
    color: luminousColors.primary,
    lineHeight: 16,
    fontWeight: '600',
  },
  heroPolaroidCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 26,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  heroPolaroidInner: {
    gap: 12,
  },
  heroImageWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroDateBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  heroDateBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroCaptionCol: {
    paddingHorizontal: 4,
    gap: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  heroLocation: {
    fontSize: 11,
    color: luminousColors.secondary,
    fontWeight: '600',
  },
  heroDescription: {
    fontSize: 13,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 2,
  },
  heroAuthorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  heroAuthorText: {
    fontSize: 11,
    color: luminousColors.secondary,
    fontWeight: '600',
  },
  audioPlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 218, 219, 0.5)',
    borderRadius: 16,
    padding: 10,
    gap: 10,
  },
  playIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTitleCol: {
    flex: 1,
  },
  audioTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  audioDurationText: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
  },
  gallerySection: {
    gap: 12,
  },
  galleryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  gallerySectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  addMoreLink: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  polaroidGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  polaroidGridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  gridImageWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridAuthorTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridAuthorText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gridMetaBox: {
    gap: 2,
  },
  gridItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  gridItemDate: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
  },
  gridItemQuote: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 14,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  modalScroll: {
    maxHeight: 400,
  },
  imagePickerOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  pickerOptionBtn: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    backgroundColor: luminousColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(227, 189, 191, 0.3)',
  },
  pickerOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  imagePreviewBox: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  changeImageText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: luminousColors.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(227, 189, 191, 0.3)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  authorSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  authorChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: luminousColors.surfaceContainerLow,
    alignItems: 'center',
  },
  authorChipActive: {
    backgroundColor: luminousColors.primary,
  },
  authorChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  authorChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveMemoryBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveMemoryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
