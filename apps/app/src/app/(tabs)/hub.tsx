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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { luminousColors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { useCoupleData } from '@/context/couple-data-context';
import { api } from '@/services/api';

export default function CoupleSettingsHubScreen() {
  const router = useRouter();
  const { user, coupleSpace, logout } = useAuth();
  const {
    isNewCoupleMode,
    setNewCoupleMode,
    resetToCleanState,
    loadDemoState,
    daysTogether,
    partnerNames,
    totalBudget,
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

  const handleLogout = () => {
    Alert.alert(
      'Keluar dari Akun Kita',
      'Apakah kamu yakin ingin keluar dari sesi aplikasi saat ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
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
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
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

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
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

            <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
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
              <TouchableOpacity style={styles.editBudgetBtn} activeOpacity={0.8}>
                <Ionicons name="create-outline" size={14} color={luminousColors.onSurface} />
                <Text style={styles.editBudgetText}>Ubah</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.culinaryPreferenceSection}>
              <Text style={styles.subSectionTitle}>Preferensi Kuliner &amp; Spot Favorit</Text>
              <View style={styles.chipsWrap}>
                <View style={styles.prefChipPrimary}>
                  <Ionicons name="restaurant" size={12} color={luminousColors.primary} />
                  <Text style={styles.prefChipTextPrimary}>Halal</Text>
                </View>
                <View style={[styles.prefChipPrimary, { backgroundColor: luminousColors.primary }]}>
                  <Ionicons name="heart" size={12} color="#FFFFFF" />
                  <Text style={[styles.prefChipTextPrimary, { color: '#FFFFFF' }]}>
                    Romantic Dining
                  </Text>
                </View>
                <View style={[styles.prefChipPrimary, { backgroundColor: luminousColors.secondaryFixed }]}>
                  <Ionicons name="leaf" size={12} color={luminousColors.secondary} />
                  <Text style={[styles.prefChipTextPrimary, { color: luminousColors.secondary }]}>
                    Outdoor Garden
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconCircle, { backgroundColor: luminousColors.surfaceContainerHigh }]}>
                  <Ionicons name="navigate-outline" size={18} color={luminousColors.onSurfaceVariant} />
                </View>
                <View>
                  <Text style={styles.settingMainText}>Radius Kencan</Text>
                  <Text style={styles.settingSubText}>Jakarta Pusat &amp; Selatan</Text>
                </View>
              </View>
              <View style={styles.radiusPill}>
                <Text style={styles.radiusPillText}>15 km</Text>
              </View>
            </View>
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

            <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
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
          <TouchableOpacity style={styles.helpCenterCard} activeOpacity={0.8}>
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
});
