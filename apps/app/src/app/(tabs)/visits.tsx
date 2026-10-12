import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { luminousColors } from '@ours/design-tokens';
import { useCoupleData } from '../../context/couple-data-context';

export default function VisitsWalletScreen() {
  const router = useRouter();
  const { expenses, totalBudget, partnerNames } = useCoupleData();

  const [selectedMonth, setSelectedMonth] = useState('Bulan Ini');

  // Dynamic calculations
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const spentPercent = useMemo(() => {
    if (totalBudget <= 0) return 0;
    return Math.min(100, Math.round((totalSpent / totalBudget) * 100));
  }, [totalSpent, totalBudget]);

  const remainingBudget = useMemo(() => {
    return Math.max(0, totalBudget - totalSpent);
  }, [totalBudget, totalSpent]);

  const halfSplit = useMemo(() => {
    return Math.round(totalSpent / 2);
  }, [totalSpent]);

  return (
    <View style={styles.screenRoot}>
      {/* ---------------- Header ---------------- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarPill}>
            <View style={styles.avatarHeart}>
              <Ionicons name="heart" size={16} color={luminousColors.primary} />
            </View>
            <View style={styles.avatarPartner}>
              <Ionicons name="person" size={15} color={luminousColors.secondary} />
            </View>
            <View style={styles.syncPulseDot} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.syncLabel}>
              OURS <Text style={{ color: luminousColors.primary }}>•</Text> Transparan
            </Text>
            <Text style={styles.headerTitle}>Dompet Berdua</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/receipts/scan' as any)}
            activeOpacity={0.75}
            accessibilityLabel="Pindai Struk">
            <Ionicons name="scan-outline" size={20} color={luminousColors.primary} />
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
        showsVerticalScrollIndicator={false}>
        {/* Ambient Radiant Card */}
        <View style={styles.mainWalletCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.pulseDot} />
              <Text style={styles.cardKicker}>Dompet Berdua • {selectedMonth}</Text>
            </View>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>
                {expenses.length === 0 ? 'Mulai Bersama' : `${expenses.length} Transaksi`}
              </Text>
            </View>
          </View>

          <View style={styles.expenseTotalSection}>
            <Text style={styles.expenseLabel}>Total Pengeluaran Kencan</Text>
            <View style={styles.expenseAmountRow}>
              <Text style={styles.expenseAmountMain}>
                Rp {totalSpent.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.expenseAmountTarget}>
                / Rp {totalBudget.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>

          {/* Target Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${spentPercent}%` }]} />
            </View>
            <View style={styles.progressMetaRow}>
              <View style={styles.savingBadge}>
                <Ionicons name="leaf" size={12} color={luminousColors.onSecondaryFixed} />
                <Text style={styles.savingBadgeText}>
                  {spentPercent > 0
                    ? `Terpakai ${spentPercent}% kuota bujet`
                    : 'Bujet 100% utuh & siap digunakan 🌱'}
                </Text>
              </View>
              <Text style={styles.remainingText}>
                Sisa: Rp {remainingBudget.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>

        {/* ---------------- CLEAN EMPTY STATE ---------------- */}
        {expenses.length === 0 ? (
          <View style={styles.cleanEmptyCard}>
            <View style={styles.cleanEmptyIconBox}>
              <Ionicons name="receipt-outline" size={44} color={luminousColors.primary} />
            </View>
            <Text style={styles.cleanEmptyTitle}>Dompet Berdua Siap Digunakan 👛</Text>
            <Text style={styles.cleanEmptyDesc}>
              Bangun kebiasaan keuangan yang sehat, adil, dan transparan bersama {partnerNames.partner}.
              Catat pengeluaran kencan pertamamu atau pindai struk restoran secara otomatis dengan AI
              OCR!
            </Text>

            <TouchableOpacity
              style={styles.cleanEmptyCta}
              onPress={() => router.push('/receipts/scan' as any)}
              activeOpacity={0.88}>
              <Ionicons name="scan" size={20} color="#FFFFFF" />
              <Text style={styles.cleanEmptyCtaText}>+ Pindai Struk Kencan Pertama 🧾</Text>
            </TouchableOpacity>

            <View style={styles.cleanEmptyHint}>
              <Ionicons name="sparkles" size={16} color={luminousColors.secondary} />
              <Text style={styles.cleanEmptyHintText}>
                Sistem secara otomatis menghitung pembagian 50:50, traktiran, dan pajak restoran PB1
                10%!
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Split Status Synchronizer Pill */}
            <View style={styles.splitSyncCard}>
              <View style={styles.splitSyncLeft}>
                <View style={styles.splitIconCircle}>
                  <Ionicons name="scale-outline" size={20} color={luminousColors.secondary} />
                </View>
                <View style={styles.splitTextCol}>
                  <View style={styles.splitTitleRow}>
                    <Text style={styles.splitTitle}>Split 50:50 Otomatis</Text>
                    <View style={styles.splitDot} />
                  </View>
                  <Text style={styles.splitSubtitle}>
                    Rp {halfSplit.toLocaleString('id-ID')}/orang • {partnerNames.user} &amp;{' '}
                    {partnerNames.partner} Seimbang
                  </Text>
                </View>
              </View>
              <View style={styles.splitAvatarPair}>
                <View style={styles.splitAvatarD}>
                  <Text style={styles.splitAvatarText}>
                    {partnerNames.partner.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.splitAvatarS}>
                  <Text style={styles.splitAvatarText}>
                    {partnerNames.user.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* List of Recent Expenses */}
            <View style={styles.historyCard}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historySectionTitle}>Riwayat Pengeluaran Kencan</Text>
                <Text style={styles.historyCountTag}>{expenses.length} Catatan</Text>
              </View>

              <View style={styles.expenseListCol}>
                {expenses.map((item) => (
                  <View key={item.id} style={styles.expenseItemRow}>
                    <View style={styles.expenseIconBox}>
                      <Ionicons name="restaurant-outline" size={20} color={luminousColors.primary} />
                    </View>
                    <View style={styles.expenseInfoCol}>
                      <Text style={styles.expenseMerchantName}>{item.merchantName}</Text>
                      <Text style={styles.expenseDateCat}>
                        {item.date} • {item.category}
                      </Text>
                      {item.memoryNote && (
                        <Text style={styles.expenseNoteText} numberOfLines={1}>
                          💬 {item.memoryNote}
                        </Text>
                      )}
                    </View>
                    <View style={styles.expenseAmountCol}>
                      <Text style={styles.expenseAmountVal}>
                        Rp {item.amount.toLocaleString('id-ID')}
                      </Text>
                      <Text style={styles.expenseSplitBadge}>
                        {item.splitMode === '50-50'
                          ? 'Bagi 50:50'
                          : item.splitMode === 'partner' || item.splitMode === 'daniel'
                          ? `Traktiran ${partnerNames.partner}`
                          : 'Aku Traktir'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Primary CTA Button: Scan Receipt / Add Expense */}
        <TouchableOpacity
          style={styles.scanCtaBtn}
          onPress={() => router.push('/receipts/scan' as any)}
          activeOpacity={0.88}>
          <Ionicons name="receipt-outline" size={22} color="#FFFFFF" />
          <Text style={styles.scanCtaText}>+ Catat Pengeluaran / Pindai Struk 🧾</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
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
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 16,
    position: 'relative',
    gap: 2,
  },
  avatarHeart: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPartner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: luminousColors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncPulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerTextCol: {
    marginLeft: 4,
  },
  syncLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: luminousColors.onSurfaceVariant,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: luminousColors.onSurface,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 218, 219, 0.5)',
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
  mainWalletCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 26,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: luminousColors.primary,
  },
  cardKicker: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  monthBadge: {
    backgroundColor: luminousColors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.primary,
  },
  expenseTotalSection: {
    gap: 4,
  },
  expenseLabel: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
  },
  expenseAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  expenseAmountMain: {
    fontSize: 28,
    fontWeight: '800',
    color: luminousColors.onSurface,
  },
  expenseAmountTarget: {
    fontSize: 14,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: luminousColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: luminousColors.primary,
  },
  progressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savingBadgeText: {
    fontSize: 11,
    color: luminousColors.secondary,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
  },
  cleanEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 26,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  cleanEmptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cleanEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: luminousColors.onSurface,
    textAlign: 'center',
  },
  cleanEmptyDesc: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  cleanEmptyCta: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  cleanEmptyCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cleanEmptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 231, 255, 0.45)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginTop: 6,
  },
  cleanEmptyHintText: {
    flex: 1,
    fontSize: 11,
    color: luminousColors.secondary,
    lineHeight: 15,
  },
  splitSyncCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitSyncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  splitIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: luminousColors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitTextCol: {
    flex: 1,
  },
  splitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  splitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  splitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: luminousColors.secondary,
  },
  splitSubtitle: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  splitAvatarPair: {
    flexDirection: 'row',
  },
  splitAvatarD: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: luminousColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  splitAvatarS: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  splitAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historySectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  historyCountTag: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '600',
  },
  expenseListCol: {
    gap: 12,
  },
  expenseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(227, 189, 191, 0.2)',
  },
  expenseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfoCol: {
    flex: 1,
  },
  expenseMerchantName: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  expenseDateCat: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  expenseNoteText: {
    fontSize: 10,
    color: luminousColors.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  expenseAmountCol: {
    alignItems: 'flex-end',
  },
  expenseAmountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: luminousColors.onSurface,
  },
  expenseSplitBadge: {
    fontSize: 10,
    color: luminousColors.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  scanCtaBtn: {
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
  scanCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
