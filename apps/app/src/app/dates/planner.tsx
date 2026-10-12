import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { luminousColors } from '@ours/design-tokens';
import { useCoupleData, SharedDatePlan } from '@/context/couple-data-context';
import { api } from '@/services/api';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export default function DatePlannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    dateId?: string;
    venueName?: string;
    location?: string;
    category?: string;
    title?: string;
  }>();

  const { dates, addDatePlan, partnerNames } = useCoupleData();

  // Find existing date if dateId is passed
  const existingPlan = dates.find((d) => d.id === params.dateId) || (dates.length > 0 && !params.venueName ? dates[0] : null);

  // Form states
  const [title, setTitle] = useState<string>(
    existingPlan?.title || params.title || (params.venueName ? `Kencan di ${params.venueName}` : 'Makan Malam & Jalan Santai')
  );
  const [dateText, setDateText] = useState<string>(
    existingPlan?.date || new Date().toISOString().split('T')[0]
  );
  const [timeText, setTimeText] = useState<string>(
    existingPlan?.time || '19.00 WIB'
  );
  const [venueName, setVenueName] = useState<string>(
    existingPlan?.venueName || params.venueName || 'Spot Kencan Pilihan'
  );
  const [locationName, setLocationName] = useState<string>(
    existingPlan?.location || params.location || 'Jakarta'
  );
  const [budgetEst, setBudgetEst] = useState<number>(
    existingPlan?.estimatedBudget || 300000
  );

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', label: 'Konfirmasi reservasi / tiket', checked: false },
    { id: '2', label: 'Pilih pakaian senada berdua', checked: false },
    { id: '3', label: 'Siapkan kamera untuk abadikan momen', checked: true },
  ]);
  const [newChecklistText, setNewChecklistText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      label: newChecklistText.trim(),
      checked: false,
    };
    setChecklist((prev) => [...prev, newItem]);
    setNewChecklistText('');
  };

  const handleSavePlan = async () => {
    if (!title.trim()) {
      Alert.alert('Judul Wajib Diisi', 'Berikan nama untuk rencana kencan kalian.');
      return;
    }

    addDatePlan({
      title: title.trim(),
      date: dateText,
      time: timeText,
      venueName: venueName.trim(),
      location: locationName.trim(),
      estimatedBudget: budgetEst,
      status: 'upcoming',
      notes: `Rencana kencan bersama ${partnerNames.partner} 💕`,
    });

    // Optionally call backend date plan API
    try {
      await api.dates.create({
        title: title.trim(),
        plannedDate: dateText,
        description: `Rencana kencan bersama ${partnerNames.partner}`,
        budgetAmount: budgetEst,
      });
    } catch {
      // Offline fallback persisted in CoupleDataContext
    }

    setToastMessage('Tersimpan di Kalender Pasangan! 🗓️');
    setTimeout(() => {
      setToastMessage(null);
      router.push('/(tabs)/dates');
    }, 1500);
  };

  const handleStartNavigation = () => {
    router.push('/explore/map' as any);
  };

  const checkedCount = checklist.filter((item) => item.checked).length;

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            Rencana Kencan
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleSavePlan}
            activeOpacity={0.75}
            accessibilityLabel="Simpan">
            <Ionicons name="checkmark-done" size={20} color={luminousColors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------------- Main Scroll View ---------------- */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Sync Indicator & Partner Pill */}
        <View style={styles.syncRow}>
          <View style={styles.syncPill}>
            <Ionicons name="heart" size={15} color={luminousColors.primary} />
            <Text style={styles.syncText}>
              Kencan Berdua: {partnerNames.user} &amp; {partnerNames.partner}
            </Text>
          </View>

          <View style={styles.kencanBadge}>
            <Ionicons name="calendar-outline" size={13} color={luminousColors.primary} />
            <Text style={styles.kencanBadgeText}>
              {existingPlan ? 'Jadwal Aktif' : 'Draft Baru'}
            </Text>
          </View>
        </View>

        {/* Card Ringkasan Kencan Kaca */}
        <View style={styles.glassSummaryCard}>
          <View style={styles.dateEventPill}>
            <Ionicons name="calendar" size={13} color={luminousColors.onPrimaryFixedVariant} />
            <Text style={styles.dateEventText}>{dateText} • {timeText}</Text>
          </View>

          <Text style={styles.summaryTitle}>{title}</Text>

          {/* Quick Stats Strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={20} color={luminousColors.primary} />
              <Text style={styles.statLabel}>Waktu</Text>
              <Text style={styles.statVal}>{timeText}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="location-outline" size={20} color={luminousColors.secondary} />
              <Text style={styles.statLabel}>Lokasi</Text>
              <Text style={styles.statVal} numberOfLines={1}>{locationName}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="wallet-outline" size={20} color={luminousColors.tertiary} />
              <Text style={styles.statLabel}>Estimasi</Text>
              <Text style={styles.statVal}>Rp {budgetEst.toLocaleString('id-ID')}</Text>
            </View>
          </View>
        </View>

        {/* Edit / Detail Form Fields */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>DETAIL RENCANA</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Judul Kencan</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Contoh: Makan Malam & Jalan Sore"
              placeholderTextColor={luminousColors.outline}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Tanggal (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={dateText}
                onChangeText={setDateText}
                placeholder="2025-04-20"
                placeholderTextColor={luminousColors.outline}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Jam</Text>
              <TextInput
                style={styles.textInput}
                value={timeText}
                onChangeText={setTimeText}
                placeholder="19.00 WIB"
                placeholderTextColor={luminousColors.outline}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Tempat / Destinasi</Text>
            <TextInput
              style={styles.textInput}
              value={venueName}
              onChangeText={setVenueName}
              placeholder="Contoh: Plataran Menteng"
              placeholderTextColor={luminousColors.outline}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Alamat / Kota</Text>
            <TextInput
              style={styles.textInput}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Contoh: Menteng, Jakarta Pusat"
              placeholderTextColor={luminousColors.outline}
            />
          </View>
        </View>

        {/* Checklist Persiapan Berdua */}
        <View style={styles.checklistCard}>
          <View style={styles.checklistHeader}>
            <View style={styles.checklistTitleLeft}>
              <Ionicons name="checkbox-outline" size={18} color={luminousColors.primary} />
              <Text style={styles.checklistMainTitle}>Perlengkapan &amp; To-Do Kencan</Text>
            </View>
            <Text style={styles.checklistCountLabel}>
              {checkedCount}/{checklist.length} Siap
            </Text>
          </View>

          <View style={styles.checklistItemsCol}>
            {checklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checkRow}
                onPress={() => toggleChecklist(item.id)}
                activeOpacity={0.75}>
                <Ionicons
                  name={item.checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={item.checked ? luminousColors.primary : luminousColors.onSurfaceVariant}
                />
                <Text style={[styles.checkLabel, item.checked && styles.checkLabelChecked]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add Item Row */}
          <View style={styles.addChecklistRow}>
            <TextInput
              style={styles.addChecklistInput}
              placeholder="+ Tambah perlengkapan baru..."
              placeholderTextColor={luminousColors.outline}
              value={newChecklistText}
              onChangeText={setNewChecklistText}
              onSubmitEditing={handleAddChecklistItem}
              returnKeyType="done"
            />
            {newChecklistText.trim().length > 0 && (
              <TouchableOpacity
                style={styles.addChecklistBtn}
                onPress={handleAddChecklistItem}
                activeOpacity={0.8}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Space for bottom dock */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ---------------- Toast Notification ---------------- */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={styles.toastBannerText}>{toastMessage}</Text>
        </View>
      )}

      {/* ---------------- Floating Bottom Action Dock ---------------- */}
      <View style={styles.bottomDockWrapper}>
        <View style={styles.bottomDock}>
          <TouchableOpacity
            style={styles.calendarFab}
            onPress={handleStartNavigation}
            activeOpacity={0.85}
            accessibilityLabel="Buka Peta">
            <Ionicons name="map-outline" size={22} color={luminousColors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navigasiBtn}
            onPress={handleSavePlan}
            activeOpacity={0.88}>
            <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            <Text style={styles.navigasiBtnText}>Simpan ke Kalender Cinta</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: 'rgba(250, 248, 255, 0.94)',
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBF0',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  syncText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '600',
  },
  kencanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 218, 219, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  kencanBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  glassSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 18,
    shadowColor: 'rgba(185, 5, 56, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  dateEventPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: luminousColors.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 5,
    marginBottom: 8,
  },
  dateEventText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.onPrimaryFixedVariant,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
    marginTop: 4,
  },
  statVal: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
    marginTop: 2,
  },
  formCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  formSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: luminousColors.primary,
    letterSpacing: 0.8,
  },
  inputGroup: {
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: luminousColors.onSurface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checklistCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEEFB',
    gap: 12,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checklistTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checklistMainTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  checklistCountLabel: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '600',
  },
  checklistItemsCol: {
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkLabel: {
    fontSize: 13,
    color: luminousColors.onSurface,
  },
  checkLabelChecked: {
    color: luminousColors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  addChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  addChecklistInput: {
    flex: 1,
    fontSize: 12,
    color: luminousColors.onSurface,
  },
  addChecklistBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBanner: {
    position: 'absolute',
    top: 76,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 27, 46, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    zIndex: 50,
  },
  toastBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomDockWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 30,
  },
  bottomDock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: 'rgba(185, 5, 56, 0.16)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ECEEFB',
  },
  calendarFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: luminousColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigasiBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navigasiBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
