import React, { useState, useMemo } from 'react';
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
import { useCoupleData, MenuItem } from '../../context/couple-data-context';

export default function ReceiptResultScreen() {
  const router = useRouter();
  const { id, data: rawData } = useLocalSearchParams<{ id: string; data?: string }>();
  const { addExpense, partnerNames } = useCoupleData();

  // Parse scanned receipt payload
  const parsedReceipt = useMemo(() => {
    if (!rawData) return null;
    try {
      const data = JSON.parse(rawData);
      if (
        data &&
        (data.merchantName ||
          data.grandTotal ||
          (data.items && data.items.length > 0))
      ) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }, [rawData]);

  const [merchantName, setMerchantName] = useState<string>(
    parsedReceipt?.merchantName || 'Tempat Kencan'
  );
  const [items, setItems] = useState<MenuItem[]>(parsedReceipt?.items || []);
  const [splitMode, setSplitMode] = useState<'50-50' | 'partner' | 'user'>('50-50');
  const [memoryNote, setMemoryNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Compute total dynamically from items
  const computedSubtotal = useMemo(() => {
    if (!parsedReceipt) return 0;
    return (
      items.reduce((sum, it) => sum + (it.priceNumber || 0), 0) ||
      parsedReceipt.subtotal ||
      0
    );
  }, [items, parsedReceipt]);

  const computedTax = useMemo(() => {
    return Math.round(computedSubtotal * 0.1);
  }, [computedSubtotal]);

  const computedGrandTotal = useMemo(() => {
    return computedSubtotal + computedTax;
  }, [computedSubtotal, computedTax]);

  const handleSaveToWallet = () => {
    if (!parsedReceipt) return;
    setIsSaving(true);

    // Save real expense to shared couple data
    addExpense({
      merchantName: merchantName.trim() || 'Tempat Kencan',
      amount: computedGrandTotal,
      date: 'Hari Ini',
      category: parsedReceipt.category || 'Kuliner & Dining',
      splitMode,
      memoryNote: memoryNote.trim() || 'Kencan Berdua',
      items,
      accuracy: parsedReceipt.accuracy || 98,
    });

    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        router.replace('/(tabs)/visits');
      }, 900);
    }, 700);
  };

  if (!parsedReceipt) {
    return (
      <View style={styles.screenRoot}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Kembali">
            <Ionicons name="chevron-back" size={24} color={luminousColors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hasil Pindai Struk</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFEBF0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="receipt-outline" size={44} color={luminousColors.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: luminousColors.onSurface, textAlign: 'center', marginBottom: 8 }}>
            Belum Ada Struk yang Dipindai
          </Text>
          <Text style={{ fontSize: 14, color: luminousColors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
            Halaman ini menampilkan rincian ekstraksi struk asli dari kamera atau galeri. Ambil foto struk fisik kencan kalian untuk memindai secara otomatis.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: luminousColors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => router.replace('/receipts/scan' as any)}
            activeOpacity={0.88}>
            <Ionicons name="scan" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Pindai Struk Sekarang</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            Hasil Pindai Struk
          </Text>
        </View>

        <View style={styles.headerRight}>
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
        {/* Top Utility Bar */}
        <View style={styles.utilityBar}>
          <View style={styles.verifiedPill}>
            <Ionicons name="sparkles" size={14} color={luminousColors.onSecondaryFixed} />
            <Text style={styles.verifiedText}>Struk Terbaca Otomatis</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => router.back()}
            activeOpacity={0.75}
            accessibilityLabel="Hapus dan Pindai Ulang">
            <Ionicons name="trash-outline" size={18} color={luminousColors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Success Accuracy Banner */}
        <View style={styles.accuracyBanner}>
          <View style={styles.accuracyIconCircle}>
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.accuracyTextCol}>
            <Text style={styles.accuracyTitle}>
              Dibaca Sempurna (Akurasi {parsedReceipt.accuracy}%)
            </Text>
            <Text style={styles.accuracyDesc}>
              {items.length} item pesanan &amp; pajak kasir berhasil diekstrak
            </Text>
          </View>
        </View>

        {/* Merchant & Date Card */}
        <View style={styles.merchantCard}>
          <View style={styles.merchantHeaderRow}>
            <View style={styles.merchantThumbBox}>
              <Ionicons name="receipt" size={28} color={luminousColors.primary} />
            </View>
            <View style={styles.merchantTitleCol}>
              <View style={styles.dateNightPill}>
                <Ionicons name="heart" size={12} color={luminousColors.primary} />
                <Text style={styles.dateNightText}>Struk Kencan</Text>
              </View>
              <TextInput
                style={styles.merchantNameInput}
                value={merchantName}
                onChangeText={setMerchantName}
                placeholder="Nama Tempat Kencan"
              />
              <Text style={styles.merchantCategory}>{parsedReceipt.category}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={luminousColors.onSurfaceVariant} />
              <Text style={styles.metaText}>{parsedReceipt.date}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={luminousColors.onSurfaceVariant} />
              <Text style={styles.metaText}>19:42 WIB</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name="card-outline" size={14} color={luminousColors.onSurfaceVariant} />
              <Text style={styles.metaText}>QRIS / Cashless</Text>
            </View>
          </View>
        </View>

        {/* Itemized Order Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderTitle}>Rincian Pesanan</Text>
            <Text style={styles.tableCountTag}>{items.length} Menu</Text>
          </View>

          <View style={styles.itemListCol}>
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{item.qty}</Text>
                </View>
                <View style={styles.itemNameCol}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                <Text style={styles.itemPrice}>{item.price}</Text>
                <TouchableOpacity
                  onPress={() => setItems(items.filter((_, i) => i !== idx))}
                  style={{ paddingLeft: 8, paddingVertical: 4 }}
                  accessibilityLabel="Hapus item">
                  <Ionicons name="trash-outline" size={15} color="#E53935" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                marginTop: 6,
                borderRadius: 8,
                backgroundColor: '#F8F6FA',
                borderWidth: 1,
                borderColor: '#E8E4EC',
                borderStyle: 'dashed',
              }}
              onPress={() => {
                const newItem: MenuItem = {
                  qty: '1x',
                  name: `Item Tambahan #${items.length + 1}`,
                  category: 'Menu',
                  price: 'Rp 25.000',
                  priceNumber: 25000,
                };
                setItems([...items, newItem]);
              }}
              activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={16} color={luminousColors.primary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: luminousColors.primary }}>+ Tambah Item Manual</Text>
            </TouchableOpacity>
          </View>

          {/* Subtotal & Tax Calculation */}
          <View style={styles.calcDivider} />
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Subtotal</Text>
            <Text style={styles.calcVal}>Rp {computedSubtotal.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>PB1 &amp; Service (10%)</Text>
            <Text style={styles.calcVal}>Rp {computedTax.toLocaleString('id-ID')}</Text>
          </View>

          {/* Grand Total Bar */}
          <View style={styles.grandTotalBar}>
            <Text style={styles.grandTotalLabel}>Total Tagihan</Text>
            <Text style={styles.grandTotalVal}>
              Rp {computedGrandTotal.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Split Options Selector */}
        <View style={styles.splitCard}>
          <Text style={styles.splitCardTitle}>Skema Pembagian Pembayaran</Text>
          <Text style={styles.splitCardSub}>
            Pilih bagaimana pengeluaran ini dicatat dalam Dompet Berdua
          </Text>

          <View style={styles.splitOptionsRow}>
            <TouchableOpacity
              style={[styles.splitPill, splitMode === '50-50' && styles.splitPillActive]}
              onPress={() => setSplitMode('50-50')}
              activeOpacity={0.85}>
              <Ionicons
                name="pie-chart"
                size={16}
                color={splitMode === '50-50' ? luminousColors.onPrimary : luminousColors.onSurface}
              />
              <Text
                style={[
                  styles.splitPillText,
                  splitMode === '50-50' && styles.splitPillTextActive,
                ]}>
                Bagi 50:50
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.splitPill, splitMode === 'partner' && styles.splitPillActive]}
              onPress={() => setSplitMode('partner')}
              activeOpacity={0.85}>
              <Ionicons
                name="gift-outline"
                size={16}
                color={splitMode === 'partner' ? luminousColors.onPrimary : luminousColors.onSurface}
              />
              <Text
                style={[
                  styles.splitPillText,
                  splitMode === 'partner' && styles.splitPillTextActive,
                ]}>
                Ditraktir {partnerNames.partner}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.splitPill, splitMode === 'user' && styles.splitPillActive]}
              onPress={() => setSplitMode('user')}
              activeOpacity={0.85}>
              <Ionicons
                name="heart-outline"
                size={16}
                color={splitMode === 'user' ? luminousColors.onPrimary : luminousColors.onSurface}
              />
              <Text
                style={[
                  styles.splitPillText,
                  splitMode === 'user' && styles.splitPillTextActive,
                ]}>
                Aku yang Traktir
              </Text>
            </TouchableOpacity>
          </View>

          {/* Breakdown Per Person */}
          <View style={styles.splitBreakdownBox}>
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownPerson}>Bagian Kamu</Text>
              <Text style={styles.breakdownAmount}>
                {splitMode === '50-50'
                  ? `Rp ${Math.round(computedGrandTotal / 2).toLocaleString('id-ID')}`
                  : splitMode === 'user'
                  ? `Rp ${computedGrandTotal.toLocaleString('id-ID')}`
                  : 'Rp 0 (Hadiah ❤️)'}
              </Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownPerson}>Bagian {partnerNames.partner}</Text>
              <Text style={styles.breakdownAmount}>
                {splitMode === '50-50'
                  ? `Rp ${Math.round(computedGrandTotal / 2).toLocaleString('id-ID')}`
                  : splitMode === 'partner'
                  ? `Rp ${computedGrandTotal.toLocaleString('id-ID')}`
                  : 'Rp 0 (Hadiah ❤️)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Memory Note Input */}
        <View style={styles.noteCard}>
          <Text style={styles.noteCardTitle}>Catatan Momen Kencan</Text>
          <View style={styles.noteInputWrapper}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={luminousColors.primary} />
            <TextInput
              style={styles.noteTextInput}
              value={memoryNote}
              onChangeText={setMemoryNote}
              placeholder="Contoh: Merayakan anniversary / coba kafe baru"
              placeholderTextColor={luminousColors.outline}
            />
          </View>
        </View>

        {/* Save CTA Button */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaved && styles.saveBtnSaved]}
          onPress={handleSaveToWallet}
          disabled={isSaving || isSaved}
          activeOpacity={0.88}>
          {isSaved ? (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Tersimpan ke Dompet Berdua! ✨</Text>
            </>
          ) : (
            <>
              <Ionicons name="wallet-outline" size={22} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Menyimpan...' : 'Simpan ke Dompet Berdua ✨'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 20,
    gap: 16,
  },
  utilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 231, 255, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.secondary,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyBanner: {
    backgroundColor: 'rgba(255, 218, 219, 0.6)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accuracyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyTextCol: {
    flex: 1,
  },
  accuracyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  accuracyDesc: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  merchantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  merchantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  merchantThumbBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantTitleCol: {
    flex: 1,
  },
  dateNightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  dateNightText: {
    fontSize: 10,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  merchantNameInput: {
    fontSize: 16,
    fontWeight: '700',
    color: luminousColors.onSurface,
    padding: 0,
  },
  merchantCategory: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(227, 189, 191, 0.2)',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: luminousColors.outline,
  },
  tableCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  tableCountTag: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '600',
  },
  itemListCol: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBadge: {
    backgroundColor: luminousColors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  qtyText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  itemNameCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  itemCategory: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  calcDivider: {
    height: 1,
    backgroundColor: 'rgba(227, 189, 191, 0.25)',
    marginVertical: 12,
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  grandTotalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 218, 219, 0.45)',
    padding: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: luminousColors.primary,
  },
  splitCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    gap: 12,
  },
  splitCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  splitCardSub: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    marginTop: -8,
  },
  splitOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  splitPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: luminousColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  splitPillActive: {
    backgroundColor: luminousColors.primary,
  },
  splitPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: luminousColors.onSurface,
    textAlign: 'center',
  },
  splitPillTextActive: {
    color: luminousColors.onPrimary,
  },
  splitBreakdownBox: {
    flexDirection: 'row',
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownPerson: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
    marginBottom: 2,
  },
  breakdownAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: 'rgba(227, 189, 191, 0.3)',
  },
  noteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  noteCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  noteInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  noteTextInput: {
    flex: 1,
    fontSize: 13,
    color: luminousColors.onSurface,
  },
  saveBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnSaved: {
    backgroundColor: '#10B981',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
