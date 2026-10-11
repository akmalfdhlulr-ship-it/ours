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

type HubViewMode = 'menu' | 'memories' | 'memory-map' | 'wishlist' | 'goals' | 'letters';

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

  // Modals
  const [showAddWishModal, setShowAddWishModal] = useState(false);
  const [wishTitle, setWishTitle] = useState('');
  const [wishCategory, setWishCategory] = useState('Pengalaman');

  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemNotes, setNewMemNotes] = useState('');
  const [newMemDate, setNewMemDate] = useState(new Date().toISOString().split('T')[0]);

  const [showAddLetterModal, setShowAddLetterModal] = useState(false);
  const [letterTitle, setLetterTitle] = useState('');
  const [letterContent, setLetterContent] = useState('');

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

  const handleCreateMemory = async () => {
    if (!newMemTitle.trim()) return;
    try {
      await api.memories.create({
        title: newMemTitle.trim(),
        memoryDate: newMemDate,
        description: newMemNotes.trim() || undefined,
      });
      setNewMemTitle('');
      setNewMemNotes('');
      setShowAddMemoryModal(false);
      setStatusMessage('Kenangan indah berhasil diabadikan!');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menyimpan kenangan');
    }
  };

  const handleSendLetter = async () => {
    if (!letterTitle.trim() || !letterContent.trim()) return;
    try {
      await api.letters.create({
        title: letterTitle.trim(),
        content: letterContent.trim(),
      });
      setLetterTitle('');
      setLetterContent('');
      setShowAddLetterModal(false);
      setStatusMessage('Surat cinta rahasia berhasil disegel dan dikirim!');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal mengirim surat');
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

  // Convert memories into DriftWallItems
  const driftWallItems: DriftWallItem[] = memories.map((m, idx) => ({
    id: m.id,
    url:
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
              onPress={() => setViewMode('menu')}>
              <Ionicons name="arrow-back" size={20} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {viewMode === 'menu'
              ? 'Ruang Hubungan'
              : viewMode === 'memories'
                ? 'Kenangan Kita'
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

            {/* 2. Peta Kenangan */}
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
            letters.map((letItem) => (
              <View key={letItem.id} style={{ marginBottom: 16 }}>
                <PaperCrumpleCard
                  title={letItem.title}
                  content={letItem.content}
                  date={formatTanggal(letItem.createdAt)}
                  senderName="Pasangan Tersayang"
                  isSealedInitially={true}
                />
              </View>
            ))
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

      {/* Modal Tambah Kenangan */}
      <Modal visible={showAddMemoryModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Abadikan Kenangan</Text>
              <TouchableOpacity onPress={() => setShowAddMemoryModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
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
              activeOpacity={0.88}>
              <Text style={styles.modalSubmitButtonText}>Simpan Kenangan</Text>
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
});
