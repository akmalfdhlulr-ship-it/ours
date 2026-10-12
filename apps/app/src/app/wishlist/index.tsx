import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { luminousColors } from '@ours/design-tokens';
import { useCoupleData, SharedWishlistItem } from '../../context/couple-data-context';

export default function WishlistScreen() {
  const router = useRouter();
  const { wishlist, addWishlistItem, addWishlistSavings, partnerNames } = useCoupleData();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showSavingsModal, setShowSavingsModal] = useState<boolean>(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('500000');

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'Liburan' | 'Kuliner' | 'Aktivitas'>('Liburan');
  const [newTarget, setNewTarget] = useState<string>('5000000');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newDeadline, setNewDeadline] = useState<string>('Desember 2025');

  const filteredItems = useMemo(() => {
    return wishlist.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'completed') return item.isCompleted;
      return item.category.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [wishlist, activeFilter]);

  const completionPercent = useMemo(() => {
    if (wishlist.length === 0) return 0;
    const completedCount = wishlist.filter((i) => i.isCompleted).length;
    return Math.round((completedCount / wishlist.length) * 100);
  }, [wishlist]);

  const handleDepositSavings = () => {
    const amount = parseInt(depositAmount, 10);
    if (selectedGoalId && !isNaN(amount) && amount > 0) {
      addWishlistSavings(selectedGoalId, amount);
      setShowSavingsModal(false);
      Alert.alert(
        'Tabungan Ditambahkan! 💰',
        `Berhasil menabung Rp ${amount.toLocaleString('id-ID')} untuk impian ini.`
      );
    }
  };

  const handleSaveWishlist = () => {
    if (!newTitle.trim()) {
      Alert.alert('Judul Wajib Diisi', 'Berikan nama impian kalian berdua.');
      return;
    }
    const targetVal = parseInt(newTarget, 10) || 5000000;

    addWishlistItem({
      title: newTitle.trim(),
      category: newCategory,
      targetAmount: targetVal,
      priority: 'Tinggi',
      location: newLocation.trim() || undefined,
      deadline: newDeadline.trim() || undefined,
      imageUrl: undefined,
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewLocation('');
  };

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
              OURS <Text style={{ color: luminousColors.primary }}>•</Text> Impian
            </Text>
            <Text style={styles.headerTitle}>Wishlist Impian</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.75}
            accessibilityLabel="Tambah Impian">
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
        showsVerticalScrollIndicator={false}>
        {/* Top Progress & Hero Banner */}
        <View style={styles.progressHeroCard}>
          <View style={styles.progressHeaderRow}>
            <View>
              <Text style={styles.progressKicker}>Target Impian Bersama</Text>
              <Text style={styles.progressMainTitle}>
                {wishlist.length === 0
                  ? 'Mulai Daftar Impian Berdua'
                  : `${completionPercent}% Impian Tercapai`}
              </Text>
            </View>
            <View style={styles.progressBadgePill}>
              <Ionicons name="sparkles" size={13} color={luminousColors.primary} />
              <Text style={styles.progressBadgeText}>{wishlist.length} Target</Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
          </View>
        </View>

        {/* Filter Horizontal Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {[
            { id: 'all', label: `Semua (${wishlist.length})` },
            { id: 'Liburan', label: 'Liburan & Trip' },
            { id: 'Kuliner', label: 'Kuliner Impian' },
            { id: 'Aktivitas', label: 'Aktivitas Seru' },
            { id: 'completed', label: 'Tercapai ✓' },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.id)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ---------------- CLEAN EMPTY STATE ---------------- */}
        {wishlist.length === 0 ? (
          <View style={styles.cleanEmptyCard}>
            <View style={styles.cleanEmptyIconBox}>
              <Ionicons name="star-outline" size={44} color={luminousColors.primary} />
            </View>
            <Text style={styles.cleanEmptyTitle}>Mulai Daftar Impian Berdua 💫</Text>
            <Text style={styles.cleanEmptyDesc}>
              Tulis impian liburan, tempat makan favorit, atau goals tabungan yang ingin kalian capai
              bersama dari hari pertama bersama {partnerNames.partner}.
            </Text>

            <TouchableOpacity
              style={styles.cleanEmptyCta}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.88}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.cleanEmptyCtaText}>+ Buat Impian Pertama ✨</Text>
            </TouchableOpacity>

            <View style={styles.cleanEmptyHint}>
              <Ionicons name="heart" size={16} color={luminousColors.primary} />
              <Text style={styles.cleanEmptyHintText}>
                Setiap kali menabung, progress tabungan akan langsung sinkron di kedua ponsel kalian!
              </Text>
            </View>
          </View>
        ) : (
          /* Wishlist Cards Grid */
          <View style={styles.wishlistGrid}>
            {filteredItems.map((item) => {
              const savedPct =
                item.targetAmount > 0
                  ? Math.min(100, Math.round((item.currentSaved / item.targetAmount) * 100))
                  : 0;

              return (
                <View key={item.id} style={styles.wishlistCard}>
                  <View style={styles.cardImageWrapper}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                    ) : (
                      <View
                        style={[
                          styles.cardImage,
                          {
                            backgroundColor:
                              item.category === 'Liburan'
                                ? '#E3E9F8'
                                : item.category === 'Kuliner'
                                ? '#FFE8E8'
                                : '#EDE8F8',
                            justifyContent: 'center',
                            alignItems: 'center',
                          },
                        ]}>
                        <Ionicons
                          name={
                            item.category === 'Liburan'
                              ? 'airplane-outline'
                              : item.category === 'Kuliner'
                              ? 'restaurant-outline'
                              : 'color-palette-outline'
                          }
                          size={40}
                          color={luminousColors.primary}
                        />
                      </View>
                    )}
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{item.category}</Text>
                    </View>
                    {item.isCompleted && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.completedBadgeText}>Tercapai</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.location && (
                      <Text style={styles.cardLocation}>📍 {item.location}</Text>
                    )}

                    {/* Savings Progress Bar */}
                    <View style={styles.savingsSection}>
                      <View style={styles.savingsHeaderRow}>
                        <Text style={styles.savingsLabel}>Terkumpul: {savedPct}%</Text>
                        <Text style={styles.savingsAmounts}>
                          Rp {item.currentSaved.toLocaleString('id-ID')} / Rp{' '}
                          {item.targetAmount.toLocaleString('id-ID')}
                        </Text>
                      </View>
                      <View style={styles.savingsTrack}>
                        <View style={[styles.savingsFill, { width: `${savedPct}%` }]} />
                      </View>
                    </View>

                    {/* Action Row */}
                    {!item.isCompleted && (
                      <TouchableOpacity
                        style={styles.addSavingsBtn}
                        onPress={() => {
                          setSelectedGoalId(item.id);
                          setShowSavingsModal(true);
                        }}
                        activeOpacity={0.8}>
                        <Ionicons name="wallet-outline" size={16} color={luminousColors.primary} />
                        <Text style={styles.addSavingsBtnText}>+ Tambah Tabungan</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Savings Modal */}
      <Modal
        visible={showSavingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSavingsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.savingsModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Tabungan Impian</Text>
              <TouchableOpacity onPress={() => setShowSavingsModal(false)}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Masukkan jumlah uang yang disisihkan berdua untuk impian ini:
            </Text>

            <View style={styles.quickAmountRow}>
              {['250000', '500000', '1000000', '2000000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.quickAmtChip,
                    depositAmount === amt && styles.quickAmtChipActive,
                  ]}
                  onPress={() => setDepositAmount(amt)}>
                  <Text
                    style={[
                      styles.quickAmtText,
                      depositAmount === amt && styles.quickAmtTextActive,
                    ]}>
                    Rp {(parseInt(amt, 10) / 1000).toLocaleString('id-ID')}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalTextInput}
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
              placeholder="Jumlah tabungan (Rp)"
            />

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleDepositSavings}
              activeOpacity={0.88}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.modalPrimaryBtnText}>Simpan Tabungan ✨</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Wishlist Item Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.addItemModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Impian Berdua</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Kategori Impian</Text>
              <View style={styles.categoryPickerRow}>
                {(['Liburan', 'Kuliner', 'Aktivitas'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      newCategory === cat && styles.catChipActive,
                    ]}
                    onPress={() => setNewCategory(cat)}>
                    <Text
                      style={[
                        styles.catChipText,
                        newCategory === cat && styles.catChipTextActive,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Nama Impian *</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Contoh: Trip Musim Gugur di Kyoto"
                placeholderTextColor={luminousColors.outline}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.formLabel}>Target Biaya (Rp)</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Contoh: 15000000"
                placeholderTextColor={luminousColors.outline}
                keyboardType="numeric"
                value={newTarget}
                onChangeText={setNewTarget}
              />

              <Text style={styles.formLabel}>Lokasi / Tempat</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Contoh: Jepang / Bali / Jakarta"
                placeholderTextColor={luminousColors.outline}
                value={newLocation}
                onChangeText={setNewLocation}
              />

              <Text style={styles.formLabel}>Target Waktu</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Contoh: Akhir Tahun 2025"
                placeholderTextColor={luminousColors.outline}
                value={newDeadline}
                onChangeText={setNewDeadline}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleSaveWishlist}
              activeOpacity={0.88}>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.modalPrimaryBtnText}>Simpan Impian Berdua ✨</Text>
            </TouchableOpacity>
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
    gap: 16,
  },
  progressHeroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressKicker: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  progressMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: luminousColors.onSurface,
    marginTop: 2,
  },
  progressBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: luminousColors.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: luminousColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: luminousColors.primary,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  filterChipActive: {
    backgroundColor: luminousColors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cleanEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 26,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  cleanEmptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cleanEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: luminousColors.onSurface,
    textAlign: 'center',
  },
  cleanEmptyDesc: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  cleanEmptyCta: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  cleanEmptyCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cleanEmptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 218, 219, 0.45)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginTop: 6,
  },
  cleanEmptyHintText: {
    flex: 1,
    fontSize: 11,
    color: luminousColors.primary,
    lineHeight: 15,
  },
  wishlistGrid: {
    gap: 16,
  },
  wishlistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImageWrapper: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  cardLocation: {
    fontSize: 11,
    color: luminousColors.secondary,
    fontWeight: '600',
  },
  savingsSection: {
    gap: 4,
    marginTop: 4,
  },
  savingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  savingsAmounts: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
  },
  savingsTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: luminousColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  savingsFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: luminousColors.primary,
  },
  addSavingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: luminousColors.surfaceContainerLow,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 4,
  },
  addSavingsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  savingsModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  addItemModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  modalSubtitle: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 18,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmtChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: luminousColors.surfaceContainerLow,
    alignItems: 'center',
  },
  quickAmtChipActive: {
    backgroundColor: luminousColors.primary,
  },
  quickAmtText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  quickAmtTextActive: {
    color: '#FFFFFF',
  },
  modalTextInput: {
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: luminousColors.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(227, 189, 191, 0.3)',
  },
  modalPrimaryBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
    marginTop: 8,
    marginBottom: 4,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  catChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: luminousColors.surfaceContainerLow,
    alignItems: 'center',
  },
  catChipActive: {
    backgroundColor: luminousColors.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
});
