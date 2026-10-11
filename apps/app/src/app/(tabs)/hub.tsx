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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  BookOpen,
  Camera,
  Heart,
  Image as ImageIcon,
  Mail,
  Plus,
  Sparkles,
  Trash2,
  X,
  ChevronRight,
  FolderPlus,
  ArrowLeft,
  Check,
} from 'lucide-react-native';
import { colors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { api } from '@/services/api';
import {
  AlbumItem,
  MemoryItem,
  WishlistItemResponse,
  LoveLetterDto,
  CoupleGoalDto,
  MemoryMapResponseDto,
} from '@ours/contracts';
import { Ionicons } from '@expo/vector-icons';
import { formatTanggal } from '@/utils/format';
import { DriftWall, DriftWallItem } from '@/components/free-components/DriftWall';
import { PaperCrumpleCard } from '@/components/free-components/PaperCrumpleCard';

type HubViewMode = 'menu' | 'memories' | 'scrapbooks' | 'memory-map' | 'wishlist' | 'goals' | 'letters';

export default function SharedHubScreen() {
  const router = useRouter();
  const { user, coupleSpace, logout } = useAuth();
  const [viewMode, setViewMode] = useState<HubViewMode>('menu');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Real data states
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItemResponse[]>([]);
  const [goals, setGoals] = useState<CoupleGoalDto[]>([]);
  const [letters, setLetters] = useState<LoveLetterDto[]>([]);
  const [memoryMap, setMemoryMap] = useState<MemoryMapResponseDto | null>(null);

  // Selected memory for map & preview
  const [selectedMapMemory, setSelectedMapMemory] = useState<MemoryItem | null>(null);

  // Modals & form states
  const [showAddWishModal, setShowAddWishModal] = useState(false);
  const [wishTitle, setWishTitle] = useState('');
  const [wishCategory, setWishCategory] = useState('Pengalaman');

  // Memories with real photo upload
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemNotes, setNewMemNotes] = useState('');
  const [newMemDate, setNewMemDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMemPhotoUri, setNewMemPhotoUri] = useState<string | null>(null);
  const [uploadingMemPhoto, setUploadingMemPhoto] = useState(false);

  // Scrapbook Screen State (Matching Image 4)
  const [scrapbookPage, setScrapbookPage] = useState<number>(14);
  const [scrapbookTab, setScrapbookTab] = useState<'buku' | 'kolase'>('buku');
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const [isScrapbookLoved, setIsScrapbookLoved] = useState<boolean>(true);

  // Scrapbooks & Albums
  const [selectedAlbum, setSelectedAlbum] = useState<(AlbumItem & { memories?: MemoryItem[] }) | null>(null);
  const [loadingAlbumDetail, setLoadingAlbumDetail] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [newAlbumCoverUri, setNewAlbumCoverUri] = useState<string | null>(null);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [showAddMemToAlbumModal, setShowAddMemToAlbumModal] = useState(false);
  const [addingMemToAlbum, setAddingMemToAlbum] = useState(false);

  // Letters
  const [showAddLetterModal, setShowAddLetterModal] = useState(false);
  const [letterTitle, setLetterTitle] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [readingLetter, setReadingLetter] = useState<LoveLetterDto | null>(null);

  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [memRes, albRes, wishRes, goalRes, letRes, mapRes] = await Promise.all([
        api.memories.list().catch(() => []),
        api.albums.list().catch(() => []),
        api.wishlist.list().catch(() => []),
        api.goals.list().catch(() => []),
        api.letters.list().catch(() => []),
        api.memoryMap.get().catch(() => null),
      ]);
      setMemories(memRes);
      setAlbums(albRes);
      setWishlistItems(wishRes);
      setGoals(goalRes);
      setLetters(letRes);
      setMemoryMap(mapRes);

      if (memRes.length > 0 && !selectedMapMemory) {
        setSelectedMapMemory(memRes[0]);
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal memuat data kenangan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMapMemory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreateWish = async () => {
    if (!wishTitle.trim()) return;
    try {
      await api.wishlist.create({
        title: wishTitle.trim(),
        category: wishCategory,
        priority: 'MEDIUM',
      });
      setWishTitle('');
      setShowAddWishModal(false);
      setStatusMessage('Wishlist bersama berhasil ditambahkan!');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menambahkan impian');
    }
  };

  const handleToggleWish = async (item: WishlistItemResponse) => {
    try {
      const nextStatus = item.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
      await api.wishlist.update(item.id, { status: nextStatus });
      setStatusMessage(
        nextStatus === 'COMPLETED'
          ? `Selamat! Impian "${item.title}" tercapai! ❤️`
          : `Mengembalikan status "${item.title}"`,
      );
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal mengubah status');
    }
  };

  const handlePickImage = async (onSelected: (uri: string) => void) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event: any) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) onSelected(dataUrl);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setStatusMessage('Izin galeri foto diperlukan untuk memilih gambar');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.82,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        onSelected(uri);
      }
    } catch (err: any) {
      setStatusMessage('Gagal memilih foto: ' + (err?.message || ''));
    }
  };

  const handleCaptureImage = async (onSelected: (uri: string) => void) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setStatusMessage('Izin kamera diperlukan untuk mengambil foto');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.82,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        onSelected(uri);
      }
    } catch (err: any) {
      handlePickImage(onSelected);
    }
  };

  const handleCreateMemory = async () => {
    if (!newMemTitle.trim()) {
      setStatusMessage('Judul kenangan harus diisi');
      return;
    }
    setUploadingMemPhoto(true);
    try {
      let mediaAssetIds: string[] | undefined = undefined;
      if (newMemPhotoUri) {
        try {
          const asset = await api.media.directUpload({
            imageBase64: newMemPhotoUri,
            filename: `memory_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
          });
          if (asset?.id) {
            mediaAssetIds = [asset.id];
          }
        } catch (mErr) {
          console.warn('Media upload fallback:', mErr);
        }
      }

      await api.memories.create({
        title: newMemTitle.trim(),
        memoryDate: newMemDate,
        description: newMemNotes.trim() || undefined,
        mediaAssetIds,
      });

      setNewMemTitle('');
      setNewMemNotes('');
      setNewMemPhotoUri(null);
      setShowAddMemoryModal(false);
      setStatusMessage('Kenangan indah & foto berhasil diabadikan! 📸❤️');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menyimpan kenangan');
    } finally {
      setUploadingMemPhoto(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      setStatusMessage('Judul scrapbook harus diisi');
      return;
    }
    setCreatingAlbum(true);
    try {
      let coverMediaId: string | undefined = undefined;
      if (newAlbumCoverUri) {
        try {
          const asset = await api.media.directUpload({
            imageBase64: newAlbumCoverUri,
            filename: `album_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
          });
          if (asset?.id) {
            coverMediaId = asset.id;
          }
        } catch (mErr) {
          console.warn('Album cover upload fallback:', mErr);
        }
      }

      await api.albums.create({
        title: newAlbumTitle.trim(),
        description: newAlbumDesc.trim() || undefined,
        coverMediaId,
      });

      setNewAlbumTitle('');
      setNewAlbumDesc('');
      setNewAlbumCoverUri(null);
      setShowCreateAlbumModal(false);
      setStatusMessage('Scrapbook kenangan baru berhasil dibuat! 📖✨');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal membuat scrapbook');
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleOpenAlbum = async (album: AlbumItem) => {
    setSelectedAlbum(album);
    setLoadingAlbumDetail(true);
    try {
      const fullAlbum = await api.albums.getById(album.id);
      setSelectedAlbum(fullAlbum);
    } catch (err: any) {
      setStatusMessage('Gagal memuat isi scrapbook');
    } finally {
      setLoadingAlbumDetail(false);
    }
  };

  const handleAddMemoryToAlbum = async (memoryId: string) => {
    if (!selectedAlbum) return;
    setAddingMemToAlbum(true);
    try {
      await api.albums.addMemory(selectedAlbum.id, memoryId);
      const updated = await api.albums.getById(selectedAlbum.id);
      setSelectedAlbum(updated);
      setShowAddMemToAlbumModal(false);
      setStatusMessage('Kenangan berhasil ditambahkan ke scrapbook! 📖');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menambahkan kenangan');
    } finally {
      setAddingMemToAlbum(false);
    }
  };

  const handleSendLetter = async () => {
    if (!letterTitle.trim() || !letterContent.trim()) {
      setStatusMessage('Judul dan isi surat harus diisi');
      return;
    }
    try {
      await api.letters.create({
        title: letterTitle.trim(),
        content: letterContent.trim(),
        status: 'SENT',
      });
      setLetterTitle('');
      setLetterContent('');
      setShowAddLetterModal(false);
      setStatusMessage('Surat cinta rahasia berhasil disegel dan dikirim ke pasangan! 💌');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal mengirim surat');
    }
  };

  const handleOpenLetter = async (letItem: LoveLetterDto) => {
    try {
      const updated = await api.letters.get(letItem.id);
      setReadingLetter(updated);
      fetchData();
    } catch {
      setReadingLetter(letItem);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) return;
    try {
      await api.goals.create({
        title: goalTitle.trim(),
        category: 'Keuangan',
        description: goalTargetAmount ? `Target: Rp ${goalTargetAmount}` : undefined,
      });
      setGoalTitle('');
      setGoalTargetAmount('');
      setShowAddGoalModal(false);
      setStatusMessage('Tujuan bersama berhasil dibuat!');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal membuat tujuan keuangan');
    }
  };

  const completedWishCount = wishlistItems.filter((w) => w.status === 'COMPLETED').length;
  const totalWishCount = wishlistItems.length;

  // Convert memories into DriftWallItems with real uploaded photo URLs
  const driftWallItems: DriftWallItem[] = memories.map((m, idx) => ({
    id: m.id,
    url:
      m.media?.[0]?.mediaAsset?.secureUrl ||
      (m as any).mediaAssets?.[0]?.url ||
      (m as any).coverUrl ||
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
    title: m.title,
    caption: m.description || undefined,
    date: formatTanggal(m.memoryDate),
    heightRatio: idx % 2 === 0 ? 1.25 : 0.95,
  }));

  const primaryGoal = goals.length > 0 ? goals[0] : null;
  const goalProgress = primaryGoal ? primaryGoal.progressPercentage : 0;

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {viewMode !== 'menu' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (selectedAlbum) {
                  setSelectedAlbum(null);
                } else {
                  setViewMode('menu');
                }
              }}>
              <Ionicons name="arrow-back" size={20} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {viewMode === 'menu'
              ? 'Ruang Hubungan'
              : viewMode === 'memories'
                ? 'Kenangan Kita'
                : viewMode === 'scrapbooks'
                  ? (selectedAlbum ? selectedAlbum.title : 'Scrapbook & Album')
                  : viewMode === 'memory-map'
                    ? 'Peta Kenangan'
                    : viewMode === 'wishlist'
                      ? 'Wishlist Bersama'
                      : viewMode === 'goals'
                        ? 'Tujuan Bersama'
                        : 'Surat Cinta'}
          </Text>
          <TouchableOpacity
            style={styles.headerRightBtn}
            onPress={() => router.push('/(pairing)/settings')}>
            <Ionicons name="settings-outline" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast Feedback */}
      {statusMessage && (
        <View style={styles.statusToast}>
          <Text style={styles.statusToastText}>{statusMessage}</Text>
          <TouchableOpacity onPress={() => setStatusMessage(null)}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Memuat ruang cerita...</Text>
        </View>
      ) : viewMode === 'menu' ? (
        /* ================= MAIN HUB MENU ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          {/* Profile Header Card */}
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/(pairing)/settings')}
            activeOpacity={0.88}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatarCircle, { backgroundColor: '#E0E7FF' }]}>
                <Text style={styles.avatarInitial}>
                  {(user?.email?.[0] || 'K').toUpperCase()}
                </Text>
              </View>
              <View style={[styles.avatarCircle, { marginLeft: -12, backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.avatarInitial, { color: '#E11D48' }]}>P</Text>
              </View>
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.profileNames}>
                {coupleSpace?.name ? `Kisah ${coupleSpace.name}` : 'Ruang Kita'}
              </Text>
              <Text style={styles.profileTogetherText}>
                {coupleSpace?.status === 'ACTIVE' ? 'Pasangan Terhubung ❤️' : 'Menunggu Pasangan Terhubung'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Section: Feature Navigation */}
          <View style={styles.menuListSection}>
            {/* 1. Kenangan Kita */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => setViewMode('memories')}
              activeOpacity={0.88}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="images" size={20} color="#DB2777" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Kenangan Kita</Text>
                <Text style={styles.menuSub}>
                  {memories.length > 0 ? `${memories.length} momen diabadikan` : 'Galeri editorial foto berdua'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 2. Scrapbook & Album Kenangan */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => setViewMode('scrapbooks')}
              activeOpacity={0.88}>
              <View style={[styles.menuIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="book" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Scrapbook & Album</Text>
                <Text style={styles.menuSub}>
                  {albums.length > 0 ? `${albums.length} album kisah cinta` : 'Koleksi album tematik kenangan'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 3. Peta Kenangan */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => setViewMode('memory-map')}
              activeOpacity={0.88}>
              <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="map" size={20} color="#2563EB" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Peta Kenangan</Text>
                <Text style={styles.menuSub}>Jejak geolokasi dan kenangan kencan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 3. Wishlist Kita */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => setViewMode('wishlist')}
              activeOpacity={0.88}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="bookmark" size={20} color="#D97706" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Wishlist Bersama</Text>
                <Text style={styles.menuSub}>
                  {totalWishCount} impian • {completedWishCount} tercapai
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 4. Goal Card */}
            <TouchableOpacity
              style={styles.financialGoalCard}
              onPress={() => setViewMode('goals')}
              activeOpacity={0.9}>
              <View style={styles.goalHeaderRow}>
                <View style={[styles.menuIconBox, { backgroundColor: '#E0E7FF', width: 36, height: 36 }]}>
                  <Ionicons name="flag" size={18} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalCardTitle}>
                    {primaryGoal ? primaryGoal.title : 'Tujuan Bersama'}
                  </Text>
                  <Text style={styles.goalCardSub}>
                    {primaryGoal ? (primaryGoal.description || 'Target Pasangan') : 'Rencanakan pencapaian bersama'}
                  </Text>
                </View>
                <Text style={styles.goalPercentBadge}>{goalProgress}%</Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${goalProgress}%` }]} />
              </View>

              <View style={styles.goalAmountRow}>
                <Text style={styles.goalAmountCurrent}>
                  {primaryGoal?.status === 'ACHIEVED' ? 'Tercapai 🎉' : `${goalProgress}% Selesai`}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 5. Surat Cinta */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => setViewMode('letters')}
              activeOpacity={0.88}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="mail" size={20} color="#F43F5E" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Surat Cinta</Text>
                <Text style={styles.menuSub}>
                  {letters.length > 0 ? `${letters.length} surat manis tersimpan` : 'Tulis surat rahasia berdua'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => router.push('/(pairing)/settings')}>
              <Ionicons name="settings-outline" size={18} color="#4B5563" />
              <Text style={styles.settingsRowText}>Pengaturan Akun & Pasangan</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => router.push('/(pairing)/waiting')}>
              <Ionicons name="heart-outline" size={18} color="#4B5563" />
              <Text style={styles.settingsRowText}>Status Pairing & Undangan</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
            activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.signOutButtonText}>Keluar Akun</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : viewMode === 'memories' ? (
        /* ================= DRIFTWALL MEMORIES GALLERY ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          <View style={styles.galleryHeaderRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>Galeri Kenangan</Text>
              <Text style={styles.sectionHeaderSub}>Koleksi momen indah berdua</Text>
            </View>
            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={() => setShowAddMemoryModal(true)}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
              <Text style={styles.addSmallBtnText}>Abadikan</Text>
            </TouchableOpacity>
          </View>

          {driftWallItems.length > 0 ? (
            <DriftWall
              items={driftWallItems}
              onItemPress={(item) => {
                const found = memories.find((m) => m.id === item.id);
                if (found) {
                  setSelectedMapMemory(found);
                }
              }}
            />
          ) : (
            <View style={styles.emptyGalleryBox}>
              <Ionicons name="images-outline" size={42} color="#F43F5E" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>Belum Ada Kenangan Tersimpan</Text>
              <Text style={styles.emptySub}>
                Abadikan foto kencan pertama kalian untuk membuat galeri kenangan cinta yang indah.
              </Text>
              <TouchableOpacity
                style={styles.addMemoryPrimaryBtn}
                onPress={() => setShowAddMemoryModal(true)}>
                <Ionicons name="camera" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addMemoryPrimaryBtnText}>Tambah Kenangan Pertama</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : viewMode === 'scrapbooks' ? (
        /* ================= SCRAPBOOKS KENANGAN KITA (Matching Image 4) ================= */
        <View style={{ flex: 1, backgroundColor: '#F8F9FF' }}>
          {/* Top Bar Navigation & Tab Toggle */}
          <View style={styles.sbTopBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setViewMode('menu')}
                style={styles.sbBackBtn}
                activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={18} color="#1E293B" />
              </TouchableOpacity>
              <View style={styles.sbHeartCircle}>
                <Ionicons name="heart" size={18} color="#F43F5E" />
              </View>
              <Text style={styles.sbTitle}>Scrapbook</Text>
            </View>

            <View style={styles.sbTabSegment}>
              <TouchableOpacity
                style={[styles.sbTabBtn, scrapbookTab === 'buku' && styles.sbTabBtnActive]}
                onPress={() => setScrapbookTab('buku')}>
                <Text style={[styles.sbTabText, scrapbookTab === 'buku' && styles.sbTabTextActive]}>
                  Halaman Buku
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sbTabBtn, scrapbookTab === 'kolase' && styles.sbTabBtnActive]}
                onPress={() => setScrapbookTab('kolase')}>
                <Text style={[styles.sbTabText, scrapbookTab === 'kolase' && styles.sbTabTextActive]}>
                  Kolase
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.sbScrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
            }>
            {/* Pagination Sub-header */}
            <View style={styles.sbPaginationRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.sbPagePill}>
                  <Text style={styles.sbPagePillText}>Halaman {scrapbookPage} dari 36</Text>
                </View>
                <Text style={styles.sbLastEditedText}>Disunting kemarin oleh Sasa</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  style={styles.sbPageNavBtn}
                  onPress={() => setScrapbookPage((p) => Math.max(1, p - 1))}>
                  <Ionicons name="chevron-back" size={15} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sbPageNavBtn}
                  onPress={() => setScrapbookPage((p) => Math.min(36, p + 1))}>
                  <Ionicons name="chevron-forward" size={15} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Kanvas Scrapbook Container */}
            <View style={styles.sbCanvasCard}>
              {/* Location Tag & Heading */}
              <View style={{ marginBottom: 16 }}>
                <View style={styles.sbLocationPill}>
                  <Text style={styles.sbLocationPillText}>📍 Uluwatu & Seminyak, Bali</Text>
                </View>
                <Text style={styles.sbCanvasHeading}>Senja Pertama di Pantai 🌅</Text>
                <Text style={styles.sbCanvasDateText}>14 FEBRUARI 2024 • 17:45 WITA</Text>
              </View>

              {/* Polaroid Frame Utama */}
              <View style={styles.sbPolaroidCard}>
                <View style={styles.sbPolaroidImageWrapper}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
                    }}
                    style={styles.sbPolaroidImg}
                    resizeMode="cover"
                  />
                  <View style={styles.sbPolaroidTagBadge}>
                    <Ionicons name="camera-outline" size={11} color="#FFFFFF" />
                    <Text style={styles.sbPolaroidTagText}>Polaroid #01</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.sbPolaroidCaption}>"Hari pertama kita liat sunset bareng..."</Text>
                    <Text style={styles.sbPolaroidSubCaption}>Daniel nahan nangis pas ombaknya kena sepatu 🌊🤍</Text>
                  </View>
                  <View style={styles.sbPassportBadge}>
                    <Text style={styles.sbPassportBadgeText}>PASSPORT LOVED</Text>
                  </View>
                </View>
              </View>

              {/* Kolase Photobooth Strip & Catatan Sasa */}
              <View style={styles.sbCollageRow}>
                {/* Photobooth strip */}
                <View style={styles.sbPhotostripCard}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=300&q=80',
                    }}
                    style={styles.sbPhotostripImg}
                  />
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80',
                    }}
                    style={styles.sbPhotostripImg}
                  />
                  <Text style={styles.sbPhotostripLabel}>BLOK M • 2024</Text>
                </View>

                {/* Notes & Ticket Column */}
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  {/* Catatan Sasa */}
                  <View style={styles.sbLoveNoteCard}>
                    <Text style={styles.sbLoveNoteHeader}>❤️ CATATAN SASA</Text>
                    <Text style={styles.sbLoveNoteBody}>
                      "Kalo diinget-inget, es krim kelapa di pinggir jalan rasanya jadi 10× lebih enak karena makannya sepiring berdua."
                    </Text>
                    <Text style={styles.sbLoveNoteAuthor}>— Sasa, 23:15</Text>
                  </View>

                  {/* Tiket Memori */}
                  <View style={styles.sbTicketCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.sbTicketHeader}>✈️ TIKET MEMORI</Text>
                      <Text style={styles.sbTicketFlight}>GA-402</Text>
                    </View>
                    <Text style={styles.sbTicketRoute}>CGK ✈ DPS</Text>
                    <Text style={styles.sbTicketSeat}>Seat 14A & 14B • SAVED</Text>
                  </View>
                </View>
              </View>

              {/* Voice Memo Bar */}
              <View style={styles.sbVoiceMemoCard}>
                <TouchableOpacity
                  style={styles.sbVoicePlayBtn}
                  onPress={() => setIsPlayingVoice(!isPlayingVoice)}
                  activeOpacity={0.8}>
                  <Ionicons name={isPlayingVoice ? 'pause' : 'play'} size={16} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sbVoiceTitle}>Suara Tawa Sasa di Pantai 🏖️</Text>
                  <Text style={styles.sbVoiceDuration}>{isPlayingVoice ? 'Memutar...' : '0:42'} • Format Memo Suara</Text>
                </View>

                <View style={styles.sbVoiceApprovedBadge}>
                  <Text style={styles.sbVoiceApprovedText}>APPROVED BY LOVE</Text>
                </View>
              </View>
            </View>

            {/* Koleksi Stiker Lucu */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.sbSectionTitle}>✨ Koleksi Stiker Lucu</Text>
                <Text style={styles.sbSectionLink}>Lihat Semua (42)</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                <TouchableOpacity
                  style={styles.sbStickerPill}
                  onPress={() => setStatusMessage('Stiker ditempel!')}>
                  <Text style={{ fontSize: 20 }}>💌</Text>
                  <View>
                    <Text style={styles.sbStickerName}>Surat Cinta</Text>
                    <Text style={styles.sbStickerSub}>Tap to stick</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sbStickerPill}
                  onPress={() => setStatusMessage('Stiker ditempel!')}>
                  <Text style={{ fontSize: 20 }}>🌺</Text>
                  <View>
                    <Text style={styles.sbStickerName}>Kamboja Bali</Text>
                    <Text style={styles.sbStickerSub}>Estetik</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sbStickerPill}
                  onPress={() => setStatusMessage('Stiker ditempel!')}>
                  <Text style={{ fontSize: 20 }}>☕</Text>
                  <View>
                    <Text style={styles.sbStickerName}>Kopi Sore</Text>
                    <Text style={styles.sbStickerSub}>Favorit Sasa</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Bab Cerita Kita */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View>
                  <Text style={styles.sbSectionTitle}>Bab Cerita Kita</Text>
                  <Text style={styles.sbSectionSub}>Koleksi perjalanan cinta yang diarsipkan rapi</Text>
                </View>
                <TouchableOpacity
                  style={styles.sbAddChapterBtn}
                  onPress={() => setShowCreateAlbumModal(true)}>
                  <Plus size={16} color="#F43F5E" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 10 }}>
                {/* Bab 1 */}
                <View style={styles.sbChapterCard}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=120&q=80',
                    }}
                    style={styles.sbChapterThumb}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={styles.sbChapterBadgeGray}>
                        <Text style={styles.sbChapterBadgeTextGray}>BAB 1</Text>
                      </View>
                      <Text style={styles.sbChapterPeriod}>Feb – Apr 2023</Text>
                    </View>
                    <Text style={styles.sbChapterTitle}>Awal Mula Cerita Kita</Text>
                    <Text style={styles.sbChapterNote}>14 Momen • Kencan pertama, canggung tapi gemas</Text>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" />
                </View>

                {/* Bab 2 (SEDANG DIBUKA) */}
                <View style={[styles.sbChapterCard, styles.sbChapterCardActive]}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=120&q=80',
                    }}
                    style={styles.sbChapterThumb}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={styles.sbChapterBadgeRose}>
                        <Text style={styles.sbChapterBadgeTextRose}>SEDANG DIBUKA</Text>
                      </View>
                      <Text style={styles.sbChapterPeriod}>Jan – Mar 2024</Text>
                    </View>
                    <Text style={styles.sbChapterTitle}>Petualangan Liburan Berdua</Text>
                    <Text style={styles.sbChapterNote}>28 Momen • Sunset Bali, koper kembar, & kulineran</Text>
                  </View>
                  <BookOpen size={16} color="#E11D48" />
                </View>

                {/* Bab 3 */}
                <View style={styles.sbChapterCard}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=120&q=80',
                    }}
                    style={styles.sbChapterThumb}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={styles.sbChapterBadgeGray}>
                        <Text style={styles.sbChapterBadgeTextGray}>BAB 3</Text>
                      </View>
                      <Text style={styles.sbChapterPeriod}>Apr – Sekarang</Text>
                    </View>
                    <Text style={styles.sbChapterTitle}>Kencan Kuliner & Malam Romantis</Text>
                    <Text style={styles.sbChapterNote}>19 Momen • Hunting resto enak & ngobrol berjam-jam</Text>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" />
                </View>
              </View>
            </View>

            {/* Banner Cetak Buku Foto Fisik */}
            <View style={styles.sbPrintBanner}>
              <View style={styles.sbPrintIconCircle}>
                <Ionicons name="print-outline" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sbPrintTitle}>Cetak Buku Foto Fisik OURS</Text>
                <Text style={styles.sbPrintSub}>Album hardcover premium diantar langsung ke rumahmu.</Text>
                <Text style={styles.sbPrintLink}>Lihat Preview Cetak &gt; Mulai Rp 149.000</Text>
              </View>
            </View>
          </ScrollView>

          {/* Floating Bottom Action Bar */}
          <View style={styles.sbBottomActionBar}>
            <TouchableOpacity
              style={styles.sbBottomPrimaryBtn}
              onPress={() => setShowAddMemoryModal(true)}
              activeOpacity={0.88}>
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.sbBottomPrimaryText}>+ Tempel Foto / Catatan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sbBottomIconBtn, isScrapbookLoved && styles.sbBottomIconBtnActive]}
              onPress={() => setIsScrapbookLoved(!isScrapbookLoved)}>
              <Ionicons
                name={isScrapbookLoved ? 'heart' : 'heart-outline'}
                size={20}
                color={isScrapbookLoved ? '#E11D48' : '#64748B'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sbBottomIconBtn}
              onPress={() => setStatusMessage('Tautan Scrapbook siap dibagikan')}>
              <Ionicons name="share-social-outline" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>
      ) : viewMode === 'memory-map' ? (
        /* ================= MEMORY MAP ================= */
        <View style={styles.mapContainer}>
          <View style={styles.mapCanvas}>
            <View style={styles.mapGridLines} />
            <View style={styles.mapAreaTag}>
              <Ionicons name="location-sharp" size={13} color="#2563EB" />
              <Text style={styles.mapAreaTagText}>
                {memoryMap ? `${memoryMap.totalPins} Titik Kenangan Terpetakan` : 'Peta Kenangan Berdua'}
              </Text>
            </View>

            {memories.map((mem, idx) => {
              const isSelected = selectedMapMemory?.id === mem.id;
              const topPos = 25 + ((idx * 28) % 50) + '%';
              const leftPos = 20 + ((idx * 34) % 60) + '%';
              const imgUrl =
                (mem as any).mediaAssets?.[0]?.url ||
                (mem as any).coverUrl ||
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80';

              return (
                <TouchableOpacity
                  key={mem.id}
                  style={[
                    styles.memoryPhotoPin,
                    { top: topPos as any, left: leftPos as any },
                    isSelected && styles.memoryPhotoPinSelected,
                  ]}
                  onPress={() => setSelectedMapMemory(mem)}
                  activeOpacity={0.85}>
                  <Image source={{ uri: imgUrl }} style={styles.pinPhotoThumb} />
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedMapMemory && (
            <View style={styles.floatingMemoryCard}>
              <Image
                source={{
                  uri:
                    (selectedMapMemory as any).mediaAssets?.[0]?.url ||
                    (selectedMapMemory as any).coverUrl ||
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80',
                }}
                style={styles.floatingMemoryThumb}
              />
              <View style={styles.floatingMemoryCol}>
                <Text style={styles.floatingMemoryTitle} numberOfLines={1}>
                  {selectedMapMemory.title}
                </Text>
                <Text style={styles.floatingMemoryDate}>
                  {formatTanggal(selectedMapMemory.memoryDate)}
                </Text>
                {selectedMapMemory.description && (
                  <Text style={styles.floatingMemoryLoc} numberOfLines={1}>
                    "{selectedMapMemory.description}"
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.viewMemoryAlbumBtn}
                onPress={() => setViewMode('memories')}>
                <Ionicons name="images-outline" size={18} color={colors.primaryBlue} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : viewMode === 'wishlist' ? (
        /* ================= WISHLIST ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          <View style={styles.wishlistHeaderRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>Daftar Keinginan Pasangan</Text>
              <Text style={styles.sectionHeaderSub}>
                {completedWishCount} dari {totalWishCount} impian tercapai
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addWishBtn}
              onPress={() => setShowAddWishModal(true)}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addWishBtnText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {wishlistItems.length > 0 ? (
            wishlistItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.wishItemCard, item.status === 'COMPLETED' && styles.wishItemCardCompleted]}
                onPress={() => handleToggleWish(item)}
                activeOpacity={0.88}>
                <View style={styles.wishCheckboxCircle}>
                  {item.status === 'COMPLETED' && (
                    <Ionicons name="checkmark" size={14} color="#10B981" />
                  )}
                </View>
                <View style={styles.wishTextCol}>
                  <Text
                    style={[
                      styles.wishItemTitle,
                      item.status === 'COMPLETED' && styles.wishItemTitleCompleted,
                    ]}>
                    {item.title}
                  </Text>
                  <Text style={styles.wishItemCategory}>{item.category || 'Pengalaman'}</Text>
                </View>
                <View style={styles.wishPriorityPill}>
                  <Text style={styles.wishPriorityText}>{item.priority}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="bookmark-outline" size={38} color="#9CA3AF" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>Belum ada wishlist</Text>
              <Text style={styles.emptySub}>
                Catat impian liburan, tempat incaran, atau aktivitas seru berdua.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : viewMode === 'goals' ? (
        /* ================= GOALS ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          <View style={styles.wishlistHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Tujuan Bersama Pasangan</Text>
            <TouchableOpacity
              style={styles.addWishBtn}
              onPress={() => setShowAddGoalModal(true)}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addWishBtnText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {goals.length > 0 ? (
            goals.map((goal) => {
              const progress = goal.progressPercentage;
              return (
                <View key={goal.id} style={styles.financialGoalHeroCard}>
                  <View style={styles.goalHeroHeader}>
                    <Ionicons name="flag-outline" size={22} color={colors.primaryBlue} />
                    <Text style={styles.goalHeroTitle}>{goal.title}</Text>
                  </View>

                  <View style={styles.progressBarTrackLarge}>
                    <View style={[styles.progressBarFillLarge, { width: `${progress}%` }]} />
                  </View>

                  <View style={styles.goalDetailAmountRow}>
                    <Text style={styles.goalDetailCurrent}>
                      {goal.status === 'ACHIEVED' ? 'Tercapai 🎉' : `${progress}% Berjalan`}
                    </Text>
                    {goal.description && (
                      <Text style={styles.goalDetailTarget}>{goal.description}</Text>
                    )}
                  </View>

                  {goal.milestones && goal.milestones.length > 0 ? (
                    <View style={{ marginTop: 14 }}>
                      {goal.milestones.map((m) => (
                        <View key={m.id} style={styles.milestoneItemCard}>
                          <Ionicons
                            name={m.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={18}
                            color={m.completed ? '#10B981' : '#9CA3AF'}
                          />
                          <Text style={styles.milestoneName}>{m.title}</Text>
                          <Text style={m.completed ? styles.milestoneStatusDone : styles.milestoneStatusPending}>
                            {m.completed ? 'Tercapai' : 'Menunggu'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="flag-outline" size={38} color="#9CA3AF" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>Belum ada tujuan bersama</Text>
              <Text style={styles.emptySub}>
                Rencanakan tujuan bersama untuk liburan, impian pernikahan, atau rencana masa depan.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* ================= LOVE LETTERS WITH PAPERCRUMPLECARD ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          <View style={styles.wishlistHeaderRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>Surat & Catatan Manis</Text>
              <Text style={styles.sectionHeaderSub}>Ketuk segel surat untuk membukanya</Text>
            </View>
            <TouchableOpacity
              style={styles.addLetterBtn}
              onPress={() => setShowAddLetterModal(true)}>
              <Ionicons name="heart" size={15} color="#FFFFFF" />
              <Text style={styles.addLetterBtnText}>Tulis Surat</Text>
            </TouchableOpacity>
          </View>

          {letters.length > 0 ? (
            letters.map((letItem) => {
              const isMine = letItem.authorId === user?.id;
              return (
                <View key={letItem.id} style={{ marginBottom: 16 }}>
                  <PaperCrumpleCard
                    title={letItem.title}
                    content={letItem.content}
                    date={formatTanggal(letItem.createdAt)}
                    senderBadge={isMine ? 'SURAT TERKIRIM' : 'SURAT DARI PASANGAN'}
                    senderName={isMine ? 'Kamu (Untuk Pasangan)' : 'Pasanganmu Tersayang ❤️'}
                    subtitle={
                      isMine
                        ? letItem.readAt
                          ? '✓ Sudah dibuka oleh pasangan'
                          : '✉️ Terkirim (Menunggu dibuka pasangan)'
                        : letItem.readAt
                          ? '✓ Sudah dibaca'
                          : '💌 Surat Baru dari Pasanganmu!'
                    }
                    statusText={letItem.readAt ? 'Dibaca' : 'Belum Dibuka'}
                    isSealedInitially={!isMine && !letItem.readAt}
                    onOpen={() => handleOpenLetter(letItem)}
                    onReply={
                      !isMine
                        ? () => {
                            setLetterTitle(`Balasan: ${letItem.title}`);
                            setShowAddLetterModal(true);
                          }
                        : undefined
                    }
                  />
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="mail-outline" size={42} color="#F43F5E" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>Belum Ada Surat Cinta</Text>
              <Text style={styles.emptySub}>
                Tuliskan surat manis pertama untuk dibaca pasanganmu saat rindu.
              </Text>
              <TouchableOpacity
                style={styles.createLetterPrimaryBtn}
                onPress={() => setShowAddLetterModal(true)}>
                <Text style={styles.createLetterPrimaryBtnText}>Tulis Surat Sekarang</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal Tambah Wishlist */}
      <Modal visible={showAddWishModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Tambah Wishlist Pasangan</Text>
              <TouchableOpacity onPress={() => setShowAddWishModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Impian bersama (contoh: Piknik di Hutan Kota)"
              placeholderTextColor="#9CA3AF"
              value={wishTitle}
              onChangeText={setWishTitle}
            />

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleCreateWish}
              activeOpacity={0.88}>
              <Text style={styles.modalSubmitButtonText}>Simpan ke Wishlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah Kenangan dengan Foto */}
      <Modal visible={showAddMemoryModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Abadikan Kenangan</Text>
              <TouchableOpacity onPress={() => setShowAddMemoryModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Photo Selection / Preview */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>
                Foto Kenangan (Galeri / Kamera)
              </Text>
              {newMemPhotoUri ? (
                <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 180, marginBottom: 8, backgroundColor: '#F3F4F6' }}>
                  <Image source={{ uri: newMemPhotoUri }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      borderRadius: 16,
                      padding: 6,
                    }}
                    onPress={() => setNewMemPhotoUri(null)}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                      borderRadius: 12,
                      paddingVertical: 12,
                      gap: 6,
                    }}
                    onPress={() => handlePickImage(setNewMemPhotoUri)}>
                    <ImageIcon size={18} color="#2563EB" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563EB' }}>Pilih Galeri</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#FFF1F2',
                      borderWidth: 1,
                      borderColor: '#FECDD3',
                      borderRadius: 12,
                      paddingVertical: 12,
                      gap: 6,
                    }}
                    onPress={() => handleCaptureImage(setNewMemPhotoUri)}>
                    <Camera size={18} color="#E11D48" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#E11D48' }}>Potret Kamera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Judul Kenangan (contoh: Kencan Senopati)"
              placeholderTextColor="#9CA3AF"
              value={newMemTitle}
              onChangeText={setNewMemTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Catatan Singkat (opsional)"
              placeholderTextColor="#9CA3AF"
              value={newMemNotes}
              onChangeText={setNewMemNotes}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Tanggal (YYYY-MM-DD)"
              placeholderTextColor="#9CA3AF"
              value={newMemDate}
              onChangeText={setNewMemDate}
            />

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleCreateMemory}
              disabled={uploadingMemPhoto}
              activeOpacity={0.88}>
              {uploadingMemPhoto ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.modalSubmitButtonText}>Mengunggah foto & kenangan...</Text>
                </View>
              ) : (
                <Text style={styles.modalSubmitButtonText}>Simpan Kenangan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tulis Surat */}
      <Modal visible={showAddLetterModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Tulis Surat Cinta</Text>
              <TouchableOpacity onPress={() => setShowAddLetterModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Judul Surat (contoh: Untukmu yang selalu ada)"
              placeholderTextColor="#9CA3AF"
              value={letterTitle}
              onChangeText={setLetterTitle}
            />

            <TextInput
              style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Tuliskan ungkapan hatimu yang terdalam..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={letterContent}
              onChangeText={setLetterContent}
            />

            <TouchableOpacity
              style={[styles.modalSubmitButton, { backgroundColor: '#F43F5E' }]}
              onPress={handleSendLetter}
              activeOpacity={0.88}>
              <Text style={styles.modalSubmitButtonText}>Segel & Kirim Surat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah Goal */}
      <Modal visible={showAddGoalModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Tambah Tujuan Bersama</Text>
              <TouchableOpacity onPress={() => setShowAddGoalModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Nama Tujuan (contoh: Liburan ke Bali)"
              placeholderTextColor="#9CA3AF"
              value={goalTitle}
              onChangeText={setGoalTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Target Nominal / Keterangan (opsional)"
              placeholderTextColor="#9CA3AF"
              value={goalTargetAmount}
              onChangeText={setGoalTargetAmount}
            />

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleCreateGoal}
              activeOpacity={0.88}>
              <Text style={styles.modalSubmitButtonText}>Simpan Tujuan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Buat Scrapbook Baru */}
      <Modal visible={showCreateAlbumModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} color="#8B5CF6" />
                <Text style={styles.modalTitle}>Buat Scrapbook Baru</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateAlbumModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Cover photo selection */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>
                Foto Sampul Album (Opsional)
              </Text>
              {newAlbumCoverUri ? (
                <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 160, marginBottom: 8, backgroundColor: '#F3F4F6' }}>
                  <Image source={{ uri: newAlbumCoverUri }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      borderRadius: 16,
                      padding: 6,
                    }}
                    onPress={() => setNewAlbumCoverUri(null)}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F5F3FF',
                    borderWidth: 1,
                    borderColor: '#DDD6FE',
                    borderRadius: 12,
                    paddingVertical: 12,
                    gap: 6,
                  }}
                  onPress={() => handlePickImage(setNewAlbumCoverUri)}>
                  <ImageIcon size={18} color="#8B5CF6" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>Pilih Foto Sampul Galeri</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Judul Scrapbook (misal: Liburan Pertama di Bali)"
              placeholderTextColor="#9CA3AF"
              value={newAlbumTitle}
              onChangeText={setNewAlbumTitle}
            />

            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Deskripsi atau catatan tentang perjalanan ini (opsional)"
              placeholderTextColor="#9CA3AF"
              multiline
              value={newAlbumDesc}
              onChangeText={setNewAlbumDesc}
            />

            <TouchableOpacity
              style={[styles.modalSubmitButton, { backgroundColor: '#8B5CF6' }]}
              onPress={handleCreateAlbum}
              disabled={creatingAlbum}
              activeOpacity={0.88}>
              {creatingAlbum ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.modalSubmitButtonText}>Membuat scrapbook...</Text>
                </View>
              ) : (
                <Text style={styles.modalSubmitButtonText}>Simpan & Buka Scrapbook</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah Kenangan ke Scrapbook */}
      <Modal visible={showAddMemToAlbumModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Pilih Kenangan</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  Tambahkan momen indah ke "{selectedAlbum?.title}"
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddMemToAlbumModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {memories.length > 0 ? (
                memories.map((mem) => {
                  const alreadyInAlbum = selectedAlbum?.memories?.some((am) => am.id === mem.id);
                  const thumb =
                    mem.media?.[0]?.mediaAsset?.secureUrl ||
                    (mem as any).mediaAssets?.[0]?.url ||
                    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=200&q=80';

                  return (
                    <View
                      key={mem.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 10,
                        backgroundColor: '#F9FAFB',
                        borderRadius: 14,
                        marginBottom: 10,
                        gap: 12,
                      }}>
                      <Image source={{ uri: thumb }} style={{ width: 50, height: 50, borderRadius: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }}>{mem.title}</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>{formatTanggal(mem.memoryDate)}</Text>
                      </View>
                      <TouchableOpacity
                        style={{
                          backgroundColor: alreadyInAlbum ? '#E5E7EB' : '#8B5CF6',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                        }}
                        disabled={alreadyInAlbum || addingMemToAlbum}
                        onPress={() => handleAddMemoryToAlbum(mem.id)}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: alreadyInAlbum ? '#9CA3AF' : '#FFFFFF' }}>
                          {alreadyInAlbum ? 'Sudah Ada' : '+ Tambah'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Belum ada kenangan yang dibuat.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Baca Surat Cinta Romantis */}
      <Modal visible={!!readingLetter} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: '#FFFDF9', borderColor: '#EFE8DE', borderWidth: 1 }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Mail size={18} color="#B91C1C" />
                <Text style={[styles.modalTitle, { color: '#78350F' }]}>Surat Cinta Romantis</Text>
              </View>
              <TouchableOpacity onPress={() => setReadingLetter(null)}>
                <Ionicons name="close" size={22} color="#78350F" />
              </TouchableOpacity>
            </View>

            {readingLetter && (
              <ScrollView style={{ maxHeight: 380, marginVertical: 8 }}>
                <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '700', marginBottom: 4 }}>
                  {formatTanggal(readingLetter.createdAt)}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#78350F', marginBottom: 12 }}>
                  {readingLetter.title}
                </Text>
                <View style={{ height: 1, backgroundColor: '#FDE68A', marginBottom: 12 }} />
                <Text style={{ fontSize: 15, lineHeight: 24, color: '#451A03', fontStyle: 'italic' }}>
                  {readingLetter.content}
                </Text>
                <View style={{ height: 1, backgroundColor: '#FDE68A', marginTop: 16, marginBottom: 12 }} />
                <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '700', textAlign: 'right' }}>
                  {readingLetter.authorId === user?.id ? 'Dari: Kamu (Untuk Pasangan)' : 'Dari: Pasanganmu Tersayang ❤️'}
                </Text>
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              {readingLetter?.authorId !== user?.id && (
                <TouchableOpacity
                  style={[styles.modalSubmitButton, { flex: 1, backgroundColor: '#F43F5E' }]}
                  onPress={() => {
                    const replyTitle = `Balasan: ${readingLetter?.title || ''}`;
                    setReadingLetter(null);
                    setLetterTitle(replyTitle);
                    setShowAddLetterModal(true);
                  }}>
                  <Text style={styles.modalSubmitButtonText}>Balas Surat 💌</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalSubmitButton, { flex: 1, backgroundColor: '#78350F' }]}
                onPress={() => setReadingLetter(null)}>
                <Text style={styles.modalSubmitButtonText}>Tutup Surat</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
  },
  headerRightBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
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
  },
  statusToastText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  profileTextCol: {
    flex: 1,
  },
  profileNames: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  profileTogetherText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  menuListSection: {
    gap: 12,
    marginBottom: 20,
  },
  menuItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  menuSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  financialGoalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  goalCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  goalCardSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalPercentBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryBlue,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primaryBlue,
  },
  goalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalAmountCurrent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  settingsRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  galleryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  sectionHeaderSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F43F5E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addSmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyGalleryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 16,
  },
  addMemoryPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F43F5E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addMemoryPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapContainer: {
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
  mapAreaTag: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  mapAreaTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  memoryPhotoPin: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  memoryPhotoPinSelected: {
    borderColor: '#F43F5E',
    borderWidth: 3.5,
    transform: [{ scale: 1.15 }],
  },
  pinPhotoThumb: {
    width: '100%',
    height: '100%',
  },
  floatingMemoryCard: {
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
  floatingMemoryThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  floatingMemoryCol: {
    flex: 1,
  },
  floatingMemoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  floatingMemoryDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  floatingMemoryLoc: {
    fontSize: 11,
    color: colors.primaryBlue,
    fontWeight: '600',
    marginTop: 2,
  },
  viewMemoryAlbumBtn: {
    padding: 8,
  },
  wishlistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addWishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addWishBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wishItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  wishItemCardCompleted: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  wishCheckboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  wishTextCol: {
    flex: 1,
  },
  wishItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  wishItemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  wishItemCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  wishPriorityPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wishPriorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  financialGoalHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  goalHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  goalHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  progressBarTrackLarge: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EFF6FF',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFillLarge: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.primaryBlue,
  },
  goalDetailAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalDetailCurrent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  goalDetailTarget: {
    fontSize: 12,
    color: '#6B7280',
  },
  milestoneItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 6,
    gap: 10,
  },
  milestoneName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  milestoneStatusDone: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  milestoneStatusPending: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  addLetterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F43F5E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addLetterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createLetterPrimaryBtn: {
    backgroundColor: '#F43F5E',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  createLetterPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 12,
  },
  modalSubmitButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Album & Scrapbook Styles
  albumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  albumCoverImage: {
    width: '100%',
    height: 190,
    resizeMode: 'cover',
    backgroundColor: '#F3F4F6',
  },
  albumCardContent: {
    padding: 16,
  },
  albumTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  albumCountBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  albumCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  albumDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginTop: 6,
  },
  albumFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  albumDateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  albumMemoryItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  albumMemoryImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
    backgroundColor: '#F3F4F6',
  },
  albumMemoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  albumMemoryDate: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 2,
  },
  albumMemoryDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 6,
  },

  // Scrapbook Styles (Matching Image 4: Layar Scrapbook Romantis)
  sbTopBar: {
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sbBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sbHeartCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sbTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sbTabSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 14,
  },
  sbTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 11,
  },
  sbTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  sbTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  sbTabTextActive: {
    color: '#E11D48',
  },
  sbScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 120,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  sbPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  sbPagePill: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sbPagePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE123C',
  },
  sbLastEditedText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  sbPageNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sbCanvasCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  sbLocationPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  sbLocationPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  sbCanvasHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  sbCanvasDateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  sbPolaroidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    transform: [{ rotate: '-1deg' }],
  },
  sbPolaroidImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  sbPolaroidImg: {
    width: '100%',
    height: '100%',
  },
  sbPolaroidTagBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sbPolaroidTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sbPolaroidCaption: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  sbPolaroidSubCaption: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  sbPassportBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
    transform: [{ rotate: '-3deg' }],
  },
  sbPassportBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#E11D48',
  },
  sbCollageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sbPhotostripCard: {
    width: '42%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sbPhotostripImg: {
    width: '100%',
    height: 96,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F1F5F9',
  },
  sbPhotostripLabel: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  sbLoveNoteCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  sbLoveNoteHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BE123C',
    marginBottom: 4,
  },
  sbLoveNoteBody: {
    fontSize: 11,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  sbLoveNoteAuthor: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 6,
  },
  sbTicketCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    marginTop: 8,
  },
  sbTicketHeader: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2563EB',
  },
  sbTicketFlight: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  sbTicketRoute: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  sbTicketSeat: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  sbVoiceMemoCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sbVoicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sbVoiceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  sbVoiceDuration: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  sbVoiceApprovedBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sbVoiceApprovedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E11D48',
  },
  sbSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  sbSectionLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  sbSectionSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  sbStickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sbStickerName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  sbStickerSub: {
    fontSize: 9,
    color: '#64748B',
  },
  sbAddChapterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sbChapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sbChapterCardActive: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFFBFB',
  },
  sbChapterThumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  sbChapterBadgeGray: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sbChapterBadgeTextGray: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  sbChapterBadgeRose: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sbChapterBadgeTextRose: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sbChapterPeriod: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  sbChapterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  sbChapterNote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  sbPrintBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 20,
  },
  sbPrintIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sbPrintTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  sbPrintSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  sbPrintLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 4,
  },
  sbBottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sbBottomPrimaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sbBottomPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sbBottomIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sbBottomIconBtnActive: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FECDD3',
  },
});
