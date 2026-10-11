import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';

interface SettingsDrawerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsDrawerModal: React.FC<SettingsDrawerModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { user, coupleSpace, logout, archiveSpace } = useAuth();
  const partner = coupleSpace?.members?.find((m) => m.userId !== user?.id);

  const [dateReminder, setDateReminder] = useState(true);
  const [dailySparkNotif, setDailySparkNotif] = useState(true);
  const [blindReviewPrivacy, setBlindReviewPrivacy] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const myName =
    (user as any)?.profile?.displayName ||
    (user as any)?.displayName ||
    user?.email?.split('@')[0] ||
    'Kamu';
  const partnerName =
    partner?.displayName ||
    (coupleSpace?.status === 'ACTIVE' ? 'Pasangan' : 'Menunggu Pasangan');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
      router.replace('/(auth)/login');
    } catch (err: any) {
      setStatusMsg(err?.message || 'Gagal keluar dari sesi');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleArchiveConfirm = async () => {
    const doArchive = async () => {
      setIsArchiving(true);
      try {
        await archiveSpace('ARCHIVE');
        setStatusMsg('Ruang cinta berhasil diarsipkan');
        onClose();
        router.replace('/(pairing)/create');
      } catch (err: any) {
        setStatusMsg(err?.message || 'Gagal mengarsipkan ruang');
      } finally {
        setIsArchiving(false);
      }
    };

    if (Platform.OS === 'web') {
      if (
        window.confirm(
          'Apakah kamu yakin ingin mengarsipkan ruang ini? Data kenangan akan dibekukan.'
        )
      ) {
        doArchive();
      }
    } else {
      Alert.alert(
        'Arsipkan Ruang Cinta',
        'Apakah kamu yakin ingin mengarsipkan ruang cinta ini? Seluruh data kenangan akan dibekukan.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Arsipkan', style: 'destructive', onPress: doArchive },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Ionicons name="settings-outline" size={20} color={colors.primaryBlue} />
              <Text style={styles.headerTitle}>Pengaturan OURS</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Tutup Pengaturan">
              <Ionicons name="close" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {statusMsg ? (
            <View style={styles.statusToast}>
              <Text style={styles.statusToastText}>{statusMsg}</Text>
              <TouchableOpacity onPress={() => setStatusMsg(null)}>
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Profil Singkat */}
            <View style={styles.profileCard}>
              <View style={styles.avatarPairRow}>
                <View style={[styles.avatarBubble, { backgroundColor: '#E0E7FF' }]}>
                  <Text style={styles.avatarLetter}>{(myName[0] || 'K').toUpperCase()}</Text>
                </View>
                <View style={[styles.avatarBubble, { marginLeft: -12, backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.avatarLetter, { color: '#E11D48' }]}>
                    {(partnerName[0] || 'P').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.profileInfoCol}>
                <Text style={styles.profileNameText}>
                  {myName} & {partnerName}
                </Text>
                <Text style={styles.profileEmailText}>{user?.email || 'Akun Aktif'}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                  <Text style={styles.verifiedBadgeText}>Sesi Aman PostgreSQL</Text>
                </View>
              </View>
            </View>

            {/* Bagian 1: Ruang Cinta Pasangan */}
            <Text style={styles.sectionHeader}>Ruang Cinta Bersama</Text>
            <View style={styles.settingsGroupCard}>
              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="heart-outline" size={18} color="#E11D48" />
                  <View>
                    <Text style={styles.settingItemTitle}>Nama Ruang</Text>
                    <Text style={styles.settingItemSubtitle}>
                      {coupleSpace?.name || 'Ruang Cinta Kita'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.itemDivider} />

              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="people-outline" size={18} color="#2563EB" />
                  <View>
                    <Text style={styles.settingItemTitle}>Status Pasangan</Text>
                    <Text style={styles.settingItemSubtitle}>
                      {coupleSpace?.status === 'ACTIVE'
                        ? 'Terhubung Aktif'
                        : 'Menunggu Pasangan Bergabung'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.itemDivider} />

              <TouchableOpacity
                style={styles.settingItemRowClickable}
                onPress={() => {
                  onClose();
                  router.push('/(pairing)/settings');
                }}
                activeOpacity={0.8}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="key-outline" size={18} color="#D97706" />
                  <View>
                    <Text style={styles.settingItemTitle}>Kode Undangan & Pairing</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Lihat atau buat kode undangan pasangan baru
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Bagian 2: Preferensi Notifikasi */}
            <Text style={styles.sectionHeader}>Preferensi & Notifikasi</Text>
            <View style={styles.settingsGroupCard}>
              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                  <View>
                    <Text style={styles.settingItemTitle}>Pengingat Kencan</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Notifikasi H-1 sebelum agenda kencan
                    </Text>
                  </View>
                </View>
                <Switch
                  value={dateReminder}
                  onValueChange={setDateReminder}
                  trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                  thumbColor={dateReminder ? colors.primaryBlue : '#F1F5F9'}
                />
              </View>

              <View style={styles.itemDivider} />

              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="sparkles-outline" size={18} color="#7C3AED" />
                  <View>
                    <Text style={styles.settingItemTitle}>Percikan Harian (Daily Spark)</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Pertanyaan refleksi harian pasangan
                    </Text>
                  </View>
                </View>
                <Switch
                  value={dailySparkNotif}
                  onValueChange={setDailySparkNotif}
                  trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                  thumbColor={dailySparkNotif ? '#7C3AED' : '#F1F5F9'}
                />
              </View>

              <View style={styles.itemDivider} />

              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="eye-off-outline" size={18} color="#059669" />
                  <View>
                    <Text style={styles.settingItemTitle}>Privasi Blind Review</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Kunci ulasan hingga pasangan selesai menilai
                    </Text>
                  </View>
                </View>
                <Switch
                  value={blindReviewPrivacy}
                  onValueChange={setBlindReviewPrivacy}
                  trackColor={{ false: '#E2E8F0', true: '#A7F3D0' }}
                  thumbColor={blindReviewPrivacy ? '#059669' : '#F1F5F9'}
                />
              </View>
            </View>

            {/* Bagian 3: Integritas Sistem & Database */}
            <Text style={styles.sectionHeader}>Integritas Data & Server</Text>
            <View style={styles.settingsGroupCard}>
              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="server-outline" size={18} color="#2563EB" />
                  <View>
                    <Text style={styles.settingItemTitle}>Penyimpanan Utama</Text>
                    <Text style={styles.settingItemSubtitle}>PostgreSQL Supabase (PgBouncer)</Text>
                  </View>
                </View>
                <View style={styles.onlinePill}>
                  <Text style={styles.onlinePillText}>Aktif</Text>
                </View>
              </View>

              <View style={styles.itemDivider} />

              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="cloud-upload-outline" size={18} color="#0891B2" />
                  <View>
                    <Text style={styles.settingItemTitle}>Media Storage</Text>
                    <Text style={styles.settingItemSubtitle}>Cloudinary Private Storage Port</Text>
                  </View>
                </View>
                <View style={styles.onlinePill}>
                  <Text style={styles.onlinePillText}>Terhubung</Text>
                </View>
              </View>
            </View>

            {/* Bagian 4: Aksi Kritis & Keluar */}
            <Text style={styles.sectionHeader}>Aksi Akun</Text>
            <View style={styles.settingsGroupCard}>
              <TouchableOpacity
                style={styles.settingItemRowClickable}
                onPress={handleArchiveConfirm}
                disabled={isArchiving}
                activeOpacity={0.8}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="archive-outline" size={18} color="#DC2626" />
                  <View>
                    <Text style={[styles.settingItemTitle, { color: '#DC2626' }]}>
                      Arsipkan Ruang Cinta
                    </Text>
                    <Text style={styles.settingItemSubtitle}>
                      Bekukan riwayat dan putuskan tautan pasangan
                    </Text>
                  </View>
                </View>
                {isArchiving ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#DC2626" />
                )}
              </TouchableOpacity>

              <View style={styles.itemDivider} />

              <TouchableOpacity
                style={styles.settingItemRowClickable}
                onPress={handleLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="log-out-outline" size={18} color="#4B5563" />
                  <View>
                    <Text style={styles.settingItemTitle}>Keluar dari Akun</Text>
                    <Text style={styles.settingItemSubtitle}>Akhiri sesi masuk di perangkat ini</Text>
                  </View>
                </View>
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerNoteBox}>
              <Text style={styles.footerNoteText}>OURS v1.0.0 • Ruang Cinta Privat & Editorial</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  statusToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  avatarPairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  profileInfoCol: {
    flex: 1,
  },
  profileNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  profileEmailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  settingsGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingItemRowClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  settingItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 46,
  },
  onlinePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  onlinePillText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  footerNoteBox: {
    alignItems: 'center',
    marginTop: 12,
    paddingBottom: 16,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
