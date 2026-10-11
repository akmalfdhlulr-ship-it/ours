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
import { colors } from '@ours/design-tokens';
import { api } from '@/services/api';
import {
  CalendarEventItem,
  DatePlanDetailResponse,
  AiDatePlanProposalDto,
  AiDateRecommendationDto,
} from '@ours/contracts';
import { Ionicons } from '@expo/vector-icons';
import { formatRupiah, formatTanggal, parseRupiahInput } from '@/utils/format';
import { OptionWheel, OptionWheelItem } from '@/components/free-components/OptionWheel';

const DATE_VIBE_OPTIONS: OptionWheelItem[] = [
  { id: 'dinner', label: 'Makan Malam Romantis', icon: 'restaurant-outline', color: '#F43F5E' },
  { id: 'cafe', label: 'Kafe & Obrolan Santai', icon: 'cafe-outline', color: '#EA580C' },
  { id: 'art', label: 'Pameran & Seni', icon: 'color-palette-outline', color: '#7C3AED' },
  { id: 'nature', label: 'Taman & Piknik', icon: 'leaf-outline', color: '#10B981' },
  { id: 'movie', label: 'Bioskop & Hiburan', icon: 'film-outline', color: '#2563EB' },
  { id: 'staycation', label: 'Santai di Rumah', icon: 'home-outline', color: '#EC4899' },
];

const DAYS_OF_WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function DatesAndCalendarScreen() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'planner'>('calendar');
  const [plans, setPlans] = useState<DatePlanDetailResponse[]>([]);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [recommendations, setRecommendations] = useState<AiDateRecommendationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Month navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Date Plan detail state
  const [selectedPlan, setSelectedPlan] = useState<DatePlanDetailResponse | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState('dinner');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [creating, setCreating] = useState(false);

  // New Stop Modal
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [stopTitle, setStopTitle] = useState('');
  const [stopDuration, setStopDuration] = useState('60');

  // AI Assistant Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiProposal, setAiProposal] = useState<AiDatePlanProposalDto | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, eventsRes, recsRes] = await Promise.all([
        api.dates.list().catch(() => []),
        api.calendar.list().catch(() => []),
        api.ai.recommendations().catch(() => []),
      ]);
      setPlans(plansRes);
      setEvents(eventsRes);
      setRecommendations(recsRes);

      if (plansRes.length > 0) {
        setSelectedPlan((prev) => (prev ? plansRes.find((p) => p.id === prev.id) || plansRes[0] : plansRes[0]));
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal memuat jadwal kencan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreatePlan = async () => {
    if (!newTitle.trim()) {
      setStatusMessage('Judul kencan tidak boleh kosong');
      return;
    }
    setCreating(true);
    try {
      const budgetNum = newBudget ? parseRupiahInput(newBudget) : undefined;
      const created = await api.dates.create({
        title: newTitle.trim(),
        plannedDate: newDate.trim() || undefined,
        budgetAmount: budgetNum,
      });
      setNewTitle('');
      setNewDate('');
      setNewBudget('');
      setShowCreateModal(false);
      setStatusMessage('Rencana kencan berhasil dibuat!');
      setSelectedPlan(created);
      setActiveTab('planner');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal membuat rencana kencan');
    } finally {
      setCreating(false);
    }
  };

  const handleAddStopToPlan = async () => {
    if (!selectedPlan || !stopTitle.trim()) return;
    try {
      const updated = await api.dates.addStop(selectedPlan.id, {
        title: stopTitle.trim(),
        sortOrder: (selectedPlan.stops?.length || 0) + 1,
        estimatedDurationMin: parseInt(stopDuration, 10) || 60,
      });
      setSelectedPlan(updated);
      setStopTitle('');
      setShowAddStopModal(false);
      setStatusMessage('Titik singgah berhasil ditambahkan!');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menambahkan titik kencan');
    }
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAi(true);
    try {
      const proposal = await api.ai.planDate({ prompt: aiPrompt.trim() });
      setAiProposal(proposal);
    } catch (err: any) {
      setStatusMessage(err?.message || 'Perancangan AI gagal');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAdoptAiProposal = async () => {
    if (!aiProposal) return;
    try {
      const created = await api.dates.create({
        title: aiProposal.title,
        plannedDate: aiProposal.suggestedDate,
        budgetAmount: aiProposal.estimatedBudgetMinorUnits,
      });

      for (let i = 0; i < (aiProposal.stops?.length || 0); i++) {
        const stop = aiProposal.stops[i];
        await api.dates.addStop(created.id, {
          title: `${stop.title} - ${stop.placeName}`,
          notes: stop.notes,
          sortOrder: i + 1,
          estimatedDurationMin: stop.estimatedDurationMin || 60,
        });
      }

      setShowAiModal(false);
      setAiProposal(null);
      setAiPrompt('');
      setSelectedPlan(created);
      setStatusMessage(`Rencana "${aiProposal.title}" berhasil diadopsi!`);
      setActiveTab('planner');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal mengadopsi rencana AI');
    }
  };

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Filter plans/events for selected day
  const plansOnSelectedDay = plans.filter((p) => {
    if (!p.plannedDate) return false;
    const d = new Date(p.plannedDate);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
  });

  const eventsOnSelectedDay = events.filter((e) => {
    const d = new Date(e.startAt);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
  });

  const getDaysWithAgenda = (): Set<number> => {
    const set = new Set<number>();
    plans.forEach((p) => {
      if (p.plannedDate) {
        const d = new Date(p.plannedDate);
        if (d.getFullYear() === year && d.getMonth() === month) {
          set.add(d.getDate());
        }
      }
    });
    events.forEach((e) => {
      const d = new Date(e.startAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });
    return set;
  };

  const daysWithAgenda = getDaysWithAgenda();

  return (
    <View style={styles.container}>
      {/* 1. Header with Mode Toggle & Profile Avatar */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.headerHeartCircle}>
              <Ionicons name="heart" size={20} color="#F43F5E" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Kalender</Text>
              <Text style={styles.headerSubtitle}>Momen istimewa berdua</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => setStatusMessage('Pengingat jadwal kencan aktif')}
              activeOpacity={0.75}>
              <Ionicons name="notifications-outline" size={18} color="#4B5563" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => setShowAiModal(true)}
              activeOpacity={0.85}>
              <Ionicons name="sparkles" size={14} color={colors.primaryBlue} />
              <Text style={styles.aiButtonText}>AI</Text>
            </TouchableOpacity>

            <View style={styles.headerDsAvatar}>
              <Text style={styles.headerDsAvatarText}>D • S</Text>
            </View>
          </View>
        </View>

        <View style={styles.segmentedBar}>
          <TouchableOpacity
            style={[styles.segmentItem, activeTab === 'calendar' && styles.segmentItemActive]}
            onPress={() => setActiveTab('calendar')}
            activeOpacity={0.85}>
            <Ionicons
              name="calendar"
              size={15}
              color={activeTab === 'calendar' ? '#FFFFFF' : '#4B5563'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.segmentText, activeTab === 'calendar' && styles.segmentTextActive]}>
              Kalender Kita
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentItem, activeTab === 'planner' && styles.segmentItemActive]}
            onPress={() => setActiveTab('planner')}
            activeOpacity={0.85}>
            <Ionicons
              name="map"
              size={15}
              color={activeTab === 'planner' ? '#FFFFFF' : '#4B5563'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.segmentText, activeTab === 'planner' && styles.segmentTextActive]}>
              Rencana Kencan
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast */}
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
          <Text style={styles.loadingText}>Memuat jadwal kencan...</Text>
        </View>
      ) : activeTab === 'calendar' ? (
        /* ================= CALENDAR VIEW (Matching Image 3: Layar 7) ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          {/* Calendar Month Box Card */}
          <View style={styles.calendarCardWrapper}>
            {/* Month Header Navigation */}
            <View style={styles.calendarMonthHeader}>
              <TouchableOpacity style={styles.monthNavButton} onPress={prevMonth} activeOpacity={0.75}>
                <Ionicons name="chevron-back" size={18} color="#4B5563" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {monthName} {year}
              </Text>
              <TouchableOpacity style={styles.monthNavButton} onPress={nextMonth} activeOpacity={0.75}>
                <Ionicons name="chevron-forward" size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Days of Week */}
            <View style={styles.weekDaysRow}>
              {DAYS_OF_WEEK.map((d, idx) => (
                <Text
                  key={d}
                  style={[
                    styles.weekDayLabel,
                    (idx === 5 || idx === 6) && styles.weekDayLabelWeekend,
                  ]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Day Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((day) => {
                const isSelected = selectedDay === day;
                const isMilestone = day === 30;
                const isEventDay = day === 20 || day === 24 || day === 26 || daysWithAgenda.has(day);

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCell,
                      isMilestone
                        ? styles.dayCellMilestone
                        : isEventDay
                        ? styles.dayCellEvent
                        : isSelected
                        ? styles.dayCellSelected
                        : null,
                    ]}
                    onPress={() => setSelectedDay(day)}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.dayNumberText,
                        (isMilestone || isEventDay)
                          ? styles.dayNumberTextWhite
                          : isSelected
                          ? styles.dayNumberTextSelected
                          : null,
                      ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Filter Pills inside Calendar Card */}
            <View style={styles.calendarFilterPillsRow}>
              <View style={styles.calendarPillEventCount}>
                <View style={styles.calendarPillDot} />
                <Text style={styles.calendarPillEventText}>
                  {3 + plans.length} Agenda Berdua
                </Text>
              </View>

              <View style={styles.calendarPillCategory}>
                <Ionicons name="options-outline" size={13} color="#4B5563" />
                <Text style={styles.calendarPillCategoryText}>Kategori: Semua</Text>
              </View>

              <TouchableOpacity
                style={styles.calendarPillBell}
                onPress={() => setStatusMessage('Pengingat agenda aktif')}
                activeOpacity={0.7}>
                <Ionicons name="notifications-outline" size={14} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Agenda Terdekat */}
          <View style={styles.agendaSection}>
            <View style={styles.agendaHeaderRow}>
              <Text style={styles.agendaSectionTitle}>Agenda Terdekat</Text>
              <Text style={styles.agendaSectionMonthLabel}>{monthName} {year}</Text>
            </View>

            {/* Agenda 1: Makan malam di ORO (20 SAB) */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineDateCol}>
                <Text style={styles.timelineDateNumRose}>20</Text>
                <Text style={styles.timelineDateDayText}>SAB</Text>
                <View style={styles.timelineLineRose} />
              </View>

              <View style={styles.timelineCard}>
                <View style={styles.timelineCardTopRow}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=160&q=80',
                    }}
                    style={styles.timelineThumbImage}
                  />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={styles.timelinePillRose}>
                      <Text style={styles.timelinePillTextRose}>Kencan • Sabtu, 20 Apr</Text>
                    </View>
                    <Text style={styles.timelineTitleText}>Makan malam di ORO</Text>
                    <Text style={styles.timelineSubText}>🕒 19.00 – 21.00 • 📍 Jakarta Pusat</Text>
                  </View>
                </View>
                <View style={styles.timelineFooterRow}>
                  <Text style={styles.timelineFooterNote}>🍴 Reservasi Terkonfirmasi (Meja 4)</Text>
                  <Text style={styles.timelineFooterActionRose}>Detail →</Text>
                </View>
              </View>
            </View>

            {/* Agenda 2: Nonton konser bareng (24 RAB) */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineDateCol}>
                <Text style={styles.timelineDateNumDark}>24</Text>
                <Text style={styles.timelineDateDayText}>RAB</Text>
                <View style={styles.timelineLineGray} />
              </View>

              <View style={styles.timelineCard}>
                <View style={styles.timelineCardTopRow}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=160&q=80',
                    }}
                    style={styles.timelineThumbImage}
                  />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={styles.timelinePillBlue}>
                      <Text style={styles.timelinePillTextBlue}>Hiburan • Rabu, 24 Apr</Text>
                    </View>
                    <Text style={styles.timelineTitleText}>Nonton konser bareng</Text>
                    <Text style={styles.timelineSubText}>🕒 19.00 – 22.00 • 📍 GBK Senayan</Text>
                  </View>
                </View>
                <View style={styles.timelineFooterRow}>
                  <Text style={styles.timelineFooterNote}>🎟️ 2 e-Tiket CAT 2 (Siap)</Text>
                  <Text style={styles.timelineFooterActionBlue}>Tiket →</Text>
                </View>
              </View>
            </View>

            {/* Agenda 3: Milestone Anniversary 1 Tahun (30 SEL) */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineDateCol}>
                <Text style={styles.timelineDateNumRose}>30</Text>
                <Text style={styles.timelineDateDayText}>SEL</Text>
              </View>

              <View style={styles.timelineMilestoneCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.timelineMilestoneBadge}>
                      <Text style={styles.timelineMilestoneBadgeText}>❤️ Milestone • Selasa, 30 Apr</Text>
                    </View>
                    <Text style={styles.timelineMilestoneTitle}>Anniversary 1 Tahun</Text>
                    <Text style={styles.timelineMilestoneSub}>🎂 Sepanjang hari • Perayaan</Text>
                  </View>
                  <View style={styles.timelineMilestoneIconCircle}>
                    <Text style={{ fontSize: 22 }}>🎁</Text>
                  </View>
                </View>
                <View style={styles.timelineMilestoneFooterRow}>
                  <Text style={styles.timelineMilestoneFooterNote}>💌 Tukar Surat Kasih & Kado</Text>
                  <Text style={styles.timelineMilestoneFooterAction}>Hitung Mundur</Text>
                </View>
              </View>
            </View>

            {/* User dynamic plans */}
            {plans.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.agendaCard, { marginTop: 8 }]}
                onPress={() => {
                  setSelectedPlan(p);
                  setActiveTab('planner');
                }}
                activeOpacity={0.88}>
                <View style={styles.agendaDayBadge}>
                  <Ionicons name="heart" size={16} color="#F43F5E" />
                </View>
                <View style={styles.agendaBodyCol}>
                  <Text style={styles.agendaTitle}>{p.title}</Text>
                  <View style={styles.agendaMetaRow}>
                    <Ionicons name="time-outline" size={13} color="#6B7280" />
                    <Text style={styles.agendaMetaText}>
                      {p.plannedDate ? formatTanggal(p.plannedDate) : 'Hari ini'}
                    </Text>
                    {p.budgetAmount ? (
                      <>
                        <Text style={styles.agendaDotDivider}>•</Text>
                        <Text style={styles.agendaMetaText}>{formatRupiah(p.budgetAmount)}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Banner Countdown Footer */}
          <View style={styles.countdownBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={styles.countdownIconCircle}>
                <Text style={{ fontSize: 18 }}>⏳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.countdownTitleText}>10 Hari Menuju Kencan Berikutnya</Text>
                <Text style={styles.countdownSubText}>Makan malam di ORO Italian Restaurant</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#F43F5E" />
          </View>
        </ScrollView>
      ) : (
        /* ================= PLANNER VIEW ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          {selectedPlan ? (
            <>
              {/* Hero Plan Card */}
              <View style={styles.plannerHeroCard}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80',
                  }}
                  style={styles.plannerHeroImage}
                  resizeMode="cover"
                />
                <View style={styles.plannerHeroOverlay} />
                <View style={styles.plannerHeroContent}>
                  <View style={styles.plannerBadge}>
                    <Ionicons name="heart" size={12} color="#F43F5E" />
                    <Text style={styles.plannerBadgeText}>Rencana Pilihan</Text>
                  </View>
                  <Text style={styles.plannerTitle}>{selectedPlan.title}</Text>
                  <View style={styles.plannerHeroMetaRow}>
                    <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.plannerHeroMetaText}>
                      {selectedPlan.plannedDate ? formatTanggal(selectedPlan.plannedDate) : 'Belum Dijadwalkan'}
                    </Text>
                    <Text style={styles.plannerHeroMetaText}>•</Text>
                    <Text style={styles.plannerHeroMetaText}>
                      {selectedPlan.stops?.length || 0} Titik Kencan
                    </Text>
                    {selectedPlan.budgetAmount ? (
                      <>
                        <Text style={styles.plannerHeroMetaText}>•</Text>
                        <Text style={styles.plannerHeroMetaText}>
                          {formatRupiah(selectedPlan.budgetAmount)}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Timeline Stops Section */}
              <View style={styles.timelineSection}>
                <View style={styles.timelineHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>Rute & Titik Kencan</Text>
                  <TouchableOpacity
                    onPress={() => setShowAddStopModal(true)}
                    style={styles.addStopSmallBtn}>
                    <Ionicons name="add" size={16} color={colors.primaryBlue} />
                    <Text style={styles.addStopSmallText}>Tambah Titik</Text>
                  </TouchableOpacity>
                </View>

                {selectedPlan.stops && selectedPlan.stops.length > 0 ? (
                  <View style={styles.timelineContainer}>
                    {selectedPlan.stops.map((stop, idx) => {
                      const isLast = idx === selectedPlan.stops.length - 1;
                      return (
                        <View key={stop.id} style={styles.timelineItemRow}>
                          <View style={styles.timelineTimeCol}>
                            <Text style={styles.timelineTimeText}>#{stop.sortOrder || idx + 1}</Text>
                          </View>
                          <View style={styles.timelineNodeCol}>
                            <View
                              style={[
                                styles.timelineNodeCircle,
                                idx === 0 && { backgroundColor: '#F43F5E' },
                              ]}
                            />
                            {!isLast && <View style={styles.timelineLine} />}
                          </View>
                          <View style={styles.timelineContentCard}>
                            <View style={styles.timelineStopCol}>
                              <Text style={styles.timelineStopTitle}>{stop.title}</Text>
                              {stop.notes && <Text style={styles.timelineStopSub}>{stop.notes}</Text>}
                              <Text style={styles.timelineStopDuration}>
                                Estimasi {stop.estimatedDurationMin || 60} menit
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyStopsCard}>
                    <Ionicons name="map-outline" size={28} color="#9CA3AF" style={{ marginBottom: 6 }} />
                    <Text style={styles.emptyStopsTitle}>Belum ada titik singgah</Text>
                    <Text style={styles.emptyStopsSub}>
                      Tambahkan restoran, kafe, atau taman untuk menyusun alur kencan berdua.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyStopsActionBtn}
                      onPress={() => setShowAddStopModal(true)}>
                      <Text style={styles.emptyStopsActionText}>+ Tambah Titik Pertama</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Budget Estimation Card */}
              {selectedPlan.budgetAmount ? (
                <View style={styles.budgetEstimateCard}>
                  <View style={styles.budgetIconCircle}>
                    <Ionicons name="wallet-outline" size={20} color="#2563EB" />
                  </View>
                  <View style={styles.budgetCol}>
                    <Text style={styles.budgetSub}>Anggaran Kencan</Text>
                    <Text style={styles.budgetAmount}>
                      {formatRupiah(selectedPlan.budgetAmount)}
                    </Text>
                    <Text style={styles.budgetTarget}>Estimasi total untuk berdua</Text>
                  </View>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.emptyPlannerContainer}>
              <Ionicons name="heart-circle-outline" size={54} color="#F43F5E" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyPlannerTitle}>Belum Ada Rencana Kencan</Text>
              <Text style={styles.emptyPlannerSub}>
                Rancang momen berkesan bersama pasangan dengan menambahkan kencan baru atau buat rencana instan dengan Asisten AI.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={styles.createPlanPrimaryBtn}
                  onPress={() => setShowCreateModal(true)}>
                  <Text style={styles.createPlanPrimaryBtnText}>+ Rancang Kencan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createPlanSecondaryBtn}
                  onPress={() => setShowAiModal(true)}>
                  <Ionicons name="sparkles" size={15} color={colors.primaryBlue} />
                  <Text style={styles.createPlanSecondaryBtnText}>Tanya AI</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.88}>
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal Rancang Kencan Baru */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Rancang Kencan Baru</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* OptionWheel for Date Vibe Selection */}
            <Text style={styles.inputSectionLabel}>Pilih Suasana Kencan</Text>
            <OptionWheel
              options={DATE_VIBE_OPTIONS}
              selectedId={selectedVibe}
              onSelect={(id) => {
                setSelectedVibe(id);
                const vibe = DATE_VIBE_OPTIONS.find((v) => v.id === id);
                if (vibe && !newTitle.trim()) {
                  setNewTitle(vibe.label);
                }
              }}
            />

            <TextInput
              style={styles.inputField}
              placeholder="Judul Kencan (contoh: Makan Malam di Menteng)"
              placeholderTextColor="#9CA3AF"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.inputField}
              placeholder="Tanggal (YYYY-MM-DD, contoh: 2026-10-25)"
              placeholderTextColor="#9CA3AF"
              value={newDate}
              onChangeText={setNewDate}
            />

            <TextInput
              style={styles.inputField}
              placeholder="Estimasi Budget (contoh: 500.000)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={newBudget}
              onChangeText={setNewBudget}
            />

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleCreatePlan}
              disabled={creating}
              activeOpacity={0.88}>
              {creating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Simpan Rencana</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah Titik Singgah */}
      <Modal visible={showAddStopModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Tambah Titik Rute</Text>
              <TouchableOpacity onPress={() => setShowAddStopModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.inputField}
              placeholder="Nama Lokasi / Aktivitas (contoh: Kafe Senja)"
              placeholderTextColor="#9CA3AF"
              value={stopTitle}
              onChangeText={setStopTitle}
            />

            <TextInput
              style={styles.inputField}
              placeholder="Estimasi Durasi (menit, contoh: 60)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={stopDuration}
              onChangeText={setStopDuration}
            />

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleAddStopToPlan}
              activeOpacity={0.88}>
              <Text style={styles.modalSubmitButtonText}>Tambahkan ke Rute</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal AI Planner */}
      <Modal visible={showAiModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={18} color={colors.primaryBlue} />
                <Text style={styles.modalTitle}>Asisten AI Kencan</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.inputField}
              placeholder="Ingin kencan seperti apa? (contoh: kencan sore santai di Jakarta Pusat budget 500rb)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={aiPrompt}
              onChangeText={setAiPrompt}
            />

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleGenerateAi}
              disabled={generatingAi}
              activeOpacity={0.88}>
              {generatingAi ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Buat Rekomendasi Rute</Text>
              )}
            </TouchableOpacity>

            {aiProposal && (
              <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.aiResultTitle}>{aiProposal.title}</Text>
                <Text style={styles.aiResultSub}>
                  Estimasi Budget: {formatRupiah(aiProposal.estimatedBudgetMinorUnits)}
                </Text>

                {aiProposal.stops?.map((s, idx) => (
                  <View key={idx} style={styles.aiStopRow}>
                    <Text style={styles.aiStopIndex}>{idx + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiStopName}>{s.placeName || s.title}</Text>
                      {s.notes && <Text style={styles.aiStopNotes}>{s.notes}</Text>}
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.modalSubmitButton, { backgroundColor: '#10B981', marginTop: 12 }]}
                  onPress={handleAdoptAiProposal}
                  activeOpacity={0.88}>
                  <Text style={styles.modalSubmitButtonText}>Adopsi Rencana Ini</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.calendarFabBtn}
        onPress={() => {
          setNewDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`);
          setShowCreateModal(true);
        }}
        activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segmentItemActive: {
    backgroundColor: '#1F2937',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  calendarMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarMonthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  dayCell: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    borderRadius: 12,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: '#F43F5E',
  },
  dayCellHasAgenda: {
    backgroundColor: '#FEE2E2',
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  dayNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayNumberTextAgenda: {
    color: '#F43F5E',
    fontWeight: '700',
  },
  agendaDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F43F5E',
  },
  agendaSection: {
    gap: 10,
  },
  agendaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  agendaSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  addAgendaLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  agendaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  agendaDayBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  agendaBodyCol: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 3,
  },
  agendaMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  agendaMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  agendaDotDivider: {
    fontSize: 10,
    color: '#9CA3AF',
    marginHorizontal: 2,
  },
  emptyAgendaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  emptyAgendaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyAgendaSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 260,
  },
  emptyAgendaActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyAgendaActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  plannerHeroCard: {
    width: '100%',
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  plannerHeroImage: {
    width: '100%',
    height: '100%',
  },
  plannerHeroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  plannerHeroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  plannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 6,
  },
  plannerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F43F5E',
  },
  plannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  plannerHeroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plannerHeroMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  timelineSection: {
    marginBottom: 20,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  addStopSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addStopSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  timelineContainer: {
    gap: 12,
  },
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineTimeCol: {
    width: 36,
    paddingTop: 8,
  },
  timelineTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  timelineNodeCol: {
    width: 24,
    alignItems: 'center',
    paddingTop: 10,
    alignSelf: 'stretch',
  },
  timelineNodeCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryBlue,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  timelineContentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 6,
  },
  timelineStopCol: {
    flex: 1,
  },
  timelineStopTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  timelineStopSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  timelineStopDuration: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryBlue,
    marginTop: 4,
  },
  emptyStopsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStopsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyStopsSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStopsActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },
  emptyStopsActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  budgetEstimateCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCol: {
    flex: 1,
  },
  budgetSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 1,
  },
  budgetTarget: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  emptyPlannerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 20,
  },
  emptyPlannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptyPlannerSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },
  createPlanPrimaryBtn: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  createPlanPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createPlanSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  createPlanSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  fabButton: {
    position: 'absolute',
    bottom: 95,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
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
  inputSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  inputField: {
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
  aiResultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  aiResultSub: {
    fontSize: 13,
    color: colors.primaryBlue,
    fontWeight: '600',
    marginBottom: 10,
  },
  aiStopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  aiStopIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  aiStopName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  aiStopNotes: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Kalender Pasangan (Matching Image 3: Layar 7)
  headerHeartCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerDsAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  headerDsAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  calendarCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  weekDayLabelWeekend: {
    color: '#F43F5E',
    fontWeight: '700',
  },
  dayCellMilestone: {
    backgroundColor: '#BE123C',
    shadowColor: '#BE123C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCellEvent: {
    backgroundColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  dayNumberTextWhite: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarFilterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  calendarPillEventCount: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E11D48',
  },
  calendarPillEventText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE123C',
  },
  calendarPillCategory: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  calendarPillCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  calendarPillBell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  agendaSectionMonthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  timelineDateCol: {
    width: 38,
    alignItems: 'center',
    paddingTop: 2,
  },
  timelineDateNumRose: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E11D48',
  },
  timelineDateNumDark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  timelineDateDayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 1,
  },
  timelineLineRose: {
    width: 2,
    height: 60,
    backgroundColor: '#FECDD3',
    marginTop: 6,
    borderRadius: 1,
  },
  timelineLineGray: {
    width: 2,
    height: 60,
    backgroundColor: '#E2E8F0',
    marginTop: 6,
    borderRadius: 1,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  timelineCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineThumbImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  timelinePillRose: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  timelinePillTextRose: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
  },
  timelinePillBlue: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  timelinePillTextBlue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  timelineTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  timelineSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  timelineFooterRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineFooterNote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  timelineFooterActionRose: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
  },
  timelineFooterActionBlue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  timelineMilestoneCard: {
    flex: 1,
    backgroundColor: '#FFF1F2',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  timelineMilestoneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E11D48',
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderRadius: 999,
    marginBottom: 6,
  },
  timelineMilestoneBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineMilestoneTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  timelineMilestoneSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  timelineMilestoneIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineMilestoneFooterRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFE4E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineMilestoneFooterNote: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9F1239',
  },
  timelineMilestoneFooterAction: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
  },
  countdownBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginTop: 4,
    marginBottom: 20,
  },
  countdownIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  countdownSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  calendarFabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
  },
});
