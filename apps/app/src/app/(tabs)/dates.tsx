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
      {/* 1. Header with Mode Toggle */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>
              {activeTab === 'calendar' ? 'Kalender Pasangan' : 'Rencana Kencan'}
            </Text>
            <Text style={styles.headerSubtitle}>Kelola momen istimewa dan agenda berdua</Text>
          </View>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => setShowAiModal(true)}
            activeOpacity={0.85}>
            <Ionicons name="sparkles" size={14} color={colors.primaryBlue} />
            <Text style={styles.aiButtonText}>AI Planner</Text>
          </TouchableOpacity>
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
        /* ================= CALENDAR VIEW ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          {/* Month Header Navigation */}
          <View style={styles.calendarMonthHeader}>
            <TouchableOpacity style={styles.monthNavButton} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={18} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.calendarMonthTitle}>{monthName}</Text>
            <TouchableOpacity style={styles.monthNavButton} onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={18} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View style={styles.weekDaysRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={styles.weekDayLabel}>
                {d}
              </Text>
            ))}
          </View>

          {/* Day Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day) => {
              const isSelected = selectedDay === day;
              const hasAgenda = daysWithAgenda.has(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    hasAgenda && !isSelected && styles.dayCellHasAgenda,
                  ]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.dayNumberText,
                      isSelected && styles.dayNumberTextSelected,
                      hasAgenda && !isSelected && styles.dayNumberTextAgenda,
                    ]}>
                    {day}
                  </Text>
                  {hasAgenda && (
                    <View
                      style={[
                        styles.agendaDot,
                        isSelected && { backgroundColor: '#FFFFFF' },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Agenda on Selected Day */}
          <View style={styles.agendaSection}>
            <View style={styles.agendaHeaderRow}>
              <Text style={styles.agendaSectionTitle}>
                Agenda {selectedDay} {monthName}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setNewDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`);
                  setShowCreateModal(true);
                }}>
                <Text style={styles.addAgendaLink}>+ Tambah</Text>
              </TouchableOpacity>
            </View>

            {plansOnSelectedDay.length > 0 || eventsOnSelectedDay.length > 0 ? (
              <>
                {plansOnSelectedDay.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.agendaCard}
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

                {eventsOnSelectedDay.map((e) => (
                  <View key={e.id} style={styles.agendaCard}>
                    <View style={[styles.agendaDayBadge, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                    </View>
                    <View style={styles.agendaBodyCol}>
                      <Text style={styles.agendaTitle}>{e.title}</Text>
                      <View style={styles.agendaMetaRow}>
                        <Ionicons name="time-outline" size={13} color="#6B7280" />
                        <Text style={styles.agendaMetaText}>
                          {e.allDay ? 'Sepanjang hari' : formatTanggal(e.startAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyAgendaCard}>
                <Ionicons name="heart-dislike-outline" size={32} color="#9CA3AF" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyAgendaTitle}>Belum ada kencan di tanggal ini</Text>
                <Text style={styles.emptyAgendaSub}>
                  Pilih tanggal untuk melihat jadwal atau jadwalkan kencan baru berdua.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAgendaActionBtn}
                  onPress={() => {
                    setNewDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`);
                    setShowCreateModal(true);
                  }}>
                  <Ionicons name="add-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.emptyAgendaActionText}>Jadwalkan Kencan</Text>
                </TouchableOpacity>
              </View>
            )}
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
});
