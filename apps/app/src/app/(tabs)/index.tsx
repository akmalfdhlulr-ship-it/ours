import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
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
import { colors, luminousColors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { useCoupleData } from '@/context/couple-data-context';
import { api } from '@/services/api';
import { HomeDashboardResponse } from '@ours/contracts';
import { Ionicons } from '@expo/vector-icons';
import { SettingsDrawerModal } from '@/components/SettingsDrawerModal';



export default function HomeTabScreen() {
  const router = useRouter();
  const { user, coupleSpace } = useAuth();
  const {
    isNewCoupleMode,
    daysTogether,
    partnerNames,
    activeRole,
    setActiveRole,
    memories,
    dates,
    letters,
    addLoveNote,
    sendHeartbeat,
    lastPulseSentAt,
    lastPulseSender,
  } = useCoupleData();

  const [dashboard, setDashboard] = useState<HomeDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Quick reply note state
  const [memoInput, setMemoInput] = useState('');
  const [memoSentFeedback, setMemoSentFeedback] = useState(false);

  // Heart send animation
  const heartScaleAnim = useRef(new Animated.Value(1)).current;

  const fetchDashboard = useCallback(async () => {
    try {
      const dashRes = await api.home.getDashboard().catch(() => null);
      if (dashRes) setDashboard(dashRes);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleSendMemo = () => {
    Animated.sequence([
      Animated.timing(heartScaleAnim, { toValue: 1.35, duration: 150, useNativeDriver: true }),
      Animated.timing(heartScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    if (memoInput.trim()) {
      addLoveNote({
        title: 'Memo Manis',
        content: memoInput.trim(),
        sender: member1,
        recipient: member2,
      });
      setMemoSentFeedback(true);
      setMemoInput('');
      setTimeout(() => setMemoSentFeedback(false), 2600);
    }
  };

  const handleSendPulse = () => {
    Animated.sequence([
      Animated.timing(heartScaleAnim, { toValue: 1.4, duration: 180, useNativeDriver: true }),
      Animated.timing(heartScaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    sendHeartbeat(member1);
  };

  if (loading && !dashboard) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={luminousColors.primary} />
        <Text style={styles.loadingText}>Memuat ruang cerita kita...</Text>
      </View>
    );
  }

  const daysCount = daysTogether;
  const member1 = partnerNames.user;
  const member2 = partnerNames.partner;

  // Milestone targets
  const milestoneTarget =
    daysCount < 7 ? 7 : daysCount < 30 ? 30 : daysCount < 100 ? 100 : 500;
  const milestoneLabel =
    daysCount < 7
      ? 'Menuju 7 Hari Pertama 🌱'
      : daysCount < 30
      ? 'Menuju 1 Bulan Berdua 💕'
      : daysCount < 100
      ? 'Menuju 100 Hari Berdua 🌟'
      : 'Menuju 500 Hari';
  const remainingDays = Math.max(1, milestoneTarget - daysCount);
  const progressPercent = Math.min(100, Math.round((daysCount / milestoneTarget) * 100));

  const upcomingDate = dates.length > 0 ? dates[0] : null;
  const latestLetter = letters.length > 0 ? letters[0] : null;

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
              <Ionicons name="person" size={15} color={luminousColors.secondary} />
            </View>
            <View style={styles.syncedDot} />
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.headerSyncText}>
              OURS <Text style={styles.headerSyncDot}>•</Text> Synced
            </Text>
            <Text style={styles.headerMainTitle}>Beranda</Text>
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={luminousColors.primary}
          />
        }>
        {/* ---------------- 1. Hero Milestone Card ---------------- */}
        <View style={styles.heroMilestoneCard}>
          {/* Ambient Glows */}
          <View style={styles.heroGlowTopRight} pointerEvents="none" />
          <View style={styles.heroGlowBottomLeft} pointerEvents="none" />

          {/* Connected Avatars */}
          <View style={styles.connectedAvatarsRow}>
            <View style={styles.avatarCircleLeft}>
              {(user as any)?.avatarUrl ? (
                <Image source={{ uri: (user as any).avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, { backgroundColor: luminousColors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                    {member1.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.avatarHeartBridge}>
              <Ionicons name="heart" size={13} color={luminousColors.primary} />
            </View>
            <View style={styles.avatarCircleRight}>
              {(coupleSpace as any)?.partnerAvatarUrl ? (
                <Image source={{ uri: (coupleSpace as any).partnerAvatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, { backgroundColor: luminousColors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                    {member2.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Days Counter */}
          <View style={styles.counterRow}>
            <Text style={styles.counterNumber}>{daysCount}</Text>
            <Text style={styles.counterUnit}>Hari</Text>
          </View>
          <Text style={styles.counterSubtitle}>
            Merajut Cerita {member1} &amp; {member2}
          </Text>

          {/* Milestone Progress Bar */}
          <View style={styles.milestoneProgressContainer}>
            <View style={styles.milestoneProgressHeader}>
              <View style={styles.milestoneLabelGroup}>
                <Ionicons name="flag-outline" size={13} color={luminousColors.primary} />
                <Text style={styles.milestoneLabelText}>{milestoneLabel}</Text>
              </View>
              <Text style={styles.milestoneRemainingText}>
                {remainingDays} hari lagi
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* ---------------- 2. Detak Rasa Hari Ini (Daily Mood) ---------------- */}
        <View style={styles.moodSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Detak Rasa Hari Ini</Text>
            <TouchableOpacity
              style={styles.syncStatusGroup}
              onPress={handleSendPulse}
              activeOpacity={0.7}>
              <View style={styles.syncPulseDot} />
              <Text style={styles.syncStatusText}>
                {lastPulseSentAt ? 'Detak terkirim baru saja ❤️' : 'Ketuk untuk kirim cinta'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.moodCardsCol}>
            {/* User Mood */}
            <TouchableOpacity
              style={styles.moodCard}
              activeOpacity={0.88}
              onPress={handleSendPulse}>
              <View style={styles.moodCardLeft}>
                <View style={styles.moodIconBgTertiary}>
                  <Ionicons name="flower-outline" size={18} color="#A63047" />
                </View>
                <View style={styles.moodTextGroup}>
                  <Text style={styles.moodWho}>
                    {member1} (Kamu hari ini)
                  </Text>
                  <Text style={styles.moodStatus}>
                    {lastPulseSentAt ? '🌸 Detak Cinta Terkirim' : '🌸 Siap Kencan Romantis'}
                  </Text>
                </View>
              </View>
              <Ionicons name="heart" size={18} color={luminousColors.primary} />
            </TouchableOpacity>

            {/* Partner Mood */}
            <TouchableOpacity
              style={styles.moodCard}
              activeOpacity={0.88}
              onPress={handleSendPulse}>
              <View style={styles.moodCardLeft}>
                <View style={styles.moodIconBgSecondary}>
                  <Ionicons name="cafe-outline" size={18} color="#00668A" />
                </View>
                <View style={styles.moodTextGroup}>
                  <Text style={styles.moodWho}>
                    {member2} (Pasangan)
                  </Text>
                  <Text style={styles.moodStatus}>
                    {coupleSpace?.status === 'ACTIVE' ? '☕ Terhubung Real-Time' : '🌱 Menunggu Bergabung'}
                  </Text>
                </View>
              </View>
              <Ionicons name="heart" size={18} color={luminousColors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- 3. Kencan Terdekat ---------------- */}
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.upcomingHeaderGroup}>
              <Ionicons name="wine-outline" size={18} color={luminousColors.primary} />
              <Text style={styles.sectionTitle}>Kencan Terdekat</Text>
            </View>
            {upcomingDate && (
              <View style={styles.malamIniBadge}>
                <Text style={styles.malamIniBadgeText}>Segera</Text>
              </View>
            )}
          </View>

          {upcomingDate ? (
            <View style={styles.upcomingDateCard}>
              <View style={styles.upcomingDateHero}>
                {upcomingDate.imageUrl ? (
                  <Image
                    source={{ uri: upcomingDate.imageUrl }}
                    style={styles.upcomingHeroImg}
                  />
                ) : (
                  <View style={[styles.upcomingHeroImg, { backgroundColor: '#34406B' }]} />
                )}
                <View style={styles.upcomingScrim} />

                <View style={styles.tableBadge}>
                  <Ionicons name="restaurant-outline" size={13} color={luminousColors.primary} />
                  <Text style={styles.tableBadgeText}>{upcomingDate.venueName || 'Kencan Spesial'}</Text>
                </View>

                <View style={styles.upcomingDateHeroInfo}>
                  <Text style={styles.upcomingDateCategory}>AGENDA BERDUA</Text>
                  <Text style={styles.upcomingDateTitle}>{upcomingDate.title}</Text>
                </View>
              </View>

              <View style={styles.upcomingDateBottomBar}>
                <View style={styles.upcomingDateTimeGroup}>
                  <View style={styles.timeIconCircle}>
                    <Ionicons name="time-outline" size={20} color={luminousColors.primary} />
                  </View>
                  <View>
                    <Text style={styles.timeText}>{upcomingDate.time || '19.00 WIB'}</Text>
                    <Text style={styles.confirmedText}>
                      {upcomingDate.date || 'Terkonfirmasi'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.ruteBtn}
                  onPress={() => router.push('/(tabs)/dates')}
                  activeOpacity={0.88}>
                  <Text style={styles.ruteBtnText}>Detail</Text>
                  <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.upcomingDateCard, { padding: 22, alignItems: 'center', backgroundColor: '#FFFFFF' }]}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFEBF0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="calendar-outline" size={24} color={luminousColors.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: luminousColors.onSurface, marginBottom: 6, textAlign: 'center' }}>
                Belum Ada Jadwal Kencan Berdua ✨
              </Text>
              <Text style={{ fontSize: 13, color: luminousColors.onSurfaceVariant, textAlign: 'center', marginBottom: 16, lineHeight: 19 }}>
                Mulai petualangan cinta kalian dengan merencanakan kencan pertama yang romantis bersama {member2}.
              </Text>
              <TouchableOpacity
                style={[styles.ruteBtn, { paddingHorizontal: 20, height: 40 }]}
                onPress={() => router.push('/(tabs)/dates')}
                activeOpacity={0.88}>
                <Ionicons name="add" size={17} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.ruteBtnText}>Rencanakan Kencan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ---------------- 4. Love Note Memo ---------------- */}
        <View style={styles.memoCard}>
          <View style={styles.memoHeaderRow}>
            <View style={styles.memoAuthorGroup}>
              <View style={styles.memoIconBg}>
                <Ionicons name="mail" size={14} color={luminousColors.primary} />
              </View>
              <Text style={styles.memoAuthorText}>
                {latestLetter ? `Memo Sayang dari ${latestLetter.sender}` : 'Memo Sayang Pertama 💌'}
              </Text>
            </View>
            <Text style={styles.memoTimeText}>
              {latestLetter ? latestLetter.sealedDate : 'Hari Ini'}
            </Text>
          </View>

          <View style={styles.memoQuoteBox}>
            <Text style={styles.memoQuoteText}>
              {latestLetter
                ? `“${latestLetter.fullText}”`
                : '“Ruang pesan masih bersih. Tuliskan pesan manis pertamamu untuk menyapa harinya hari ini! ✨”'}
            </Text>
          </View>

          <View style={styles.memoInputRow}>
            <TextInput
              style={styles.memoTextInput}
              placeholder={memoSentFeedback ? 'Terkirim dengan hangat! ❤️' : 'Kirim sapaan manis atau balas...'}
              placeholderTextColor="#8F6F71"
              value={memoInput}
              onChangeText={setMemoInput}
            />
            <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
              <TouchableOpacity
                style={styles.memoHeartSendBtn}
                onPress={handleSendMemo}
                activeOpacity={0.85}>
                <Ionicons name="heart" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* ---------------- 5. 4 Quick Shortcuts ---------------- */}
        <View style={styles.shortcutsGrid}>
          {/* Jelajah */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.85}>
            <View style={[styles.shortcutIconBg, { backgroundColor: '#E2E7FF' }]}>
              <Ionicons name="compass" size={22} color={luminousColors.secondary} />
            </View>
            <Text style={styles.shortcutLabel}>Jelajah</Text>
          </TouchableOpacity>

          {/* Kalender */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/(tabs)/dates')}
            activeOpacity={0.85}>
            <View style={[styles.shortcutIconBg, { backgroundColor: '#FFDADB' }]}>
              <Ionicons name="calendar" size={22} color={luminousColors.primary} />
            </View>
            <Text style={styles.shortcutLabel}>Kalender</Text>
          </TouchableOpacity>

          {/* Dompet */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/(tabs)/visits')}
            activeOpacity={0.85}>
            <View style={[styles.shortcutIconBg, { backgroundColor: '#E2E7FF' }]}>
              <Ionicons name="wallet" size={22} color={luminousColors.secondary} />
            </View>
            <Text style={styles.shortcutLabel}>Dompet</Text>
          </TouchableOpacity>

          {/* Kenangan */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/memories' as any)}
            activeOpacity={0.85}>
            <View style={[styles.shortcutIconBg, { backgroundColor: '#FFDADC' }]}>
              <Ionicons name="book" size={22} color={luminousColors.tertiary} />
            </View>
            <Text style={styles.shortcutLabel}>Kenangan</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- 6. Momen Manis Pekan Ini (Polaroids) ---------------- */}
        <View style={styles.polaroidSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.upcomingHeaderGroup}>
              <Ionicons name="images-outline" size={18} color={luminousColors.primary} />
              <Text style={styles.sectionTitle}>Momen Manis Pekan Ini</Text>
            </View>
            <Text style={styles.photoCountText}>
              {memories.length > 0 ? `${memories.length} foto tersimpan` : 'Buku Waktu Baru'}
            </Text>
          </View>

          {memories.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.polaroidScroll}>
              {memories.map((mem) => (
                <TouchableOpacity
                  key={mem.id}
                  style={styles.polaroidCard}
                  onPress={() => router.push('/memories' as any)}
                  activeOpacity={0.88}>
                  <View style={styles.polaroidImgBox}>
                    <Image source={{ uri: mem.imageUrl }} style={styles.polaroidImg} />
                  </View>
                  <Text style={styles.polaroidTitle} numberOfLines={1}>
                    {mem.title}
                  </Text>
                  <Text style={styles.polaroidSubtitle} numberOfLines={1}>
                    {mem.locationName || mem.date} • Oleh {mem.author}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.polaroidCard, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F6FA' }]}
                onPress={() => router.push('/memories' as any)}
                activeOpacity={0.85}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFEBF0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="add" size={24} color={luminousColors.primary} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: luminousColors.primary }}>+ Tambah Foto</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={[styles.upcomingDateCard, { padding: 20, alignItems: 'center', backgroundColor: '#FFFFFF' }]}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFEBF0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="camera-outline" size={24} color={luminousColors.primary} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: luminousColors.onSurface, marginBottom: 4, textAlign: 'center' }}>
                Buku Waktu Masih Bersih 📸
              </Text>
              <Text style={{ fontSize: 13, color: luminousColors.onSurfaceVariant, textAlign: 'center', marginBottom: 14, lineHeight: 18 }}>
                Belum ada foto yang tersimpan. Abadikan senyum dan momen pertama kalian berdua untuk mulai membangun album cinta bersama.
              </Text>
              <TouchableOpacity
                style={[styles.ruteBtn, { paddingHorizontal: 18, height: 38 }]}
                onPress={() => router.push('/memories' as any)}
                activeOpacity={0.88}>
                <Ionicons name="image-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.ruteBtnText}>Simpan Foto Berdua</Text>
              </TouchableOpacity>
            </View>
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#5B4041',
    fontWeight: '500',
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

  // ---------------- 1. Hero Milestone Card ----------------
  heroMilestoneCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#B90538',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  heroGlowTopRight: {
    position: 'absolute',
    top: -36,
    right: -36,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 218, 219, 0.45)',
  },
  heroGlowBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(196, 231, 255, 0.45)',
  },
  connectedAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarCircleLeft: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircleRight: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginLeft: -12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarHeartBridge: {
    position: 'absolute',
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  counterNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#B90538',
    letterSpacing: -1,
  },
  counterUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5B4041',
  },
  counterSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B4041',
    marginTop: 2,
  },
  milestoneProgressContainer: {
    width: '100%',
    marginTop: 16,
    backgroundColor: '#F2F3FF',
    borderRadius: 9999,
    padding: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  milestoneProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  milestoneLabelText: {
    fontSize: 11,
    color: '#5B4041',
    fontWeight: '600',
  },
  milestoneRemainingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B90538',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#E2E7FF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#B90538',
    borderRadius: 4,
  },

  // ---------------- 2. Detak Rasa ----------------
  moodSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
  },
  syncStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00668A',
  },
  syncStatusText: {
    fontSize: 11,
    color: '#00668A',
    fontWeight: '600',
  },
  moodCardsCol: {
    gap: 8,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  moodCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  moodIconBgTertiary: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFDADC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIconBgSecondary: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#C4E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodTextGroup: {
    flex: 1,
  },
  moodWho: {
    fontSize: 11,
    color: '#5B4041',
  },
  moodStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
    marginTop: 1,
  },

  // ---------------- 3. Upcoming Date ----------------
  upcomingSection: {
    gap: 10,
  },
  upcomingHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  malamIniBadge: {
    backgroundColor: '#FFDADB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  malamIniBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B90538',
  },
  upcomingDateCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  upcomingDateHero: {
    height: 170,
    position: 'relative',
  },
  upcomingHeroImg: {
    width: '100%',
    height: '100%',
  },
  upcomingScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.4)',
  },
  tableBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#131B2E',
  },
  upcomingDateHeroInfo: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
  },
  upcomingDateCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    opacity: 0.9,
  },
  upcomingDateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  upcomingDateBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  upcomingDateTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E2E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#131B2E',
  },
  confirmedText: {
    fontSize: 11,
    color: '#5B4041',
  },
  ruteBtn: {
    backgroundColor: '#B90538',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ruteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ---------------- 4. Love Note Memo ----------------
  memoCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(242, 243, 255, 0.75)',
    gap: 12,
  },
  memoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memoAuthorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memoIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFDADB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoAuthorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  memoTimeText: {
    fontSize: 11,
    color: '#5B4041',
  },
  memoQuoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 14,
    borderRadius: 18,
  },
  memoQuoteText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    color: '#131B2E',
  },
  memoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memoTextInput: {
    flex: 1,
    height: 42,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#131B2E',
  },
  memoHeartSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#B90538',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------------- 5. Shortcuts ----------------
  shortcutsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  shortcutCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  shortcutIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#131B2E',
  },

  // ---------------- 6. Polaroid Section ----------------
  polaroidSection: {
    gap: 12,
  },
  photoCountText: {
    fontSize: 11,
    color: '#5B4041',
    fontWeight: '500',
  },
  polaroidScroll: {
    gap: 12,
    paddingBottom: 4,
  },
  polaroidCard: {
    width: 175,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  polaroidImgBox: {
    width: '100%',
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#F2F3FF',
  },
  polaroidImg: {
    width: '100%',
    height: '100%',
  },
  polaroidTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  polaroidSubtitle: {
    fontSize: 11,
    color: '#5B4041',
    marginTop: 1,
  },
});
