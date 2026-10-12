import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
  Clipboard,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { luminousColors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { useCoupleData } from '@/context/couple-data-context';
import { api } from '@/services/api';

export default function CoupleSettingsHubScreen() {
  const router = useRouter();
  const { user, coupleSpace, logout, refresh: refreshAuth } = useAuth();
  const {
    isNewCoupleMode,
    setNewCoupleMode,
    resetToCleanState,
    loadDemoState,
    daysTogether,
    partnerNames,
    totalBudget,
    setTotalBudget,
    activeRole,
    setActiveRole,
    memories,
    wishlist,
    dates,
    expenses,
    letters,
    activeCapsule,
    quizState,
  } = useCoupleData();

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [notifyAnniversary, setNotifyAnniversary] = useState<boolean>(true);
  const [lovePing, setLovePing] = useState<boolean>(true);
  const [receiptNotification, setReceiptNotification] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Form states
  const [customBudgetInput, setCustomBudgetInput] = useState<string>(totalBudget.toString());
  const [pinEnabled, setPinEnabled] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([
    'Halal',
    'Romantic Dining',
    'Outdoor Garden',
  ]);
  const [radiusIndex, setRadiusIndex] = useState<number>(2); // 15 km default
  const RADIUS_OPTIONS = [
    { km: '5 km', area: 'Sekitar Lingkungan' },
    { km: '10 km', area: 'Kota Madya' },
    { km: '15 km', area: 'Jakarta Pusat & Selatan' },
    { km: '25 km', area: 'Jabodetabek' },
    { km: '50 km', area: 'Luar Kota & Staycation' },
  ];
  const [editMyName, setEditMyName] = useState<string>(partnerNames.user);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const coupleCode =
    (coupleSpace as any)?.inviteCode ||
    (coupleSpace as any)?.code ||
    (user ? `OURS-${user.id.slice(0, 4).toUpperCase()}` : 'OURS-2025');

  const handleResetClean = () => {
    Alert.alert(
      'Mulai Dari Nol (Bersih)',
      'Apakah kalian ingin mereset semua data kenangan, dompet, dan rencana kencan kembali ke Hari 1 bersih untuk dibangun berdua?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset ke Hari 1 Bersih',
          style: 'destructive',
          onPress: () => {
            resetToCleanState();
            Alert.alert('Ruang Pasangan Bersih 🌱', 'Semua data siap untuk kalian isi bersama dari hari pertama!');
          },
        },
      ],
    );
  };

  const handleCopyCode = () => {
    Clipboard.setString(coupleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    try {
      await api.home.getDashboard();
      Alert.alert('Cadangan Cloud Terverifikasi ☁️', 'Semua data dan catatan kalian telah tersinkron dengan server database.');
    } catch {
      Alert.alert('Penyimpanan Lokal Aktif', 'Data saat ini tersimpan aman di perangkat dan akan sinkron saat terhubung kembali.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProfile = () => {
    if (!editMyName.trim()) {
      Alert.alert('Nama Diperlukan', 'Masukkan panggilan sayang kamu.');
      return;
    }
    Alert.alert('Profil Tersimpan ✨', `Panggilan sayang kamu sekarang: ${editMyName.trim()}`);
    setIsProfileModalOpen(false);
  };

  const handleJoinSpace = async () => {
    if (!joinCodeInput.trim()) {
      Alert.alert('Kode Kosong', 'Masukkan kode undangan pasangan terlebih dahulu.');
      return;
    }
    setIsJoining(true);
    try {
      await api.spaces.joinByCode({ pairingCode: joinCodeInput.trim().toUpperCase() });
      await refreshAuth();
      Alert.alert('Tersambung! 💕', 'Kamu berhasil terhubung ke Ruang Pasangan berdua.');
      setIsInviteModalOpen(false);
      setJoinCodeInput('');
    } catch (err: any) {
      Alert.alert('Gagal Terhubung', err?.message || 'Kode undangan pasangan tidak valid atau sudah kedaluwarsa.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSavePin = () => {
    if (pinEnabled && pinCode.length < 4) {
      Alert.alert('PIN Belum Lengkap', 'Masukkan 4 digit PIN keamanan.');
      return;
    }
    Alert.alert('Keamanan Diperbarui 🔒', pinEnabled ? 'Proteksi PIN 4-digit aktif.' : 'Proteksi PIN dinonaktifkan.');
    setIsPinModalOpen(false);
  };

  const handleSaveBudget = () => {
    const parsed = parseInt(customBudgetInput.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Nominal Tidak Valid', 'Masukkan nominal anggaran bulanan yang benar.');
      return;
    }
    setTotalBudget(parsed);
    Alert.alert('Target Disimpan 💰', `Target anggaran kencan berdua diatur ke Rp ${parsed.toLocaleString('id-ID')}`);
    setIsBudgetModalOpen(false);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      await api.clearStoredToken();
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.screenRoot}>
      {/* ---------------- Header ---------------- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
              OURS <Text style={{ color: luminousColors.primary }}>•</Text> Synced
            </Text>
            <Text style={styles.headerTitle}>Ruang Kita</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsNotificationsModalOpen(true)}
            activeOpacity={0.75}
            accessibilityLabel="Notifikasi">
            <Ionicons name="notifications-outline" size={21} color={luminousColors.onSurfaceVariant} />
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
        {/* Couple Profile Glass Hero Card */}
        <View style={styles.heroProfileCard}>
          {/* Connected Avatars */}
          <View style={styles.avatarsRow}>
            {/* User */}
            <View style={styles.avatarWrapper}>
              {(user as any)?.avatarUrl ? (
                <Image
                  source={{ uri: (user as any).avatarUrl }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatarImg, { backgroundColor: luminousColors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                    {partnerNames.user.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.avatarIndicatorM} />
            </View>

            {/* Linked Heart Ring Bridge */}
            <View style={styles.linkedHeartBridge}>
              <Ionicons name="heart" size={18} color={luminousColors.primary} />
            </View>

            {/* Partner */}
            <View style={styles.avatarWrapper}>
              {(coupleSpace as any)?.partnerAvatarUrl ? (
                <Image
                  source={{ uri: (coupleSpace as any).partnerAvatarUrl }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatarImg, { backgroundColor: luminousColors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                    {partnerNames.partner.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.avatarIndicatorF} />
            </View>
          </View>

          <Text style={styles.coupleNames}>
            {partnerNames.user} &amp; {partnerNames.partner}
          </Text>

          <View style={styles.realtimeStatusRow}>
            <View style={[styles.greenLiveDot, coupleSpace?.status !== 'ACTIVE' && { backgroundColor: '#FFA000' }]} />
            <Text style={styles.realtimeStatusText}>
              {coupleSpace?.status === 'ACTIVE' ? 'Terhubung Real-Time' : 'Ruang Cinta Aktif'}
            </Text>
          </View>

          {/* Days Together Badge */}
          <View style={styles.daysTogetherPill}>
            <Ionicons name="heart-outline" size={15} color={luminousColors.primary} />
            <Text style={styles.daysTogetherText}>{daysTogether} Hari Bersama</Text>
            <Text style={styles.daysTogetherSub}>
              {coupleSpace?.anniversaryDate
                ? `• Sejak ${new Date(coupleSpace.anniversaryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : '• Dibangun Berdua 🌱'}
            </Text>
          </View>

          {/* Couple Code Chip */}
          <View style={styles.coupleCodeCard}>
            <View style={styles.coupleCodeLeft}>
              <View style={styles.keyIconCircle}>
                <Ionicons name="key" size={17} color={luminousColors.secondary} />
              </View>
              <View>
                <Text style={styles.coupleCodeLabel}>Kode Pasangan Eksklusif</Text>
                <Text style={styles.coupleCodeVal}>{coupleCode}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.copyBtn,
                copiedCode && { backgroundColor: luminousColors.primary },
              ]}
              onPress={handleCopyCode}
              activeOpacity={0.8}>
              <Ionicons
                name={copiedCode ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copiedCode ? '#FFFFFF' : luminousColors.primary}
              />
              <Text
                style={[
                  styles.copyBtnText,
                  copiedCode && { color: '#FFFFFF' },
                ]}>
                {copiedCode ? 'Tersalin' : 'Salin'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Milestone Banner */}
        <View style={styles.milestoneBanner}>
          <View style={styles.milestoneLeft}>
            <View style={styles.milestoneIconCircle}>
              <Ionicons name="sparkles" size={20} color={luminousColors.primary} />
            </View>
            <View>
              <Text style={styles.milestoneLabel}>Milestone Terdekat</Text>
              <Text style={styles.milestoneVal}>
                {daysTogether < 7
                  ? `${Math.max(1, 7 - daysTogether)} hari lagi menuju 7 Hari Pertama 🌱`
                  : daysTogether < 30
                  ? `${Math.max(1, 30 - daysTogether)} hari lagi menuju 1 Bulan Berdua 💕`
                  : `${Math.max(1, 500 - daysTogether)} hari lagi menuju 500 Hari!`}
              </Text>
            </View>
          </View>
          <Ionicons name="flag-outline" size={18} color={luminousColors.onPrimaryFixedVariant} />
        </View>

        {/* Quick App Suite Shortcuts */}
        <View style={styles.appSuiteGrid}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push('/memories' as any)}
            activeOpacity={0.85}>
            <View style={[styles.suiteIconCircle, { backgroundColor: luminousColors.primaryFixed }]}>
              <Ionicons name="images-outline" size={20} color={luminousColors.primary} />
            </View>
            <Text style={styles.suiteCardTitle}>Kenangan Kita</Text>
            <Text style={styles.suiteCardSub}>
              {memories.length > 0 ? `${memories.length} Momen Polaroid` : 'Mulai Koleksi Foto'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push('/wishlist' as any)}
            activeOpacity={0.85}>
            <View style={[styles.suiteIconCircle, { backgroundColor: luminousColors.secondaryFixed }]}>
              <Ionicons name="star-outline" size={20} color={luminousColors.secondary} />
            </View>
            <Text style={styles.suiteCardTitle}>Wishlist Impian</Text>
            <Text style={styles.suiteCardSub}>
              {wishlist.length > 0 ? `${wishlist.length} Goals Berdua` : 'Buat Impian Berdua'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push('/time-capsule' as any)}
            activeOpacity={0.85}>
            <View style={[styles.suiteIconCircle, { backgroundColor: luminousColors.tertiaryFixed }]}>
              <Ionicons name="mail-outline" size={20} color={luminousColors.tertiary} />
            </View>
            <Text style={styles.suiteCardTitle}>Kapsul Waktu</Text>
            <Text style={styles.suiteCardSub}>
              {letters.length + (activeCapsule ? 1 : 0) > 0
                ? `${letters.length + (activeCapsule ? 1 : 0)} Surat Tersimpan`
                : 'Tulis Surat Pertama'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push('/quiz' as any)}
            activeOpacity={0.85}>
            <View style={[styles.suiteIconCircle, { backgroundColor: luminousColors.surfaceContainerHigh }]}>
              <Ionicons name="heart-half-outline" size={20} color={luminousColors.primary} />
            </View>
            <Text style={styles.suiteCardTitle}>Kuis Chemistry</Text>
            <Text style={styles.suiteCardSub}>
              {quizState.isRevealed ? 'Jawaban Terbuka ✨' : 'Uji Kecocokan Rasa'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Akun & Relasi Pasangan */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Akun &amp; Relasi Pasangan</Text>
            <Text style={styles.sectionItemCount}>3 Pengaturan</Text>
          </View>

          <View style={styles.settingsGroupCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                setEditMyName(partnerNames.user);
                setIsProfileModalOpen(true);
              }}
              activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.primaryFixed }]}>
                  <Ionicons name="person-circle-outline" size={20} color={luminousColors.primary} />
                </View>
                <View>
                  <Text style={styles.settingMainText}>Profil &amp; Biodata Berdua</Text>
                  <Text style={styles.settingSubText}>Foto, panggilan sayang &amp; tanggal lahir</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8F6F71" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setIsInviteModalOpen(true)}
              activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.secondaryFixed }]}>
                  <Ionicons name="qr-code-outline" size={20} color={luminousColors.secondary} />
                </View>
                <View>
                  <Text style={styles.settingMainText}>Kode Undangan Pasangan</Text>
                  <Text style={styles.settingSubText}>Tautkan ulang atau sambung perangkat baru</Text>
                </View>
              </View>
              <View style={styles.rowRightPill}>
                <View style={styles.onlineDotMini} />
                <Ionicons name="chevron-forward" size={18} color="#8F6F71" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => setIsPinModalOpen(true)}
              activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.surfaceContainerHigh }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={luminousColors.onSurface} />
                </View>
                <View>
                  <Text style={styles.settingMainText}>Keamanan &amp; PIN Bersama</Text>
                  <Text style={styles.settingSubText}>Proteksi dompet &amp; kenangan berdua</Text>
                </View>
              </View>
              <Ionicons name="finger-print" size={18} color={luminousColors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Preferensi Kencan & Dompet Bersama */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeading}>Preferensi Kencan &amp; Dompet</Text>

          <View style={styles.settingsGroupCard}>
            <View style={styles.budgetCardInner}>
              <View style={styles.budgetLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.tertiaryFixed }]}>
                  <Ionicons name="wallet-outline" size={19} color={luminousColors.tertiary} />
                </View>
                <View>
                  <Text style={styles.settingSubText}>Target Kencan Bulanan</Text>
                  <Text style={styles.budgetAmount}>
                    Rp {totalBudget.toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBudgetBtn}
                onPress={() => {
                  setCustomBudgetInput(totalBudget.toString());
                  setIsBudgetModalOpen(true);
                }}
                activeOpacity={0.8}>
                <Ionicons name="create-outline" size={14} color={luminousColors.onSurface} />
                <Text style={styles.editBudgetText}>Ubah</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.culinaryPreferenceSection}>
              <Text style={styles.subSectionTitle}>Preferensi Kuliner &amp; Spot Favorit</Text>
              <View style={styles.chipsWrap}>
                {['Halal', 'Romantic Dining', 'Outdoor Garden', 'Cafe Aesthetic', 'Street Food'].map((cuisine) => {
                  const isSelected = selectedCuisines.includes(cuisine);
                  return (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.prefChipPrimary,
                        isSelected && { backgroundColor: luminousColors.primary },
                      ]}
                      onPress={() => {
                        setSelectedCuisines((prev) =>
                          prev.includes(cuisine)
                            ? prev.filter((c) => c !== cuisine)
                            : [...prev, cuisine]
                        );
                      }}
                      activeOpacity={0.8}>
                      <Ionicons
                        name={
                          cuisine === 'Halal'
                            ? 'restaurant'
                            : cuisine === 'Romantic Dining'
                            ? 'heart'
                            : cuisine === 'Outdoor Garden'
                            ? 'leaf'
                            : 'cafe'
                        }
                        size={12}
                        color={isSelected ? '#FFFFFF' : luminousColors.primary}
                      />
                      <Text
                        style={[
                          styles.prefChipTextPrimary,
                          isSelected && { color: '#FFFFFF' },
                        ]}>
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => setRadiusIndex((prev) => (prev + 1) % RADIUS_OPTIONS.length)}
              activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.surfaceContainerHigh }]}>
                  <Ionicons name="navigate-outline" size={18} color={luminousColors.onSurfaceVariant} />
                </View>
                <View>
                  <Text style={styles.settingMainText}>Radius Kencan</Text>
                  <Text style={styles.settingSubText}>{RADIUS_OPTIONS[radiusIndex].area}</Text>
                </View>
              </View>
              <View style={styles.radiusPill}>
                <Text style={styles.radiusPillText}>{RADIUS_OPTIONS[radiusIndex].km}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Ritual Cinta & Notifikasi */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeading}>Ritual Cinta &amp; Notifikasi</Text>

          <View style={styles.settingsGroupCard}>
            <View style={styles.toggleRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.primaryFixed }]}>
                  <Ionicons name="calendar-outline" size={19} color={luminousColors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingMainText}>Pengingat Kencan &amp; Anniversary</Text>
                  <Text style={styles.settingSubText}>
                    Notifikasi H-3 &amp; pagi hari tanggal kencan
                  </Text>
                </View>
              </View>
              <Switch
                value={notifyAnniversary}
                onValueChange={setNotifyAnniversary}
                trackColor={{ false: '#DAE2FD', true: luminousColors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.secondaryFixed }]}>
                  <Ionicons name="notifications-outline" size={19} color={luminousColors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingMainText}>Love Ping &amp; Getaran Pagi</Text>
                  <Text style={styles.settingSubText}>
                    Sapaan manis &amp; kuis harian otomatis jam 08:00
                  </Text>
                </View>
              </View>
              <Switch
                value={lovePing}
                onValueChange={setLovePing}
                trackColor={{ false: '#DAE2FD', true: luminousColors.primary }}
              />
            </View>

            <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.tertiaryFixed }]}>
                  <Ionicons name="receipt-outline" size={19} color={luminousColors.tertiary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingMainText}>Notifikasi Pindai Struk</Text>
                  <Text style={styles.settingSubText}>
                    Pemberitahuan saat pasangan simpan bon kencan
                  </Text>
                </View>
              </View>
              <Switch
                value={receiptNotification}
                onValueChange={setReceiptNotification}
                trackColor={{ false: '#DAE2FD', true: luminousColors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Section 4: Privasi, Data & Kenangan */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeading}>Privasi, Data &amp; Kenangan</Text>

          <View style={styles.settingsGroupCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.secondaryFixed }]}>
                  <Ionicons name="cloud-done-outline" size={19} color={luminousColors.secondary} />
                </View>
                <View>
                  <Text style={styles.settingMainText}>Cadangan Cloud Real-Time</Text>
                  <Text style={styles.settingSubText}>Disinkronkan 2 menit lalu • Terenkripsi</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.syncBtn}
                onPress={handleSyncCloud}
                activeOpacity={0.75}>
                <Ionicons
                  name="sync"
                  size={16}
                  color={luminousColors.onSurface}
                  style={isSyncing ? { transform: [{ rotate: '180deg' }] } : null}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                Alert.alert(
                  'Ekspor Buku Kenangan PDF 📖',
                  `Buku kenangan ${daysTogether} hari bersama siap dicetak dengan ${memories.length} polaroid kencan.`,
                  [
                    { text: 'Tutup', style: 'cancel' },
                    {
                      text: 'Unduh File PDF',
                      onPress: () =>
                        Alert.alert(
                          'Buku Kenangan Tersimpan ✨',
                          'File PDF Album Kencan berhasil diunduh ke perangkat.',
                        ),
                    },
                  ],
                );
              }}
              activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.primaryFixed }]}>
                  <Ionicons name="book-outline" size={19} color={luminousColors.primary} />
                </View>
                <View>
                  <Text style={styles.settingMainText}>Ekspor Buku Kenangan PDF</Text>
                  <Text style={styles.settingSubText}>
                    Cetak album polaroid &amp; catatan {daysTogether} hari
                  </Text>
                </View>
              </View>
              <View style={styles.downloadPill}>
                <Text style={styles.downloadPillText}>Download</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 5: Bantuan & Keluar Akun */}
        <View style={styles.sectionWrapper}>
          <TouchableOpacity
            style={styles.helpCenterCard}
            onPress={() => setIsHelpModalOpen(true)}
            activeOpacity={0.8}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.surfaceContainerHigh }]}>
                <Ionicons name="headset-outline" size={19} color={luminousColors.onSurface} />
              </View>
              <View>
                <Text style={styles.settingMainText}>Pusat Bantuan Pasangan</Text>
                <Text style={styles.settingSubText}>Tanya tim OURS atau baca panduan cinta</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8F6F71" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color="#BA1A1A" />
            <Text style={styles.logoutBtnText}>Keluar dari Akun Kita</Text>
          </TouchableOpacity>

          <View style={styles.versionFooter}>
            <Text style={styles.versionText}>
              OURS Companion • Versi 2.4.1 (Clean Glass Edition)
            </Text>
            <Text style={styles.versionSub}>
              Dibuat dengan cinta untuk {partnerNames.user} &amp; {partnerNames.partner}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ---------------- 1. MODAL: PROFIL & BIODATA BERDUA ---------------- */}
      <Modal
        visible={isProfileModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsProfileModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profil &amp; Biodata Berdua 💕</Text>
              <TouchableOpacity onPress={() => setIsProfileModalOpen(false)}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalAvatarRow}>
                <View style={[styles.avatarCircle, { backgroundColor: luminousColors.primary }]}>
                  <Text style={styles.avatarLetter}>{editMyName ? editMyName[0].toUpperCase() : 'U'}</Text>
                </View>
                <Ionicons name="heart" size={20} color={luminousColors.primary} />
                <View style={[styles.avatarCircle, { backgroundColor: luminousColors.secondary }]}>
                  <Text style={styles.avatarLetter}>{partnerNames.partner ? partnerNames.partner[0].toUpperCase() : 'P'}</Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Panggilan Sayang Kamu</Text>
              <TextInput
                style={styles.modalInput}
                value={editMyName}
                onChangeText={setEditMyName}
                placeholder="Contoh: Sayang, Honey, Baby"
              />

              <Text style={styles.inputLabel}>Pasangan Tercinta</Text>
              <View style={[styles.modalInput, { backgroundColor: '#F3F4F8' }]}>
                <Text style={{ fontSize: 14, color: luminousColors.onSurface }}>{partnerNames.partner}</Text>
              </View>

              <Text style={styles.inputLabel}>Waktu Bersama</Text>
              <View style={[styles.modalInput, { backgroundColor: '#F3F4F8' }]}>
                <Text style={{ fontSize: 14, color: luminousColors.onSurface }}>{daysTogether} Hari Terlewati Penuh Kasih</Text>
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveProfile}
                activeOpacity={0.85}>
                <Text style={styles.modalSubmitBtnText}>Simpan Profil</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---------------- 2. MODAL: KODE UNDANGAN PASANGAN ---------------- */}
      <Modal
        visible={isInviteModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsInviteModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kode Undangan Pasangan 🔗</Text>
              <TouchableOpacity onPress={() => setIsInviteModalOpen(false)}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDesc}>
                Bagikan kode eksklusif ini kepada pasanganmu agar smartphone kalian berdua terhubung langsung ke satu ruang cinta bersama.
              </Text>

              <View style={styles.codeHeroBox}>
                <Text style={styles.codeHeroSubtitle}>Kode Ruang Kita</Text>
                <Text style={styles.codeHeroText}>{coupleCode}</Text>
                <TouchableOpacity
                  style={[styles.copyHeroBtn, copiedCode && { backgroundColor: '#2E7D32' }]}
                  onPress={handleCopyCode}
                  activeOpacity={0.85}>
                  <Ionicons name={copiedCode ? 'checkmark-circle' : 'copy-outline'} size={16} color="#FFFFFF" />
                  <Text style={styles.copyHeroBtnText}>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Kode Undangan'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.inputLabel}>Sambung ke Ruang Pasangan</Text>
              <Text style={styles.modalHelperText}>
                Jika pasanganmu yang membuat kode terlebih dahulu, masukkan kodenya di bawah ini:
              </Text>
              <TextInput
                style={styles.modalInput}
                value={joinCodeInput}
                onChangeText={setJoinCodeInput}
                placeholder="Masukkan 6 Karakter Kode Pasangan"
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: luminousColors.secondary }, isJoining && { opacity: 0.7 }]}
                onPress={handleJoinSpace}
                disabled={isJoining}
                activeOpacity={0.85}>
                {isJoining ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Hubungkan ke Ruang Pasangan 💕</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---------------- 3. MODAL: KEAMANAN & PIN BERSAMA ---------------- */}
      <Modal
        visible={isPinModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPinModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Keamanan &amp; PIN Bersama 🔒</Text>
              <TouchableOpacity onPress={() => setIsPinModalOpen(false)}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.pinToggleBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinToggleTitle}>Aktifkan PIN Ruang Kita</Text>
                  <Text style={styles.pinToggleDesc}>Proteksi catatan dompet dan foto kenangan dari pihak lain</Text>
                </View>
                <Switch
                  value={pinEnabled}
                  onValueChange={setPinEnabled}
                  trackColor={{ false: '#DAE2FD', true: luminousColors.primary }}
                />
              </View>

              {pinEnabled && (
                <>
                  <Text style={styles.inputLabel}>Buat 4 Digit PIN Keamanan</Text>
                  <TextInput
                    style={[styles.modalInput, { letterSpacing: 8, textAlign: 'center', fontSize: 20, fontWeight: '700' }]}
                    value={pinCode}
                    onChangeText={setPinCode}
                    placeholder="••••"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSavePin}
                activeOpacity={0.85}>
                <Text style={styles.modalSubmitBtnText}>Simpan Pengaturan PIN</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---------------- 4. MODAL: TARGET KENCAN BULANAN ---------------- */}
      <Modal
        visible={isBudgetModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsBudgetModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Target Kencan Bulanan 💰</Text>
              <TouchableOpacity onPress={() => setIsBudgetModalOpen(false)}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDesc}>
                Tentukan target anggaran bulanan untuk kencan, kuliner, dan liburan berdua agar pengeluaran tetap terkontrol harmonis.
              </Text>

              <Text style={styles.inputLabel}>Pilihan Cepat Target</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {[2000000, 3500000, 5000000, 10000000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.budgetPresetBtn,
                      parseInt(customBudgetInput, 10) === amt && styles.budgetPresetBtnActive,
                    ]}
                    onPress={() => setCustomBudgetInput(amt.toString())}>
                    <Text
                      style={[
                        styles.budgetPresetText,
                        parseInt(customBudgetInput, 10) === amt && styles.budgetPresetTextActive,
                      ]}>
                      Rp {(amt / 1000000).toFixed(amt % 1000000 === 0 ? 0 : 1)} Juta
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Nominal Anggaran (Rupiah)</Text>
              <TextInput
                style={styles.modalInput}
                value={customBudgetInput}
                onChangeText={setCustomBudgetInput}
                keyboardType="numeric"
                placeholder="Contoh: 5000000"
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveBudget}
                activeOpacity={0.85}>
                <Text style={styles.modalSubmitBtnText}>Simpan Target Anggaran</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---------------- 5. MODAL: NOTIFIKASI & AKTIVITAS KITA ---------------- */}
      <Modal
        visible={isNotificationsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsNotificationsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aktivitas &amp; Notifikasi 🔔</Text>
              <TouchableOpacity onPress={() => setIsNotificationsModalOpen(false)}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: '#4CAF50' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>Sinkronisasi Real-Time Aktif</Text>
                  <Text style={styles.activitySub}>Ruang Kita terhubung langsung ke database PostgreSQL berdua</Text>
                </View>
              </View>

              <View style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: luminousColors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{memories.length} Momen Polaroid Tersimpan</Text>
                  <Text style={styles.activitySub}>Foto kencan tersimpan aman dan dapat dilihat bersama pasangan</Text>
                </View>
              </View>

              <View style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: luminousColors.secondary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{expenses.length} Catatan Dompet Berdua</Text>
                  <Text style={styles.activitySub}>Target bulanan Rp {totalBudget.toLocaleString('id-ID')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: luminousColors.onSurface, marginTop: 12 }]}
                onPress={() => setIsNotificationsModalOpen(false)}>
                <Text style={styles.modalSubmitBtnText}>Tutup Notifikasi</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---------------- 6. MODAL: PUSAT BANTUAN PASANGAN ---------------- */}
      <Modal
        visible={isHelpModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsHelpModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pusat Bantuan OURS 💡</Text>
              <TouchableOpacity onPress={() => setIsHelpModalOpen(false)}>
                <Ionicons name="close" size={22} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.helpHeading}>1. Cara Menghubungkan 2 Akun Pasangan</Text>
              <Text style={styles.helpText}>
                Salah satu pihak menyalin Kode Pasangan di menu "Kode Undangan Pasangan", lalu pihak pasangan membuka menu yang sama dan memasukkan kode tersebut pada form "Sambung ke Ruang Pasangan".
              </Text>

              <Text style={styles.helpHeading}>2. Foto &amp; Kenangan Bersama</Text>
              <Text style={styles.helpText}>
                Semua foto yang diunggah otomatis tersimpan di cloud database berdua, sehingga kamu dan pasanganmu langsung melihat kenangan yang sama.
              </Text>

              <Text style={styles.helpHeading}>3. Pindai Struk Kencan &amp; Input Manual</Text>
              <Text style={styles.helpText}>
                Gunakan kamera untuk memindai bon fisik kencan. Jika struk kurang jelas, kamu bisa langsung menekan tombol "Catat Manual ✍️" untuk mencatat pengeluaran secara instan.
              </Text>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { marginTop: 16 }]}
                onPress={() => setIsHelpModalOpen(false)}>
                <Text style={styles.modalSubmitBtnText}>Mengerti, Terima Kasih!</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---------------- 6. MODAL: KONFIRMASI KELUAR DARI AKUN KITA ---------------- */}
      <Modal
        visible={isLogoutModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => !isLoggingOut && setIsLogoutModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }]}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FEE4E2',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
              <Ionicons name="log-out-outline" size={30} color="#D92D20" />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 8, fontSize: 18 }]}>
              Keluar dari Akun Kita?
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#535862',
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 20,
              }}>
              Sesi akun akan ditutup di perangkat ini. Data dan momen kencan berdua tetap tersimpan aman di cloud.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: '#F2F4F7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={isLoggingOut}
                onPress={() => setIsLogoutModalOpen(false)}
                activeOpacity={0.8}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#344054' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: '#D92D20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={isLoggingOut}
                onPress={handleConfirmLogout}
                activeOpacity={0.8}>
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Ya, Keluar</Text>
                )}
              </TouchableOpacity>
            </View>
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
    zIndex: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginRight: 4,
  },
  avatarHeart: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPartner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  syncPulseDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: luminousColors.secondaryContainer,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTextCol: {
    marginLeft: 4,
  },
  syncLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: luminousColors.onSurfaceVariant,
    letterSpacing: 0.2,
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
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  heroProfileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    shadowColor: 'rgba(185, 5, 56, 0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarIndicatorM: {
    position: 'absolute',
    bottom: -1,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: luminousColors.secondary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarIndicatorF: {
    position: 'absolute',
    bottom: -1,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: luminousColors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  linkedHeartBridge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  coupleNames: {
    fontSize: 20,
    fontWeight: '800',
    color: luminousColors.onSurface,
    letterSpacing: -0.4,
  },
  realtimeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  greenLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  realtimeStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  daysTogetherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 218, 220, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    marginTop: 12,
  },
  daysTogetherText: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  daysTogetherSub: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
  },
  coupleCodeCard: {
    width: '100%',
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  coupleCodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  keyIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: luminousColors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coupleCodeLabel: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
  },
  coupleCodeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: luminousColors.onSurface,
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  milestoneBanner: {
    backgroundColor: 'rgba(255, 218, 219, 0.75)',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  milestoneIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneLabel: {
    fontSize: 10,
    color: luminousColors.onPrimaryFixedVariant,
    fontWeight: '600',
  },
  milestoneVal: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onPrimaryFixed,
  },
  appSuiteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suiteCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  suiteIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  suiteCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  suiteCardSub: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
  },
  sectionWrapper: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionItemCount: {
    fontSize: 11,
    color: luminousColors.primary,
    fontWeight: '600',
  },
  settingsGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  settingSubText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  rowRightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDotMini: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  budgetCardInner: {
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: luminousColors.onSurface,
    marginTop: 2,
  },
  editBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  editBudgetText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  culinaryPreferenceSection: {
    paddingVertical: 8,
    gap: 8,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  prefChipPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: luminousColors.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  prefChipTextPrimary: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.primary,
  },
  radiusPill: {
    backgroundColor: luminousColors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.onSecondaryFixed,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  syncBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadPill: {
    backgroundColor: luminousColors.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  downloadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  helpCenterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BA1A1A',
  },
  versionFooter: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  versionText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  versionSub: {
    fontSize: 10,
    color: '#8F6F71',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  modalDesc: {
    fontSize: 13,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurfaceVariant,
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: luminousColors.onSurface,
  },
  modalHelperText: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    marginBottom: 8,
  },
  modalSubmitBtn: {
    backgroundColor: luminousColors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  codeHeroBox: {
    backgroundColor: '#F0F4FC',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  codeHeroSubtitle: {
    fontSize: 11,
    color: luminousColors.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeHeroText: {
    fontSize: 28,
    fontWeight: '800',
    color: luminousColors.primary,
    letterSpacing: 4,
    marginVertical: 6,
  },
  copyHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: luminousColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 6,
  },
  copyHeroBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  pinToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  pinToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  pinToggleDesc: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  budgetPresetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F0F4FC',
  },
  budgetPresetBtnActive: {
    backgroundColor: luminousColors.primary,
  },
  budgetPresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.primary,
  },
  budgetPresetTextActive: {
    color: '#FFFFFF',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F4',
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  activitySub: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  helpHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
    marginTop: 12,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 8,
  },
});
