import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { luminousColors } from '@ours/design-tokens';
import Svg, { Circle } from 'react-native-svg';
import { api } from '@/services/api';
import { useCoupleData } from '@/context/couple-data-context';
import { CalendarEventItem, DatePlanDetailResponse } from '@ours/contracts';

interface AgendaItem {
  id: string;
  day: number;
  monthText: string;
  categoryTag: string;
  categoryColor: string;
  title: string;
  image: string;
  badgeText: string;
  badgeIcon: keyof typeof Ionicons.glyphMap;
  chips: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[];
  isMilestone?: boolean;
  lockedNote?: { title: string; hint: string };
}

export default function CalendarScreen() {
  const router = useRouter();
  const { dates, addDatePlan, partnerNames } = useCoupleData();

  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newCategory, setNewCategory] = useState<string>('Makan Malam Romantis');

  // Convert context dates to agenda items (strictly from genuine user dates)
  const currentAgenda: AgendaItem[] = React.useMemo(() => {
    return dates.map((d, idx) => {
      let day = 1;
      let monthText = 'Bln';
      try {
        if (d.date) {
          const parsed = new Date(d.date);
          if (!isNaN(parsed.getTime())) {
            day = parsed.getDate();
            monthText = parsed.toLocaleString('id-ID', { month: 'short' });
          }
        }
      } catch {
        day = idx + 1;
      }

      return {
        id: d.id,
        day,
        monthText,
        categoryTag: d.venueName || 'Kencan Romantis',
        categoryColor: luminousColors.primary,
        title: d.title,
        image:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
        badgeText: `${d.time || '19.00 WIB'} • Terkonfirmasi`,
        badgeIcon: 'calendar-outline',
        chips: [
          { label: d.time || '19.00 WIB', icon: 'time-outline', color: luminousColors.primary },
          { label: d.location || 'Jakarta', icon: 'location-outline', color: luminousColors.secondary },
        ],
      };
    });
  }, [dates]);

  const [agenda, setAgenda] = useState<AgendaItem[]>(currentAgenda);

  useEffect(() => {
    setAgenda(currentAgenda);
  }, [currentAgenda]);

  const fetchRemoteData = useCallback(async () => {
    try {
      const [eventsRes, plansRes] = await Promise.all([
        api.calendar.list().catch(() => []),
        api.dates.list().catch(() => []),
      ]);
      if (eventsRes && eventsRes.length > 0) {
        // Remote data
      }
    } catch {
      // Graceful fallback
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRemoteData();
  }, [fetchRemoteData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRemoteData();
  };

  const handleCreateEvent = async () => {
    if (!newTitle.trim()) return;

    // Save to shared CoupleDataContext
    addDatePlan({
      title: newTitle.trim(),
      date: newDate,
      time: '19.00 WIB',
      venueName: newCategory,
      location: 'Jakarta',
      estimatedBudget: 350000,
      status: 'upcoming',
      notes: 'Kencan indah bersama pasangan tercinta 💕',
    });

    const newItem: AgendaItem = {
      id: `event-${Date.now()}`,
      day: 22,
      monthText: 'Apr',
      categoryTag: newCategory,
      categoryColor: luminousColors.primary,
      title: newTitle.trim(),
      image: '',
      badgeText: 'Agenda Baru Dibuat',
      badgeIcon: 'calendar',
      chips: [
        { label: '19.00 WIB', icon: 'time-outline', color: luminousColors.primary },
        { label: 'Jakarta', icon: 'location-outline', color: luminousColors.secondary },
      ],
    };
    setAgenda((prev) => [newItem, ...prev]);
    setShowCreateModal(false);
    setNewTitle('');
  };

  return (
    <View style={styles.screenRoot}>
      {/* ---------------- Header ---------------- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerHeartCircle}>
            <Ionicons name="heart" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Kalender Pasangan</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.75}
            accessibilityLabel="Notifikasi Pasangan">
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={luminousColors.primary}
          />
        }>
        {/* Month Selector Row */}
        <View style={styles.monthHeaderRow}>
          <View style={styles.monthTitleGroup}>
            <Text style={styles.monthNameText}>April 2025</Text>
            <View style={styles.specialMonthPill}>
              <Ionicons name="sparkles" size={12} color={luminousColors.primary} />
              <Text style={styles.specialMonthText}>Bulan Spesial</Text>
            </View>
          </View>

          <View style={styles.monthNavBtns}>
            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={() => setMonthOffset((prev) => prev - 1)}
              activeOpacity={0.75}
              accessibilityLabel="Bulan Sebelumnya">
              <Ionicons name="chevron-back" size={18} color={luminousColors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={() => setMonthOffset((prev) => prev + 1)}
              activeOpacity={0.75}
              accessibilityLabel="Bulan Selanjutnya">
              <Ionicons name="chevron-forward" size={18} color={luminousColors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Metric Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsRow}>
          <View style={styles.metricPill}>
            <Ionicons name="heart" size={15} color={luminousColors.primary} />
            <Text style={styles.metricPillText}>
              {agenda.length > 0 ? `${agenda.length} Agenda Kencan Berdua` : 'Kalender Kencan Bersih 🌱'}
            </Text>
          </View>
          <View style={[styles.metricPill, { borderColor: 'rgba(0, 102, 138, 0.15)' }]}>
            <Ionicons name="hourglass-outline" size={15} color={luminousColors.secondary} />
            <Text style={[styles.metricPillText, { color: luminousColors.secondary }]}>
              {agenda.length > 0 ? `Menuju ${agenda[0].title}` : 'Siap Mulai Kencan #1 Bersama'}
            </Text>
          </View>
        </ScrollView>

        {/* Frosted Calendar Grid Card */}
        <View style={styles.calendarCard}>
          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((w) => (
              <Text key={w} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
            <Text style={[styles.weekdayText, { color: luminousColors.primary, fontWeight: '700' }]}>
              Min
            </Text>
          </View>

          {/* Days Matrix (April 2025: April 1 starts Tuesday) */}
          <View style={styles.daysMatrix}>
            {/* 1 Blank slot on Monday */}
            <View style={styles.daySlot} />

            {/* Days 1 to 30 systematically rendered */}
            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
              const isSelected = selectedDay === d;
              const isToday = d === new Date().getDate();
              const hasEvent = agenda.some((item) => item.day === d);

              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.daySlot,
                    isToday && styles.todaySlot,
                    isSelected && (hasEvent ? styles.specialSlotSelected : styles.daySlotSelected),
                    hasEvent && !isSelected && styles.heartDateSlot,
                  ]}
                  onPress={() => setSelectedDay(d)}
                  activeOpacity={0.75}>
                  <Text
                    style={
                      isToday
                        ? styles.todayNumText
                        : hasEvent
                          ? styles.heartDateNum
                          : styles.dayNumText
                    }>
                    {d}
                  </Text>
                  {isToday && <View style={styles.todayIndicatorDot} />}
                  {hasEvent && !isToday && (
                    <Ionicons name="heart" size={10} color={luminousColors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Countdown Glass Banner */}
        {agenda.length > 0 ? (
          <TouchableOpacity
            style={styles.countdownBanner}
            onPress={() => {
              if (agenda[0]?.id) {
                router.push({
                  pathname: '/dates/planner',
                  params: { dateId: agenda[0]?.id, title: agenda[0]?.title },
                } as any);
              }
            }}
            activeOpacity={0.85}>
            <View style={styles.countdownTextCol}>
              <View style={styles.countdownKickerRow}>
                <View style={styles.pingDot} />
                <Text style={styles.countdownKicker}>Hitung Mundur Kencan</Text>
              </View>
              <Text style={styles.countdownTitle}>{agenda[0]?.title}</Text>
              <Text style={styles.countdownSubtitle}>
                {agenda[0]?.badgeText || 'Jadwal kencan terkonfirmasi bersama'}
              </Text>
            </View>

            {/* Progress Ring Widget */}
            <View style={styles.progressRingWrapper}>
              <Svg width={54} height={54} viewBox="0 0 48 48">
                <Circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={luminousColors.surfaceContainerHigh}
                  strokeWidth={4}
                  fill="none"
                />
                <Circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={luminousColors.primary}
                  strokeWidth={4}
                  strokeDasharray="125.6"
                  strokeDashoffset="42.7"
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 24 24)"
                />
              </Svg>
              <View style={styles.progressRingCenter}>
                <Text style={styles.progressRingPercent}>66%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.countdownBanner, { padding: 18, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={styles.countdownKickerRow}>
                <View style={[styles.pingDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.countdownKicker}>Ruang Pasangan Bersih</Text>
              </View>
              <Text style={[styles.countdownTitle, { fontSize: 15 }]}>Rencanakan Kencan Pertama 🌱</Text>
              <Text style={[styles.countdownSubtitle, { fontSize: 12 }]}>
                Mulai isi kalender cinta kalian berdua dari hari pertama!
              </Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: luminousColors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 }}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.85}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>+ Buat Kencan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Agenda List Section ("Jadwal Momen Bersama") */}
        <View style={styles.agendaHeaderRow}>
          <Text style={styles.agendaSectionTitle}>Jadwal Momen Bersama</Text>
          <Text style={styles.agendaCountLabel}>
            {agenda.length > 0 ? `${agenda.length} Agenda Aktif` : '0 Agenda'}
          </Text>
        </View>

        <View style={styles.agendaListCol}>
          {agenda.length > 0 ? (
            agenda.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.agendaCard,
                  item.isMilestone && styles.milestoneAgendaCard,
                ]}
                onPress={() => {
                  router.push('/dates/planner' as any);
                }}
                activeOpacity={0.88}>
                <View style={styles.agendaCardHeader}>
                  <View style={styles.agendaDateThumb}>
                    <Text style={styles.agendaDayNumber}>{item.day}</Text>
                    <Text style={styles.agendaMonthText}>{item.monthText}</Text>
                  </View>

                  <View style={styles.agendaTitleCol}>
                    <View
                      style={[
                        styles.agendaCategoryPill,
                        {
                          backgroundColor:
                            item.categoryColor === luminousColors.primary
                              ? luminousColors.primaryFixed
                              : luminousColors.secondaryFixed,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.agendaCategoryText,
                          {
                            color:
                              item.categoryColor === luminousColors.primary
                                ? luminousColors.primary
                                : luminousColors.secondary,
                          },
                        ]}>
                        {item.categoryTag}
                      </Text>
                    </View>
                    <Text style={styles.agendaMainTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.agendaMoreBtn} activeOpacity={0.7}>
                    <Ionicons name="ellipsis-horizontal" size={18} color={luminousColors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                {/* Event Image Banner with Overlay */}
                <View style={styles.agendaImageWrapper}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.agendaImage}
                    resizeMode="cover"
                  />
                  <View style={styles.agendaImageScrim}>
                    <View style={styles.agendaBadgeRow}>
                      <Ionicons name={item.badgeIcon} size={14} color="#FFFFFF" />
                      <Text style={styles.agendaBadgeText}>{item.badgeText}</Text>
                    </View>
                  </View>
                </View>

                {/* Event Detail Chips */}
                <View style={styles.agendaChipsRow}>
                  {item.chips.map((chip, idx) => (
                    <View key={idx} style={styles.agendaDetailChip}>
                      <Ionicons name={chip.icon} size={14} color={chip.color} />
                      <Text style={styles.agendaDetailChipText}>{chip.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Secret Surprise Mystery Lock Box */}
                {item.lockedNote && (
                  <View style={styles.lockedNoteBox}>
                    <View style={styles.lockedNoteCircle}>
                      <Ionicons name="lock-closed" size={17} color={luminousColors.primary} />
                    </View>
                    <View style={styles.lockedNoteTextCol}>
                      <Text style={styles.lockedNoteTitle}>{item.lockedNote.title}</Text>
                      <Text style={styles.lockedNoteHint}>{item.lockedNote.hint}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.agendaCard, { padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF' }]}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFEBF0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="calendar-outline" size={26} color={luminousColors.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: luminousColors.onSurface, marginBottom: 6, textAlign: 'center' }}>
                Kalender Kencan Masih Bersih 🗓️
              </Text>
              <Text style={{ fontSize: 13, color: luminousColors.onSurfaceVariant, textAlign: 'center', marginBottom: 16, lineHeight: 19 }}>
                Belum ada agenda kencan bersama {partnerNames.partner}. Buat rencana kencan pertamamu seperti makan malam, nonton bioskop, atau jalan santai berdua!
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: luminousColors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.85}>
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>+ Buat Agenda Kencan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Space for bottom dock */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ---------------- Floating Action Button (+) ---------------- */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.88}
        accessibilityLabel="Tambah Kencan Baru">
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ---------------- Modal Buat Agenda Baru ---------------- */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rencanakan Kencan Baru</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={luminousColors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Judul Agenda</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: Sunset di Pantai Ancol"
              placeholderTextColor="#8F6F71"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Kategori Kencan</Text>
            <View style={styles.categorySelectRow}>
              {['Makan Malam Romantis', 'Jalan Santai', 'Bioskop'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catOption,
                    newCategory === cat && styles.catOptionActive,
                  ]}
                  onPress={() => setNewCategory(cat)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.catOptionText,
                      newCategory === cat && styles.catOptionTextActive,
                    ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateEvent}
                activeOpacity={0.85}>
                <Text style={styles.modalSubmitText}>Simpan ke Kalender</Text>
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
    gap: 10,
  },
  headerHeartCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
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
  headerActionBtn: {
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
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: luminousColors.onSurface,
    letterSpacing: -0.4,
  },
  specialMonthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: luminousColors.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  specialMonthText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  monthNavBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(185, 5, 56, 0.08)',
  },
  metricPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  calendarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 28,
    padding: 16,
    shadowColor: 'rgba(185, 5, 56, 0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(19, 27, 46, 0.45)',
    width: 38,
    textAlign: 'center',
  },
  daysMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 6,
  },
  daySlot: {
    width: 38,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySlotSelected: {
    backgroundColor: luminousColors.surfaceContainerHigh,
  },
  dayNumText: {
    fontSize: 13,
    color: luminousColors.onSurface,
    fontWeight: '500',
  },
  todaySlot: {
    backgroundColor: luminousColors.surfaceContainer,
  },
  todayNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: luminousColors.primary,
    marginTop: 2,
  },
  heartDateSlot: {
    backgroundColor: luminousColors.primaryFixed,
  },
  heartDateNum: {
    fontSize: 12,
    fontWeight: '800',
    color: luminousColors.onPrimaryFixed,
  },
  ticketDateSlot: {
    backgroundColor: luminousColors.secondaryFixed,
  },
  ticketDateNum: {
    fontSize: 12,
    fontWeight: '800',
    color: luminousColors.onSecondaryFixed,
  },
  annivDateSlot: {
    backgroundColor: luminousColors.primary,
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  annivDateNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  specialSlotSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  countdownBanner: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: 'rgba(185, 5, 56, 0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  countdownTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  countdownKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: luminousColors.primary,
  },
  countdownKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  countdownSubtitle: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  progressRingWrapper: {
    position: 'relative',
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingPercent: {
    fontSize: 11,
    fontWeight: '800',
    color: luminousColors.onSurface,
  },
  agendaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  agendaSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  agendaCountLabel: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '600',
  },
  agendaListCol: {
    gap: 16,
  },
  agendaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  milestoneAgendaCard: {
    borderWidth: 1,
    borderColor: 'rgba(185, 5, 56, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  agendaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agendaDateThumb: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendaDayNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: luminousColors.primary,
    lineHeight: 18,
  },
  agendaMonthText: {
    fontSize: 10,
    fontWeight: '700',
    color: luminousColors.primary,
    textTransform: 'uppercase',
  },
  agendaTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  agendaCategoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  agendaCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  agendaMainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  agendaMoreBtn: {
    padding: 4,
  },
  agendaImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
  },
  agendaImage: {
    width: '100%',
    height: '100%',
  },
  agendaImageScrim: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.35)',
    justifyContent: 'flex-end',
    padding: 10,
  },
  agendaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agendaBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  agendaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  agendaDetailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: luminousColors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  agendaDetailChipText: {
    fontSize: 11,
    color: luminousColors.onSurface,
    fontWeight: '500',
  },
  lockedNoteBox: {
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockedNoteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedNoteTextCol: {
    flex: 1,
  },
  lockedNoteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  lockedNoteHint: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
    marginTop: 1,
  },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: luminousColors.onSurface,
  },
  categorySelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: luminousColors.surfaceContainerLow,
  },
  catOptionActive: {
    backgroundColor: luminousColors.primary,
  },
  catOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  catOptionTextActive: {
    color: '#FFFFFF',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: luminousColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  modalSubmitBtn: {
    flex: 2,
    height: 44,
    borderRadius: 22,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
