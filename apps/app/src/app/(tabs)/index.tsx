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
  const [submittingSpark, setSubmittingSpark] = useState(false);

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
      if (sparkRes) {
        setDailySpark(sparkRes);
        if (sparkRes.myCompleted) {
          setSparkSubmitted(true);
          if (sparkRes.myAnswer) setSparkAnswer(sparkRes.myAnswer);
        }
      }
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
    if (!sparkAnswer.trim() || submittingSpark) return;
    setSubmittingSpark(true);
    try {
      const res = await api.games.answerDailySpark({ answer: sparkAnswer.trim() });
      setDailySpark(res);
      setSparkSubmitted(true);
      setShowSparkModal(false);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengirim jawaban percikan harian');
    } finally {
      setSubmittingSpark(false);
    }
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
      
      {/* 1. Header Pasangan (Screenshot 2 Match) */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=200&q=80',
            }}
            style={styles.headerCoupleAvatar}
          />
          <View style={styles.headerGreetingCol}>
            <Text style={styles.headerGreetingSub}>Halo,</Text>
            <Text style={styles.headerNamesTitle}>
              {myName && partnerName && partnerName !== 'Menunggu Pasangan'
                ? `${myName} & ${partnerName} 👋`
                : 'Daniel & Sasa 👋'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActionsRight}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setShowSettingsDrawer(true)}
            accessibilityRole="button"
            accessibilityLabel="Notifikasi">
            <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Days Counter Card (Soft Pink Card - Screenshot 2 Match) */}
      <TouchableOpacity
        style={styles.daysCounterCard}
        onPress={openWrapped}
        activeOpacity={0.92}>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#F472B6"
          style={styles.daysCardChevron}
        />
        <View style={styles.daysTextCol}>
          <Text style={styles.daysSubtitle}>Kita sudah bersama</Text>
          <Text style={styles.daysNumber}>
            {daysCount || 452} <Text style={styles.daysUnit}>hari</Text>
          </Text>
          <Text style={styles.daysSinceText}>
            {space?.anniversaryDate ? `Sejak ${formatTanggal(space.anniversaryDate)}` : 'Sejak 14 Feb 2023'}
          </Text>
        </View>
        <View style={styles.heartButtonCircle}>
          <Ionicons name="heart" size={26} color="#FF3366" />
        </View>
      </TouchableOpacity>

      {/* 3. Rencana Berikutnya Card (Screenshot 2 Match) */}
      <TouchableOpacity
        style={styles.upcomingDateCard}
        onPress={() => router.push('/(tabs)/dates')}
        activeOpacity={0.9}>
        <View style={styles.upcomingDateContent}>
          <Text style={styles.upcomingDateSubLabel}>Rencana berikutnya</Text>
          <Text style={styles.upcomingDateTitle} numberOfLines={1}>
            {upcomingDate?.title || 'Makan malam di ORO'}
          </Text>
          <Text style={styles.upcomingDateSubtitle}>
            {upcomingDate?.plannedDate
              ? formatTanggal(upcomingDate.plannedDate)
              : 'Sab, 20 Apr 2024 · 19.00'}
          </Text>
        </View>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
          }}
          style={styles.upcomingDateThumb}
        />
      </TouchableOpacity>

      {/* 4. Aksi Cepat 4-Grid Icon Bulat (Screenshot 2 Match) */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.quickGridRow}>
          {/* Jelajahi */}
          <TouchableOpacity
            style={styles.quickGridItem}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.85}>
            <View style={[styles.quickRoundIcon, { backgroundColor: '#FFF1E8' }]}>
              <Ionicons name="compass" size={24} color="#EA580C" />
            </View>
            <Text style={styles.quickLabel}>Jelajahi</Text>
          </TouchableOpacity>

          {/* Kalender */}
          <TouchableOpacity
            style={styles.quickGridItem}
            onPress={() => router.push('/(tabs)/dates')}
            activeOpacity={0.85}>
            <View style={[styles.quickRoundIcon, { backgroundColor: '#EDF2FE' }]}>
              <Ionicons name="calendar" size={24} color="#2563EB" />
            </View>
            <Text style={styles.quickLabel}>Kalender</Text>
          </TouchableOpacity>

          {/* Pengeluaran */}
          <TouchableOpacity
            style={styles.quickGridItem}
            onPress={() => router.push('/(tabs)/visits')}
            activeOpacity={0.85}>
            <View style={[styles.quickRoundIcon, { backgroundColor: '#EBF5FE' }]}>
              <Ionicons name="bag-handle" size={24} color="#0284C7" />
            </View>
            <Text style={styles.quickLabel}>Pengeluaran</Text>
          </TouchableOpacity>

          {/* Kenangan */}
          <TouchableOpacity
            style={styles.quickGridItem}
            onPress={() => router.push('/(tabs)/hub')}
            activeOpacity={0.85}>
            <View style={[styles.quickRoundIcon, { backgroundColor: '#FDF0F3' }]}>
              <Ionicons name="camera" size={24} color="#E11D48" />
            </View>
            <Text style={styles.quickLabel}>Kenangan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Kenangan Terbaru - 3 Photo Grid (Screenshot 2 Match) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Kenangan Terbaru</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/hub')}>
          <Text style={styles.sectionLinkPink}>Lihat Semua &gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memoriesThreeGrid}>
        <TouchableOpacity
          style={styles.memoryGridItem}
          onPress={() => router.push('/(tabs)/hub')}
          activeOpacity={0.88}>
          <Image
            source={{
              uri:
                dashboard?.recentMemories?.[0]?.coverUrl ||
                'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.memoryGridImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.memoryGridItem}
          onPress={() => router.push('/(tabs)/hub')}
          activeOpacity={0.88}>
          <Image
            source={{
              uri:
                dashboard?.recentMemories?.[1]?.coverUrl ||
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.memoryGridImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.memoryGridItem}
          onPress={() => router.push('/(tabs)/hub')}
          activeOpacity={0.88}>
          <Image
            source={{
              uri:
                dashboard?.recentMemories?.[2]?.coverUrl ||
                'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.memoryGridImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

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

          {dailySpark.revealed ? (
            /* KEDUA JAWABAN TERUNGKAP */
            <View style={styles.sparkRevealedContainer}>
              <View style={styles.sparkMutualBadge}>
                <Ionicons name="heart" size={14} color="#E11D48" />
                <Text style={styles.sparkMutualBadgeText}>Kedua Jawaban Terungkap Bersama! ❤️</Text>
              </View>

              <View style={styles.sparkAnswerRow}>
                <View style={styles.sparkAnswerBoxMe}>
                  <Text style={styles.sparkAnswerAuthorText}>{myName || 'Kamu'}:</Text>
                  <Text style={styles.sparkAnswerContentText}>"{dailySpark.myAnswer}"</Text>
                </View>

                <View style={styles.sparkAnswerBoxPartner}>
                  <Text style={styles.sparkAnswerAuthorText}>{partnerName || 'Pasangan'}:</Text>
                  <Text style={styles.sparkAnswerContentText}>"{dailySpark.partnerAnswer}"</Text>
                </View>
              </View>
            </View>
          ) : dailySpark.myCompleted ? (
            /* MENUNGGU PASANGAN */
            <View style={styles.sparkWaitingContainer}>
              <View style={styles.sparkAnswerBoxMe}>
                <Text style={styles.sparkAnswerAuthorText}>Jawabanmu:</Text>
                <Text style={styles.sparkAnswerContentText}>"{dailySpark.myAnswer}"</Text>
              </View>
              <View style={styles.sparkLockStatusRow}>
                <Ionicons name="lock-closed" size={14} color="#D97706" />
                <Text style={styles.sparkLockStatusText}>
                  Menunggu pasanganmu menjawab untuk membuka kedua jawaban berdua! 💌
                </Text>
              </View>
            </View>
          ) : (
            /* BELUM MENJAWAB */
            <View>
              {dailySpark.partnerCompleted && (
                <View style={styles.sparkPartnerReadyBanner}>
                  <Ionicons name="notifications" size={13} color="#2563EB" />
                  <Text style={styles.sparkPartnerReadyText}>
                    {partnerName || 'Pasanganmu'} sudah menjawab! Jawab sekarang untuk membuka rahasianya.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.sparkCTAButton}
                onPress={() => setShowSparkModal(true)}
                activeOpacity={0.85}>
                <Text style={styles.sparkCTAButtonText}>
                  {dailySpark.partnerCompleted ? 'Jawab & Buka Bersama' : 'Bagikan Jawabanmu'}
                </Text>
                <Ionicons name="chatbubble-ellipses" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
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
              disabled={submittingSpark}
              activeOpacity={0.88}>
              {submittingSpark ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Kirim Jawaban</Text>
              )}
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
  headerCoupleAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3F4F6',
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
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Days Counter Card (Screenshot 2 Match: Soft Pink Background)
  daysCounterCard: {
    backgroundColor: '#FFE9ED',
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    shadowColor: '#FDA4AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 18,
  },
  daysCardChevron: {
    position: 'absolute',
    top: 18,
    right: 20,
  },
  daysTextCol: {
    flex: 1,
  },
  daysSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 4,
  },
  daysNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },
  daysUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  daysSinceText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  heartButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FDA4AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  sectionLinkPink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF3366',
  },
  // Upcoming Date Card (Screenshot 2 Match)
  upcomingDateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 18,
  },
  upcomingDateContent: {
    flex: 1,
    marginRight: 14,
  },
  upcomingDateSubLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  upcomingDateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  upcomingDateSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  upcomingDateThumb: {
    width: 86,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  // Quick Actions 4-Grid
  quickActionsContainer: {
    marginVertical: 10,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  // Memories 3-Grid
  memoriesThreeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  memoryGridItem: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  memoryGridImage: {
    width: '100%',
    height: '100%',
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
  sparkRevealedContainer: {
    marginTop: 4,
    gap: 8,
  },
  sparkMutualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFE4E6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  sparkMutualBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  sparkAnswerRow: {
    gap: 8,
  },
  sparkAnswerBoxMe: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
  },
  sparkAnswerBoxPartner: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F43F5E',
  },
  sparkAnswerAuthorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  sparkAnswerContentText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#1F2937',
    lineHeight: 18,
  },
  sparkWaitingContainer: {
    gap: 8,
  },
  sparkLockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sparkLockStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
    flex: 1,
  },
  sparkPartnerReadyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  sparkPartnerReadyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
    flex: 1,
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
