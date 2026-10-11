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
import { colors, spacing } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { api } from '@/services/api';
import {
  HomeDashboardResponse,
  DailySparkQuestionDto,
  AiRelationshipInsightDto,
  OursWrappedDto,
} from '@ours/contracts';
import { Ionicons } from '@expo/vector-icons';
import { formatTanggal } from '@/utils/format';
import { ThreeDimensionalCoupleExperience } from '@/components/ThreeDimensionalCoupleExperience';
import { CircularCarousel } from '@/components/free-components/CircularCarousel';
import { SettingsDrawerModal } from '@/components/SettingsDrawerModal';

export default function HomeTabScreen() {
  const router = useRouter();
  const { user, coupleSpace } = useAuth();
  const [dashboard, setDashboard] = useState<HomeDashboardResponse | null>(null);
  const [dailySpark, setDailySpark] = useState<DailySparkQuestionDto | null>(null);
  const [aiInsights, setAiInsights] = useState<AiRelationshipInsightDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Daily Spark modal state
  const [showSparkModal, setShowSparkModal] = useState(false);
  const [sparkAnswer, setSparkAnswer] = useState('');
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // Wrapped modal state
  const [showWrappedModal, setShowWrappedModal] = useState(false);
  const [wrappedData, setWrappedData] = useState<OursWrappedDto | null>(null);
  const [loadingWrapped, setLoadingWrapped] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const [dashRes, sparkRes, insightsRes] = await Promise.all([
        api.home.getDashboard(),
        api.games.getDailySpark().catch(() => null),
        api.ai.insights().catch(() => []),
      ]);
      setDashboard(dashRes);
      if (sparkRes) setDailySpark(sparkRes);
      if (insightsRes) setAiInsights(insightsRes);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat beranda pasangan');
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

  const openWrapped = async () => {
    setShowWrappedModal(true);
    setLoadingWrapped(true);
    try {
      const data = await api.wrapped.get();
      setWrappedData(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat OURS Wrapped');
    } finally {
      setLoadingWrapped(false);
    }
  };

  const handleSparkSubmit = async () => {
    if (!sparkAnswer.trim()) return;
    setSparkSubmitted(true);
    setShowSparkModal(false);
  };

  if (loading && !dashboard) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
        <Text style={styles.loadingText}>Memuat ruang cerita kita...</Text>
      </View>
    );
  }

  const space = dashboard?.coupleSpace;
  const partner = dashboard?.partner;

  const calculateDaysTogether = (): number => {
    if (space?.anniversaryDate) {
      const start = new Date(space.anniversaryDate).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    }
    return space?.daysTogether || 0;
  };

  const daysCount = calculateDaysTogether();
  const partnerName = partner?.displayName || (coupleSpace?.status === 'ACTIVE' ? 'Pasangan' : 'Menunggu Pasangan');
  const myName = (user as any)?.profile?.displayName || (user as any)?.displayName || user?.email?.split('@')[0] || 'Kamu';

  const upcomingDate = dashboard?.upcomingDates && dashboard.upcomingDates.length > 0
    ? dashboard.upcomingDates[0]
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />}>
      
      {/* 1. Header Pasangan */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarOverlapContainer}>
            <View style={[styles.avatarCircle, { zIndex: 2, backgroundColor: '#E0E7FF' }]}>
              <Text style={styles.avatarInitial}>
                {(myName[0] || 'D').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.avatarCircle, { marginLeft: -12, zIndex: 1, backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.avatarInitial, { color: '#E11D48' }]}>
                {(partnerName[0] || 'S').toUpperCase()}
              </Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.headerGreetingCol}>
            <Text style={styles.headerGreetingSub}>Halo,</Text>
            <Text style={styles.headerNamesTitle}>
              {myName} & {partnerName}
            </Text>
          </View>
        </View>

        <View style={styles.headerActionsRight}>
          <TouchableOpacity
            style={styles.iconCircleButton}
            onPress={openWrapped}
            accessibilityRole="button"
            accessibilityLabel="Kilas Balik">
            <Ionicons name="sparkles" size={18} color={colors.primaryBlue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconCircleButton}
            onPress={() => setShowSettingsDrawer(true)}
            accessibilityRole="button"
            accessibilityLabel="Menu Pengaturan">
            <Ionicons name="menu-outline" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Days Counter Card (Widget Utama Mockup) */}
      <View style={styles.daysCounterCard}>
        <View style={styles.daysTextCol}>
          <Text style={styles.daysSubtitle}>Kita sudah bersama</Text>
          <Text style={styles.daysNumber}>
            {daysCount} <Text style={styles.daysUnit}>hari</Text>
          </Text>
          <Text style={styles.daysSinceText}>
            {space?.anniversaryDate ? `Sejak ${formatTanggal(space.anniversaryDate)}` : 'Sejak 14 Feb 2023'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.heartButtonCircle}
          onPress={openWrapped}
          activeOpacity={0.85}>
          <Ionicons name="heart" size={26} color="#F43F5E" />
        </TouchableOpacity>
      </View>

      {/* 3. Rencana Berikutnya Card */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Rencana berikutnya</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/dates')}>
          <Text style={styles.sectionLink}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      {upcomingDate ? (
        <TouchableOpacity
          style={styles.upcomingDateCard}
          onPress={() => router.push('/(tabs)/dates')}
          activeOpacity={0.9}>
          <View style={styles.upcomingDateContent}>
            <View style={styles.upcomingBadgePill}>
              <Ionicons name="calendar-outline" size={12} color="#2563EB" />
              <Text style={styles.upcomingBadgeText}>Kencan Terjadwal</Text>
            </View>
            <Text style={styles.upcomingDateTitle} numberOfLines={1}>
              {upcomingDate.title}
            </Text>
            <Text style={styles.upcomingDateSubtitle}>
              {upcomingDate.plannedDate ? formatTanggal(upcomingDate.plannedDate) : 'Tanggal belum ditentukan'}
            </Text>
          </View>
          <View style={styles.upcomingDateActionBtn}>
            <Ionicons name="chevron-forward" size={20} color="#2563EB" />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.upcomingDateCard}
          onPress={() => router.push('/(tabs)/dates')}
          activeOpacity={0.9}>
          <View style={styles.upcomingDateContent}>
            <View style={styles.upcomingBadgePill}>
              <Ionicons name="calendar-outline" size={12} color="#2563EB" />
              <Text style={styles.upcomingBadgeText}>Rencana Kencan</Text>
            </View>
            <Text style={styles.upcomingDateTitle}>Belum ada kencan terjadwal</Text>
            <Text style={styles.upcomingDateSubtitle}>
              Rencanakan kencan romantis berdua sekarang.
            </Text>
          </View>
          <View style={styles.upcomingDateActionBtn}>
            <Ionicons name="add" size={22} color="#2563EB" />
          </View>
        </TouchableOpacity>
      )}

      {/* 4. Aksi Cepat 4-Grid Icon Bulat */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.quickGridRow}>
          {/* Jelajahi */}
          <TouchableOpacity
            style={styles.quickGridItem}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.85}>
            <View style={[styles.quickRoundIcon, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="compass" size={22} color="#EA580C" />
            </View>
            <Text style={styles.quickLabel}>Jelajahi</Text>
          </TouchableOpacity>

          {/* Kalender */}
          <TouchableOpacity
            style={styles.quickGridItem}
            onPress={() => router.push('/(tabs)/dates')}
            activeOpacity={0.85}>
            <View style={[styles.quickRoundIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="calendar" size={22} color="#2563EB" />
            </View>
            <Text style={styles.quickLabel}>Kalender</Text>
          </TouchableOpacity>

          {/* Pengeluaran */}
          <TouchableOpacity
            style={styles.quickGridItem}
            onPress={() => router.push('/(tabs)/visits')}
            activeOpacity={0.85}>
            <View style={[styles.quickRoundIcon, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="wallet" size={22} color="#4F46E5" />
            </View>
            <Text style={styles.quickLabel}>Pengeluaran</Text>
          </TouchableOpacity>

          {/* Kenangan */}
          <TouchableOpacity
            style={styles.quickGridItem}
            onPress={() => router.push('/(tabs)/hub')}
            activeOpacity={0.85}>
            <View style={[styles.quickRoundIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="images" size={22} color="#DB2777" />
            </View>
            <Text style={styles.quickLabel}>Kenangan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Kenangan Terbaru Carousel */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Kenangan Terbaru</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/hub')}>
          <Text style={styles.sectionLink}>Lihat Semua &gt;</Text>
        </TouchableOpacity>
      </View>

      {dashboard?.recentMemories && dashboard.recentMemories.length > 0 ? (
        <CircularCarousel
          data={dashboard.recentMemories.map((m) => ({
            id: m.id,
            title: m.title,
            date: formatTanggal(m.memoryDate),
            coverUrl:
              m.coverUrl ||
              'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
          }))}
          itemWidth={260}
          renderItem={(item) => (
            <TouchableOpacity
              style={styles.memoryCardItem}
              onPress={() => router.push('/(tabs)/hub')}
              activeOpacity={0.88}>
              <Image source={{ uri: item.coverUrl }} style={styles.memoryCardImage} resizeMode="cover" />
              <View style={styles.memoryCardOverlay} />
              <View style={styles.memoryCardTextBox}>
                <Text style={styles.memoryCardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.memoryCardDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <TouchableOpacity
          style={styles.memoryEmptyCard}
          onPress={() => router.push('/(tabs)/hub')}
          activeOpacity={0.88}>
          <View style={styles.memoryEmptyIconBox}>
            <Ionicons name="images-outline" size={26} color="#F43F5E" />
          </View>
          <Text style={styles.memoryEmptyTitle}>Belum Ada Kenangan Tercatat</Text>
          <Text style={styles.memoryEmptySubtitle}>
            Abadikan momen kencan dan foto bersama di tab Kenangan untuk merayakannya di sini.
          </Text>
          <View style={styles.memoryEmptyActionBtn}>
            <Text style={styles.memoryEmptyActionText}>Tambah Kenangan Pertama</Text>
            <Ionicons name="arrow-forward" size={14} color="#F43F5E" />
          </View>
        </TouchableOpacity>
      )}

      {/* 6. Milestone & Refleksi Keintiman 2D */}
      <ThreeDimensionalCoupleExperience
        milestoneTitle={space?.name ? `Kisah ${space.name}` : 'Ikatan Cinta Kita'}
        daysTogether={daysCount}
        onExploreMilestone={openWrapped}
      />

      {/* 7. Percikan Harian (Daily Spark) */}
      {dailySpark && (
        <View style={styles.dailySparkBox}>
          <View style={styles.sparkTopBadgeRow}>
            <View style={styles.sparkPill}>
              <Ionicons name="sparkles" size={13} color="#2563EB" />
              <Text style={styles.sparkPillText}>Percikan Harian</Text>
            </View>
            <Text style={styles.sparkDateText}>{formatTanggal(dailySpark.date)}</Text>
          </View>
          <Text style={styles.sparkQuestionText}>{dailySpark.question}</Text>
          <TouchableOpacity
            style={styles.sparkCTAButton}
            onPress={() => setShowSparkModal(true)}
            activeOpacity={0.85}>
            <Text style={styles.sparkCTAButtonText}>
              {sparkSubmitted ? '✓ Jawaban Telah Dibagikan' : 'Bagikan Jawabanmu'}
            </Text>
            <Ionicons name="chatbubble-ellipses" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Percikan Harian */}
      <Modal visible={showSparkModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Jawab Percikan Harian</Text>
              <TouchableOpacity onPress={() => setShowSparkModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalQuestion}>{dailySpark?.question}</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Tuliskan jawaban tulus untuk pasanganmu..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={sparkAnswer}
              onChangeText={setSparkAnswer}
            />
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleSparkSubmit}
              activeOpacity={0.88}>
              <Text style={styles.modalSubmitButtonText}>Kirim Jawaban</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal OURS Wrapped */}
      <Modal visible={showWrappedModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Kilas Balik OURS Wrapped</Text>
              <TouchableOpacity onPress={() => setShowWrappedModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {loadingWrapped ? (
              <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginVertical: 32 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 12 }}>
                <Text style={styles.wrappedYearHeading}>Perjalanan Cinta Kita</Text>
                <Text style={styles.wrappedSummaryText}>
                  {wrappedData
                    ? `Kalian telah menyelesaikan ${wrappedData.totalDatesCompleted} kencan dari ${wrappedData.totalDatesPlanned} rencana, mencatat ${wrappedData.totalVisitsLogged} kunjungan tempat spesial, dan mengabadikan ${wrappedData.totalMemoriesCreated} kenangan indah!`
                    : 'Kalian telah mengunjungi berbagai tempat romantis, mencatat puluhan kenangan indah, dan terus bertumbuh bersama setiap harinya.'}
                </Text>
                <View style={styles.wrappedStatsGrid}>
                  <View style={styles.wrappedStatCard}>
                    <Text style={styles.wrappedStatNumber}>{daysCount}</Text>
                    <Text style={styles.wrappedStatLabel}>Hari Bersama</Text>
                  </View>
                  <View style={styles.wrappedStatCard}>
                    <Text style={styles.wrappedStatNumber}>{dashboard?.upcomingDates?.length || 3}</Text>
                    <Text style={styles.wrappedStatLabel}>Kencan Selesai</Text>
                  </View>
                </View>
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={() => setShowWrappedModal(false)}>
              <Text style={styles.modalSubmitButtonText}>Tutup Kilas Balik</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Drawer Pengaturan (Hamburger) */}
      <SettingsDrawerModal
        visible={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingBottom: 110,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Header Pasangan
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarOverlapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  headerGreetingCol: {
    justifyContent: 'center',
  },
  headerGreetingSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerNamesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  // Days Counter Card
  daysCounterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#202522',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  daysTextCol: {
    flex: 1,
  },
  daysSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  daysNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
  },
  daysUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  daysSinceText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  heartButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  // Upcoming Date Card
  upcomingDateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  upcomingDateContent: {
    flex: 1,
    marginRight: 12,
  },
  upcomingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 6,
  },
  upcomingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  upcomingDateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  upcomingDateSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  upcomingDateThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  upcomingDateActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quick Actions 4-Grid
  quickActionsContainer: {
    marginBottom: 22,
  },
  quickGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickGridItem: {
    alignItems: 'center',
    width: '23%',
  },
  quickRoundIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  // Memories Carousel
  memoryCarouselContainer: {
    gap: 12,
    paddingBottom: 6,
  },
  memoryCardItem: {
    width: 140,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  memoryCardImage: {
    width: '100%',
    height: '100%',
  },
  memoryCardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  memoryCardTextBox: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  memoryCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memoryCardDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  memoryEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  memoryEmptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  memoryEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  memoryEmptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 14,
  },
  memoryEmptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
  },
  memoryEmptyActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F43F5E',
  },
  // Daily Spark Box
  dailySparkBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sparkTopBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  sparkPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  sparkDateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  sparkQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 14,
  },
  sparkCTAButton: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sparkCTAButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modals
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalQuestion: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 16,
  },
  modalSubmitButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wrappedYearHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  wrappedSummaryText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
    marginBottom: 16,
  },
  wrappedStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  wrappedStatCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  wrappedStatNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryBlue,
  },
  wrappedStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
