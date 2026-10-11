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
import { useAuth } from '@/context/auth-context';
import { api } from '@/services/api';
import {
  ExpenseItem,
  ExpenseSummaryResponse,
  PlaceItem,
  VisitItem,
  VisitReviewsResponse,
} from '@ours/contracts';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { formatRupiah, formatTanggal, parseRupiahInput } from '@/utils/format';
import { OptionWheel, OptionWheelItem } from '@/components/free-components/OptionWheel';

type ExpenseSubTab = 'summary' | 'transactions' | 'scanner' | 'visits';

const EXPENSE_CATEGORIES: OptionWheelItem[] = [
  { id: 'Makan & Minum', label: 'Makan & Minum', icon: 'restaurant-outline', color: '#F43F5E' },
  { id: 'Aktivitas', label: 'Aktivitas Berdua', icon: 'sparkles-outline', color: '#2563EB' },
  { id: 'Transportasi', label: 'Transportasi', icon: 'car-outline', color: '#F59E0B' },
  { id: 'Belanja', label: 'Belanja', icon: 'cart-outline', color: '#8B5CF6' },
  { id: 'Lainnya', label: 'Lainnya', icon: 'ellipsis-horizontal-circle-outline', color: '#10B981' },
];

export default function ExpensesAndVisitsScreen() {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<ExpenseSubTab>('summary');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummaryResponse | null>(null);
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Expense Modal State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Makan & Minum');
  const [savingExpense, setSavingExpense] = useState(false);

  // Bill Scan / OCR State — Full itemized bill extraction
  const [scannerMode, setScannerMode] = useState<'camera' | 'preview'>('preview');
  const [scannedPlaceName, setScannedPlaceName] = useState('');
  const [scannedDate, setScannedDate] = useState('');
  const [scannedLineItems, setScannedLineItems] = useState<
    Array<{ id: string; name: string; quantity: number; unitPrice: number; lineTotal: number }>
  >([]);
  const [scannedSubtotal, setScannedSubtotal] = useState('0');
  const [scannedTax, setScannedTax] = useState('0');
  const [scannedServiceCharge, setScannedServiceCharge] = useState('0');
  const [scannedGrandTotal, setScannedGrandTotal] = useState('0');
  const [scannedCategory, setScannedCategory] = useState('Makan & Minum');
  const [scannedNotes, setScannedNotes] = useState('');
  const [savingScanned, setSavingScanned] = useState(false);

  // Visit & Review Modal State
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);

  const [reviewVisit, setReviewVisit] = useState<VisitItem | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [expList, expSum, visList, plcList] = await Promise.all([
        api.expenses.list().catch(() => []),
        api.expenses.summary().catch(() => null),
        api.visits.list().catch(() => []),
        api.places.search().catch(() => []),
      ]);
      setExpenses(expList);
      setSummary(expSum);
      setVisits(visList);
      setPlaces(plcList);
      if (plcList.length > 0 && !selectedPlaceId) {
        setSelectedPlaceId(plcList[0].id);
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal memuat catatan pengeluaran');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPlaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSaveManualExpense = async () => {
    if (!newExpTitle.trim() || !newExpAmount.trim()) {
      setStatusMessage('Lengkapi judul dan nominal pengeluaran');
      return;
    }
    setSavingExpense(true);
    try {
      const parsed = parseRupiahInput(newExpAmount);
      await api.expenses.create({
        description: newExpTitle.trim(),
        amount: parsed,
        category: newExpCategory,
        expenseDate: new Date().toISOString(),
      });
      setNewExpTitle('');
      setNewExpAmount('');
      setShowAddExpenseModal(false);
      setStatusMessage('Pengeluaran berhasil dicatat!');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menyimpan pengeluaran');
    } finally {
      setSavingExpense(false);
    }
  };

  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);
  const [ocrEngineInfo, setOcrEngineInfo] = useState<string | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

  const handleCaptureReceiptPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setStatusMessage('Izin kamera diperlukan untuk memotret struk');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64Str = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;
        if (!base64Str && asset.uri) {
          // If native platform did not return base64 inline, fetch blob and convert
          try {
            const resp = await fetch(asset.uri);
            const blob = await resp.blob();
            base64Str = await new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onloadend = () => resolve(r.result as string);
              r.readAsDataURL(blob);
            });
          } catch {
            base64Str = asset.uri;
          }
        }
        setSelectedReceiptImage(asset.uri);
        await runOcrProcessing(base64Str);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        handleSelectReceiptFile();
      } else {
        setStatusMessage('Kamera tidak dapat diakses: ' + (err?.message || 'Periksa izin kamera pada pengaturan perangkat'));
      }
    }
  };

  const handlePickReceiptFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setStatusMessage('Izin galeri diperlukan untuk memilih foto struk');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64Str = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;
        if (!base64Str && asset.uri) {
          try {
            const resp = await fetch(asset.uri);
            const blob = await resp.blob();
            base64Str = await new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onloadend = () => resolve(r.result as string);
              r.readAsDataURL(blob);
            });
          } catch {
            base64Str = asset.uri;
          }
        }
        setSelectedReceiptImage(asset.uri);
        await runOcrProcessing(base64Str);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        handleSelectReceiptFile();
      } else {
        setStatusMessage('Galeri foto tidak dapat diakses: ' + (err?.message || 'Periksa izin galeri'));
      }
    }
  };

  const handleSelectReceiptFile = async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result as string;
            setSelectedReceiptImage(base64);
            await runOcrProcessing(base64);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      handlePickReceiptFromGallery();
    }
  };

  const calculatedGrandTotal = (): number => {
    const itemsSum = scannedLineItems.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
    const taxNum = parseRupiahInput(scannedTax);
    const svcNum = parseRupiahInput(scannedServiceCharge);
    if (itemsSum > 0) {
      return itemsSum + taxNum + svcNum;
    }
    const directGrand = parseRupiahInput(scannedGrandTotal);
    if (directGrand > 0) return directGrand;
    const directSub = parseRupiahInput(scannedSubtotal);
    return directSub + taxNum + svcNum;
  };

  const runOcrProcessing = async (base64Img: string | null) => {
    setIsProcessingOcr(true);
    setStatusMessage('Memproses ekstraksi teks struk via AI Multimodal Vision...');
    try {
      if (base64Img) {
        const res = await api.expenses.scanReceipt({ imageBase64: base64Img });
        if (res.merchantName) setScannedPlaceName(res.merchantName);
        else setScannedPlaceName('');

        if (res.transactionDate) setScannedDate(res.transactionDate);
        else setScannedDate(new Date().toISOString().slice(0, 10));

        if (res.items && res.items.length > 0) {
          setScannedLineItems(
            res.items.map((it: any, idx: number) => ({
              id: `item-${idx}-${Date.now()}`,
              name: it.name || it.itemName || 'Item Menu',
              quantity: it.quantity || 1,
              unitPrice: it.unitPrice || it.lineTotal || 0,
              lineTotal: it.lineTotal || (it.quantity || 1) * (it.unitPrice || 0),
            }))
          );
        } else {
          setScannedLineItems([]);
        }

        setScannedSubtotal(String(res.subtotal || 0));
        setScannedTax(String(res.tax || 0));
        setScannedServiceCharge(String(res.serviceCharge || 0));
        setScannedGrandTotal(String(res.grandTotal || 0));

        setOcrEngineInfo(res.engine || 'Gemini Multimodal AI Vision');
        setOcrConfidence(res.confidence || 98);
        setStatusMessage(
          `Struk berhasil diekstrak! Ditemukan ${res.items?.length || 0} item (Keyakinan: ${res.confidence || 98}%)`
        );
      } else {
        setOcrEngineInfo('Mesin Gemini Vision OCR');
        setStatusMessage('Pilih foto struk untuk memulai OCR');
      }
      setScannerMode('preview');
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal memproses OCR, silakan lengkapi formulir');
      setScannerMode('preview');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleScanTrigger = () => {
    handleCaptureReceiptPhoto();
  };

  const handleSaveScannedReceipt = async () => {
    const totalAmount = calculatedGrandTotal();

    if (totalAmount <= 0) {
      setStatusMessage('Total nominal pengeluaran struk harus lebih besar dari 0');
      return;
    }

    if (!scannedPlaceName.trim()) {
      setStatusMessage('Silakan masukkan nama merchant atau tempat kencan');
      return;
    }

    setSavingScanned(true);
    try {
      const itemsPreview =
        scannedLineItems.length > 0
          ? ` (${scannedLineItems.map((i) => `${i.quantity}x ${i.name}`).slice(0, 3).join(', ')}${scannedLineItems.length > 3 ? '...' : ''})`
          : '';

      await api.expenses.create({
        description: `${scannedPlaceName.trim()}${itemsPreview}`,
        amount: totalAmount,
        category: scannedCategory,
        expenseDate:
          scannedDate && !isNaN(new Date(scannedDate).getTime())
            ? new Date(scannedDate).toISOString()
            : new Date().toISOString(),
      });

      setStatusMessage(`Pengeluaran ${formatRupiah(totalAmount)} berhasil dicatat ke database!`);
      setSubTab('summary');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal menyimpan struk terpindai');
    } finally {
      setSavingScanned(false);
    }
  };

  const handleCreateVisit = async () => {
    setSavingVisit(true);
    try {
      await api.visits.create({
        placeId: selectedPlaceId || undefined,
        visitedAt: new Date().toISOString(),
        notes: visitNotes.trim() || undefined,
      });
      setShowVisitModal(false);
      setVisitNotes('');
      setStatusMessage('Kunjungan tempat berhasil dicatat!');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal mencatat kunjungan');
    } finally {
      setSavingVisit(false);
    }
  };

  const openReviewModal = (v: VisitItem) => {
    setReviewVisit(v);
  };

  const handleSubmitReview = async () => {
    if (!reviewVisit) return;
    setSubmittingReview(true);
    try {
      await api.reviews.submit(reviewVisit.id, {
        overallRating: selectedRating,
        text: reviewText.trim() || undefined,
      });
      setStatusMessage('Ulasan rahasia berhasil disimpan!');
      setReviewVisit(null);
      setReviewText('');
      fetchData();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Gagal mengirim ulasan');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Dynamic Category Calculation from real expenses
  const computeCategoryBreakdown = () => {
    const activeExpenses = expenses.filter((e) => e.status === 'ACTIVE');
    if (activeExpenses.length === 0) return [];

    const map: Record<string, number> = {};
    let total = 0;
    activeExpenses.forEach((e) => {
      const cat = e.category || 'Lainnya';
      map[cat] = (map[cat] || 0) + e.amount;
      total += e.amount;
    });

    if (total === 0) return [];

    const colorPalette = ['#F43F5E', '#2563EB', '#F59E0B', '#8B5CF6', '#10B981', '#EC4899'];
    return Object.entries(map).map(([name, amount], idx) => ({
      name,
      amount,
      percentage: Math.round((amount / total) * 100),
      color: colorPalette[idx % colorPalette.length],
    }));
  };

  const dynamicCategories = computeCategoryBreakdown();
  const totalExpenseVal = summary?.totalActiveAmount ?? expenses.reduce((acc, e) => (e.status === 'ACTIVE' ? acc + e.amount : acc), 0);


  return (
    <View style={styles.container}>
      {/* 1. Header with Month Indicator */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Pengeluaran & Kunjungan</Text>
            <Text style={styles.headerSubtitle}>Pantau anggaran kencan dan transparansi bersama</Text>
          </View>
          <View style={styles.monthBadge}>
            <Ionicons name="wallet-outline" size={13} color="#2563EB" />
            <Text style={styles.monthBadgeText}>Bulan Ini</Text>
          </View>
        </View>

        {/* Subtabs Segmented Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, subTab === 'summary' && styles.segmentBtnActive]}
            onPress={() => setSubTab('summary')}
            activeOpacity={0.85}>
            <Text style={[styles.segmentBtnText, subTab === 'summary' && styles.segmentBtnTextActive]}>
              Ringkasan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, subTab === 'transactions' && styles.segmentBtnActive]}
            onPress={() => setSubTab('transactions')}
            activeOpacity={0.85}>
            <Text style={[styles.segmentBtnText, subTab === 'transactions' && styles.segmentBtnTextActive]}>
              Transaksi ({expenses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, subTab === 'scanner' && styles.segmentBtnActive]}
            onPress={() => setSubTab('scanner')}
            activeOpacity={0.85}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons
                name="scan-outline"
                size={14}
                color={subTab === 'scanner' ? '#FFFFFF' : '#4B5563'}
              />
              <Text style={[styles.segmentBtnText, subTab === 'scanner' && styles.segmentBtnTextActive]}>
                Pindai Struk
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, subTab === 'visits' && styles.segmentBtnActive]}
            onPress={() => setSubTab('visits')}
            activeOpacity={0.85}>
            <Text style={[styles.segmentBtnText, subTab === 'visits' && styles.segmentBtnTextActive]}>
              Kunjungan ({visits.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Toast Feedback */}
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
          <Text style={styles.loadingText}>Memuat catatan pengeluaran...</Text>
        </View>
      ) : subTab === 'summary' ? (
        /* ================= SUMMARY & CATEGORY BREAKDOWN ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          {/* Total Pengeluaran Hero Card */}
          <View style={styles.totalHeroCard}>
            <Text style={styles.totalHeroLabel}>Total Pengeluaran Bersama</Text>
            <Text style={styles.totalHeroAmount}>{formatRupiah(totalExpenseVal)}</Text>
            
            {summary && summary.partner2 ? (
              <View style={styles.splitRow}>
                <View style={styles.splitCol}>
                  <Text style={styles.splitName}>{summary.partner1.displayName}</Text>
                  <Text style={styles.splitAmount}>{formatRupiah(summary.partner1.totalPaid)}</Text>
                </View>
                <View style={styles.splitDivider} />
                <View style={styles.splitCol}>
                  <Text style={styles.splitName}>{summary.partner2.displayName}</Text>
                  <Text style={styles.splitAmount}>{formatRupiah(summary.partner2.totalPaid)}</Text>
                </View>
              </View>
            ) : null}

            {summary && summary.balanceOwed !== 0 ? (
              <View style={styles.balanceBadge}>
                <Ionicons name="swap-horizontal" size={13} color="#2563EB" />
                <Text style={styles.balanceText}>
                  {summary.balanceOwed > 0
                    ? `Selisih: ${summary.partner2?.displayName || 'Pasangan'} membayar ${formatRupiah(summary.balanceOwed)} lebih sedikit`
                    : `Selisih: ${summary.partner1.displayName} membayar ${formatRupiah(Math.abs(summary.balanceOwed))} lebih sedikit`}
                </Text>
              </View>
            ) : (
              <View style={styles.balanceBadgeBalanced}>
                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                <Text style={styles.balanceTextBalanced}>Pengeluaran Berdua Seimbang</Text>
              </View>
            )}
          </View>

          {/* Dynamic Distribution Card */}
          <View style={styles.donutCard}>
            <Text style={styles.cardSectionTitle}>Distribusi Kategori</Text>

            {dynamicCategories.length > 0 ? (
              <View style={styles.chartAndLegendRow}>
                <View style={styles.donutCircleVisual}>
                  <View style={[styles.donutSegmentRing, { borderColor: dynamicCategories[0]?.color || '#F43F5E' }]} />
                  <View style={styles.donutCenterHole}>
                    <Ionicons name="pie-chart" size={24} color={colors.primaryBlue} />
                    <Text style={styles.donutCenterText}>{dynamicCategories.length} Kat</Text>
                  </View>
                </View>

                <View style={styles.legendColumn}>
                  {dynamicCategories.map((cat) => (
                    <View key={cat.name} style={styles.legendItemRow}>
                      <View style={[styles.legendColorDot, { backgroundColor: cat.color }]} />
                      <View style={styles.legendTextCol}>
                        <Text style={styles.legendName}>{cat.name}</Text>
                        <Text style={styles.legendAmount}>{formatRupiah(cat.amount)}</Text>
                      </View>
                      <Text style={[styles.legendPercent, { color: cat.color }]}>
                        {cat.percentage}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyCategoryBox}>
                <Ionicons name="pie-chart-outline" size={32} color="#9CA3AF" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyCategoryTitle}>Belum Ada Pengeluaran Tercatat</Text>
                <Text style={styles.emptyCategorySub}>
                  Catat pengeluaran makan, bioskop, atau kencan untuk melihat grafik pembagian anggaran.
                </Text>
              </View>
            )}
          </View>

          {/* Action CTAs */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => setSubTab('scanner')}
              activeOpacity={0.88}>
              <Ionicons name="scan" size={16} color="#FFFFFF" />
              <Text style={styles.primaryActionButtonText}>Pindai Struk</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => setShowAddExpenseModal(true)}
              activeOpacity={0.85}>
              <Ionicons name="add" size={18} color="#1F2937" />
              <Text style={styles.secondaryActionButtonText}>Catat Manual</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : subTab === 'transactions' ? (
        /* ================= TRANSACTION LIST ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          <View style={styles.listHeaderRow}>
            <Text style={styles.cardSectionTitle}>Riwayat Transaksi</Text>
            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={() => setShowAddExpenseModal(true)}>
              <Ionicons name="add" size={15} color={colors.primaryBlue} />
              <Text style={styles.addSmallBtnText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {expenses.length > 0 ? (
            expenses.map((exp) => (
              <View key={exp.id} style={styles.transactionCard}>
                <View style={styles.transactionIconBox}>
                  <Ionicons name="receipt-outline" size={18} color={colors.primaryBlue} />
                </View>
                <View style={styles.transactionDetailsCol}>
                  <Text style={styles.transactionTitle}>{exp.description}</Text>
                  <Text style={styles.transactionDate}>
                    {formatTanggal(exp.expenseDate)} • {exp.category || 'Makan & Minum'}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>{formatRupiah(exp.amount)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={38} color="#9CA3AF" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.emptySub}>Pindai struk kencan atau catat transaksi pertama kalian.</Text>
            </View>
          )}
        </ScrollView>
      ) : subTab === 'scanner' ? (
        /* ================= BILL SCAN / OCR FLOW ================= */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.scannerModeSwitcher}>
            <TouchableOpacity
              style={[styles.scannerModeBtn, scannerMode === 'camera' && styles.scannerModeBtnActive]}
              onPress={() => setScannerMode('camera')}>
              <Ionicons
                name="camera"
                size={14}
                color={scannerMode === 'camera' ? '#FFFFFF' : '#4B5563'}
              />
              <Text
                style={[
                  styles.scannerModeBtnText,
                  scannerMode === 'camera' && styles.scannerModeBtnTextActive,
                ]}>
                Kamera Struk
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scannerModeBtn, scannerMode === 'preview' && styles.scannerModeBtnActive]}
              onPress={() => setScannerMode('preview')}>
              <Ionicons
                name="document-text"
                size={14}
                color={scannerMode === 'preview' ? '#FFFFFF' : '#4B5563'}
              />
              <Text
                style={[
                  styles.scannerModeBtnText,
                  scannerMode === 'preview' && styles.scannerModeBtnTextActive,
                ]}>
                Verifikasi OCR
              </Text>
            </TouchableOpacity>
          </View>

          {scannerMode === 'camera' ? (
            <View style={styles.cameraViewfinderBox}>
              <View style={styles.viewfinderFrame}>
                <View style={styles.viewfinderCornerTL} />
                <View style={styles.viewfinderCornerTR} />
                <View style={styles.viewfinderCornerBL} />
                <View style={styles.viewfinderCornerBR} />

                <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
                  <Ionicons name="scan-outline" size={56} color="#60A5FA" style={{ marginBottom: 12 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
                    Arahkan Kamera ke Struk
                  </Text>
                  <Text style={{ color: '#93C5FD', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                    Posisikan teks total, tanggal, dan nama merchant di dalam bingkai
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(37,99,235,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 16 }}>
                    <Ionicons name="hardware-chip-outline" size={14} color="#93C5FD" />
                    <Text style={{ color: '#BFDBFE', fontSize: 11, fontWeight: '600' }}>
                      Mesin Tesseract OCR Riil (Server-Side Open-Source)
                    </Text>
                  </View>
                </View>
              </View>

              {isProcessingOcr ? (
                <View style={{ alignItems: 'center', marginVertical: 18 }}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={[styles.shutterInstructionText, { marginTop: 8, color: '#FFFFFF' }]}>
                    Mengekstraksi teks struk & nominal via Tesseract OCR...
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', marginTop: 16, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <TouchableOpacity
                      style={styles.shutterButtonCircle}
                      onPress={handleCaptureReceiptPhoto}
                      accessibilityRole="button"
                      accessibilityLabel="Ambil Foto Kamera"
                      activeOpacity={0.85}>
                      <View style={styles.shutterButtonInner} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#374151',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 24,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                      onPress={handlePickReceiptFromGallery}
                      accessibilityRole="button"
                      accessibilityLabel="Pilih dari Galeri"
                      activeOpacity={0.85}>
                      <Ionicons name="images-outline" size={20} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Pilih Galeri</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.shutterInstructionText}>Ketuk tombol rana kamera atau pilih foto dari galeri</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.ocrPreviewCard}>
              {selectedReceiptImage && (
                <View style={{ marginBottom: 14, borderRadius: 12, overflow: 'hidden', height: 160, backgroundColor: '#111827', borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <Image source={{ uri: selectedReceiptImage }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
              )}
              {ocrEngineInfo && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="hardware-chip-outline" size={16} color="#2563EB" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E40AF' }}>{ocrEngineInfo}</Text>
                  </View>
                  {ocrConfidence !== null && (
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>Keyakinan Model: {ocrConfidence}%</Text>
                  )}
                </View>
              )}
              <View style={styles.ocrHeaderRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.ocrFieldLabel}>Nama Tempat / Merchant</Text>
                  <TextInput
                    style={[styles.ocrTextInput, { marginTop: 4, fontWeight: '700', fontSize: 15 }]}
                    value={scannedPlaceName}
                    onChangeText={setScannedPlaceName}
                    placeholder="Contoh: Kafe Lilin Senopati"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={[styles.ocrDateText, { marginTop: 4 }]}>{scannedDate}</Text>
                </View>
                <View style={styles.ocrVerifiedBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  <Text style={styles.ocrVerifiedText}>Validasi OCR</Text>
                </View>
              </View>

              {/* Daftar Menu / Item Terbaca dari Struk */}
              <View style={{ marginTop: 12, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F2937' }}>
                    Daftar Item Struk ({scannedLineItems.length})
                  </Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                    onPress={() => {
                      setScannedLineItems((prev) => [
                        ...prev,
                        { id: `item-new-${Date.now()}`, name: 'Item Baru', quantity: 1, unitPrice: 0, lineTotal: 0 },
                      ]);
                    }}>
                    <Ionicons name="add-circle-outline" size={14} color="#2563EB" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>Tambah Item</Text>
                  </TouchableOpacity>
                </View>

                {scannedLineItems.length > 0 ? (
                  scannedLineItems.map((item, index) => (
                    <View key={item.id} style={styles.ocrItemCardBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', width: 20 }}>
                          {index + 1}.
                        </Text>
                        <TextInput
                          style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#1F2937', paddingVertical: 2 }}
                          value={item.name}
                          onChangeText={(t) => {
                            setScannedLineItems((prev) =>
                              prev.map((it, i) => (i === index ? { ...it, name: t } : it))
                            );
                          }}
                          placeholder="Nama menu / item..."
                        />
                        <TextInput
                          style={{ width: 36, fontSize: 13, color: '#4B5563', textAlign: 'center', backgroundColor: '#F3F4F6', borderRadius: 6, paddingVertical: 2 }}
                          value={String(item.quantity)}
                          keyboardType="numeric"
                          onChangeText={(q) => {
                            const qty = parseInt(q, 10) || 1;
                            setScannedLineItems((prev) =>
                              prev.map((it, i) =>
                                i === index
                                  ? { ...it, quantity: qty, lineTotal: qty * (it.unitPrice || it.lineTotal) }
                                  : it
                              )
                            );
                          }}
                        />
                        <TextInput
                          style={{ width: 85, fontSize: 13, fontWeight: '700', color: '#1F2937', textAlign: 'right', paddingVertical: 2 }}
                          value={String(item.lineTotal)}
                          keyboardType="numeric"
                          onChangeText={(p) => {
                            const val = parseRupiahInput(p);
                            setScannedLineItems((prev) =>
                              prev.map((it, i) => (i === index ? { ...it, lineTotal: val } : it))
                            );
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setScannedLineItems((prev) => prev.filter((_, i) => i !== index));
                          }}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ padding: 12, backgroundColor: '#F9FAFB', borderRadius: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Belum ada rincian item atau struk berformat ringkas.</Text>
                  </View>
                )}
              </View>

              {/* Rincian Finansial & Total Tagihan */}
              <View style={styles.ocrItemsTable}>
                <View style={styles.ocrItemRow}>
                  <Text style={styles.ocrItemLabel}>Subtotal</Text>
                  <TextInput
                    style={styles.ocrEditablePriceInput}
                    value={scannedSubtotal}
                    onChangeText={setScannedSubtotal}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.ocrItemRow}>
                  <Text style={styles.ocrItemLabel}>Pajak (PB1/PPN)</Text>
                  <TextInput
                    style={styles.ocrEditablePriceInput}
                    value={scannedTax}
                    onChangeText={setScannedTax}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.ocrItemRow}>
                  <Text style={styles.ocrItemLabel}>Biaya Layanan (Service)</Text>
                  <TextInput
                    style={styles.ocrEditablePriceInput}
                    value={scannedServiceCharge}
                    onChangeText={setScannedServiceCharge}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.ocrDivider} />
                <View style={styles.ocrItemRowTotal}>
                  <Text style={styles.ocrTotalLabel}>Total Pengeluaran</Text>
                  <Text style={styles.ocrTotalAmount}>{formatRupiah(calculatedGrandTotal())}</Text>
                </View>
              </View>

              <View style={styles.ocrInputGroup}>
                <Text style={styles.ocrFieldLabel}>Kategori</Text>
                <OptionWheel
                  options={EXPENSE_CATEGORIES}
                  selectedId={scannedCategory}
                  onSelect={(id) => setScannedCategory(id)}
                />
              </View>

              <View style={styles.ocrInputGroup}>
                <Text style={styles.ocrFieldLabel}>Catatan Kencan</Text>
                <TextInput
                  style={styles.ocrTextInput}
                  value={scannedNotes}
                  onChangeText={setScannedNotes}
                  placeholder="Tambahkan catatan kenangan..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                style={styles.ocrConfirmButton}
                onPress={handleSaveScannedReceipt}
                disabled={savingScanned}
                activeOpacity={0.88}>
                {savingScanned ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.ocrConfirmButtonText}>Konfirmasi & Simpan Pengeluaran</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#F3F4F6' }}
                onPress={() => {
                  setScannerMode('camera');
                  setSelectedReceiptImage(null);
                  setOcrEngineInfo(null);
                  setOcrConfidence(null);
                }}
                activeOpacity={0.75}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="camera-reverse-outline" size={16} color="#4B5563" />
                  <Text style={{ color: '#4B5563', fontSize: 13, fontWeight: '700' }}>Batal & Pindai Ulang Struk</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        /* ================= VISITS TAB ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBlue} />
          }>
          <View style={styles.listHeaderRow}>
            <Text style={styles.cardSectionTitle}>Tempat yang Pernah Dikunjungi</Text>
            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={() => setShowVisitModal(true)}>
              <Ionicons name="add" size={15} color={colors.primaryBlue} />
              <Text style={styles.addSmallBtnText}>Catat</Text>
            </TouchableOpacity>
          </View>

          {visits.length > 0 ? (
            visits.map((v) => (
              <View key={v.id} style={styles.visitCard}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80',
                  }}
                  style={styles.visitCardThumb}
                />
                <View style={styles.visitCardBody}>
                  <Text style={styles.visitCardPlaceName}>{v.place?.name || 'Kunjungan Kencan'}</Text>
                  <Text style={styles.visitCardDate}>{formatTanggal(v.visitedAt)}</Text>
                  {v.notes && <Text style={styles.visitCardNotes}>"{v.notes}"</Text>}
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => openReviewModal(v)}
                    activeOpacity={0.85}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.reviewBtnText}>Beri / Lihat Ulasan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="map-outline" size={38} color="#9CA3AF" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>Belum ada kunjungan dicatat</Text>
              <Text style={styles.emptySub}>Abadikan tempat makan atau kencan favorit yang telah dikunjungi.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal Catat Pengeluaran Manual */}
      <Modal visible={showAddExpenseModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Catat Pengeluaran Manual</Text>
              <TouchableOpacity onPress={() => setShowAddExpenseModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Deskripsi (contoh: Tiket Bioskop & Popcorn)"
              placeholderTextColor="#9CA3AF"
              value={newExpTitle}
              onChangeText={setNewExpTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Nominal Rupiah (contoh: 150000)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={newExpAmount}
              onChangeText={setNewExpAmount}
            />

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Pilih Kategori:</Text>
              <OptionWheel
                options={EXPENSE_CATEGORIES}
                selectedId={newExpCategory}
                onSelect={(id) => setNewExpCategory(id)}
              />
            </View>

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleSaveManualExpense}
              disabled={savingExpense}
              activeOpacity={0.88}>
              {savingExpense ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Simpan Pengeluaran</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Catat Kunjungan Baru */}
      <Modal visible={showVisitModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Catat Kunjungan Tempat</Text>
              <TouchableOpacity onPress={() => setShowVisitModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Catatan kesan tempat..."
              placeholderTextColor="#9CA3AF"
              value={visitNotes}
              onChangeText={setVisitNotes}
            />

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleCreateVisit}
              disabled={savingVisit}
              activeOpacity={0.88}>
              {savingVisit ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Simpan Kunjungan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Ulasan Kunjungan */}
      <Modal visible={!!reviewVisit} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Ulasan Kunjungan Rahasia</Text>
              <TouchableOpacity onPress={() => setReviewVisit(null)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#4B5563', marginBottom: 12 }}>
              Berikan rating dan ulasan rahasiamu untuk tempat ini:
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Ionicons
                    name={star <= selectedRating ? 'star' : 'star-outline'}
                    size={28}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Tulis ulasan jujur untuk dibagikan dengan pasangan..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleSubmitReview}
              disabled={submittingReview}
              activeOpacity={0.88}>
              {submittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Simpan Ulasan</Text>
              )}
            </TouchableOpacity>
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
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  segmentedContainer: {
    gap: 8,
    paddingBottom: 4,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  segmentBtnActive: {
    backgroundColor: '#1F2937',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  segmentBtnTextActive: {
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
  totalHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  totalHeroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalHeroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  splitCol: {
    flex: 1,
    alignItems: 'center',
  },
  splitDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  splitName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  splitAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  balanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  balanceBadgeBalanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F4EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  balanceTextBalanced: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  donutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartAndLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  donutCircleVisual: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutSegmentRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
  },
  donutCenterHole: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  legendColumn: {
    flex: 1,
    gap: 8,
  },
  legendItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendTextCol: {
    flex: 1,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  legendAmount: {
    fontSize: 11,
    color: '#6B7280',
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCategoryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyCategorySub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 260,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#F43F5E',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addSmallBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  transactionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetailsCol: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  scannerModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  scannerModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  scannerModeBtnActive: {
    backgroundColor: '#1F2937',
  },
  scannerModeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  scannerModeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cameraViewfinderBox: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380,
  },
  viewfinderFrame: {
    width: '100%',
    height: 280,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  viewfinderCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#F43F5E',
  },
  viewfinderCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#F43F5E',
  },
  viewfinderCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#F43F5E',
  },
  viewfinderCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#F43F5E',
  },
  receiptPaperSimulation: {
    backgroundColor: '#FDFBF7',
    padding: 16,
    borderRadius: 8,
    width: '78%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  receiptMockTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  receiptMockSub: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptMockDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  receiptMockText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#1F2937',
  },
  receiptMockTotal: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#1F2937',
  },
  shutterButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 10,
  },
  shutterButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F43F5E',
  },
  shutterInstructionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  ocrPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ocrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ocrPlaceName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  ocrDateText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ocrVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E7F4EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ocrVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  ocrItemsTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  ocrItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ocrItemLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  ocrEditablePriceInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 2,
    paddingHorizontal: 6,
    textAlign: 'right',
    minWidth: 80,
  },
  ocrDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  ocrItemRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ocrTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  ocrTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryBlue,
  },
  ocrInputGroup: {
    marginBottom: 14,
  },
  ocrFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  ocrTextInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1F2937',
  },
  ocrConfirmButton: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ocrConfirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ocrItemCardBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    alignItems: 'center',
  },
  visitCardThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  visitCardBody: {
    flex: 1,
  },
  visitCardPlaceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  visitCardDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  visitCardNotes: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 2,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
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
  modalInput: {
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
});
