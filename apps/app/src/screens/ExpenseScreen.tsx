import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import {
  Heart,
  Bell,
  ChevronDown,
  TrendingDown,
  Plus,
  Utensils,
  Wallet,
  Calendar,
  Compass,
  Home,
  MoreHorizontal,
  FileText,
  Check,
} from 'lucide-react-native';
import { CategoryShareDto, ReceiptHistoryItemDto } from '@ours/contracts';

export interface ExpenseScreenProps {
  navigation?: any;
  onScanReceipt?: () => void;
  onManualExpense?: () => void;
  onViewAllReceipts?: () => void;
  onSelectPeriod?: (period: string) => void;
  customCategories?: CategoryShareDto[];
  customReceipts?: ReceiptHistoryItemDto[];
  totalSpent?: number;
  targetBudget?: number;
  trendPct?: number;
}

export const ExpenseScreen: React.FC<ExpenseScreenProps> = ({
  navigation,
  onScanReceipt,
  onManualExpense,
  onViewAllReceipts,
  onSelectPeriod,
  customCategories,
  customReceipts,
  totalSpent = 4320000,
  targetBudget = 5000000,
  trendPct = -12,
}) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'transaksi'>('ringkasan');
  const [selectedMonth, setSelectedMonth] = useState('April 2024');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const availableMonths = ['Februari 2024', 'Maret 2024', 'April 2024', 'Mei 2024'];

  const categories: CategoryShareDto[] = customCategories || [
    {
      id: '1',
      key: 'MAKAN_MINUM',
      name: 'Makan & Minum',
      subtitle: '14 kali kencan • 42%',
      amount: 1814000,
      percentage: 42,
      color: '#E11D48',
    },
    {
      id: '2',
      key: 'AKTIVITAS_HIBURAN',
      name: 'Aktivitas & Hiburan',
      subtitle: '6 rencana • 24%',
      amount: 1037000,
      percentage: 24,
      color: '#2563EB',
    },
    {
      id: '3',
      key: 'TRANSPORTASI',
      name: 'Transportasi',
      subtitle: 'Bensin & Taksi • 14%',
      amount: 605000,
      percentage: 14,
      color: '#1D4ED8',
    },
    {
      id: '4',
      key: 'BELANJA_BERSAMA',
      name: 'Belanja Bersama',
      subtitle: 'Hadiah & Snack • 12%',
      amount: 518000,
      percentage: 12,
      color: '#FDA4AF',
    },
    {
      id: '5',
      key: 'LAINNYA',
      name: 'Lainnya',
      subtitle: 'Parkir & Tiket • 8%',
      amount: 346000,
      percentage: 8,
      color: '#10B981',
    },
  ];

  const recentReceipts: ReceiptHistoryItemDto[] = customReceipts || [
    {
      id: 'rec-1',
      placeName: 'Social House Gr...',
      fullName: 'Social House Grand Indonesia',
      dateLabel: '12 Apr 2024 • Makan Malam',
      amount: 286000,
      payerLabel: 'Daniel bayar',
      splitLabel: 'Bagi 50:50',
      imageUrl:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=160&q=80',
    },
    {
      id: 'rec-2',
      placeName: 'Plataran Menteng',
      fullName: 'Plataran Menteng Indonesian Fine Dining',
      dateLabel: '08 Apr 2024 • Dinner Date',
      amount: 450000,
      payerLabel: 'Dibagi dua',
      splitLabel: 'Rp 225.000 /org',
      imageUrl:
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=160&q=80',
    },
  ];

  const formatRupiah = (val: number): string => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

  // SVG Donut Chart Geometry
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngleOffset = 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FF" />

      {/* Top Header App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.heartIconWrap}>
            <Heart size={20} color="#F43F5E" fill="#F43F5E" />
          </View>
          <Text style={styles.headerTitle}>Pengeluaran</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Bell size={18} color="#4B5563" />
          </TouchableOpacity>
          <View style={styles.avatarCoupleCircle}>
            <Text style={styles.avatarCoupleText}>D•S</Text>
          </View>
        </View>
      </View>

      {/* Segmented Tab Bar (Ringkasan vs Transaksi) */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabSegmentContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('ringkasan')}
            activeOpacity={0.8}
            style={[
              styles.tabSegmentBtn,
              activeTab === 'ringkasan' && styles.tabSegmentBtnActive,
            ]}>
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === 'ringkasan' && styles.tabSegmentTextActive,
              ]}>
              Ringkasan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('transaksi')}
            activeOpacity={0.8}
            style={[
              styles.tabSegmentBtn,
              activeTab === 'transaksi' && styles.tabSegmentBtnActive,
            ]}>
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === 'transaksi' && styles.tabSegmentTextActive,
              ]}>
              Transaksi
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {activeTab === 'ringkasan' ? (
          <>
            {/* Total Pengeluaran Kencan Card */}
            <View style={styles.budgetCard}>
              <View style={styles.budgetTopRow}>
                {/* Dropdown Periode Bulan */}
                <TouchableOpacity
                  style={styles.monthDropdownBtn}
                  onPress={() => setShowMonthDropdown(!showMonthDropdown)}
                  activeOpacity={0.8}>
                  <Text style={styles.monthDropdownText}>📅 {selectedMonth}</Text>
                  <ChevronDown size={14} color="#6B7280" />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* Split Ratio Badge 50:50 dengan Avatar D & S */}
                  <View style={styles.splitRatioBadge}>
                    <View style={styles.avatarsOverlap}>
                      <View style={[styles.avatarMicro, { backgroundColor: '#E11D48' }]}>
                        <Text style={styles.avatarMicroText}>D</Text>
                      </View>
                      <View
                        style={[
                          styles.avatarMicro,
                          { backgroundColor: '#2563EB', marginLeft: -5 },
                        ]}>
                        <Text style={styles.avatarMicroText}>S</Text>
                      </View>
                    </View>
                    <Text style={styles.splitRatioText}>50:50</Text>
                  </View>

                  {/* Hemat Badge */}
                  <View style={styles.statusBadgeHemat}>
                    <Text style={styles.statusBadgeHematText}>⤹ Hemat</Text>
                  </View>
                </View>
              </View>

              {/* Month Dropdown Menu */}
              {showMonthDropdown && (
                <View style={styles.dropdownMenu}>
                  {availableMonths.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.dropdownItem,
                        m === selectedMonth && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedMonth(m);
                        setShowMonthDropdown(false);
                        if (onSelectPeriod) onSelectPeriod(m);
                      }}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          m === selectedMonth && styles.dropdownItemTextActive,
                        ]}>
                        {m}
                      </Text>
                      {m === selectedMonth && <Check size={14} color="#E11D48" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Subtitle & Main Amount */}
              <Text style={styles.budgetLabel}>Total Pengeluaran Kencan</Text>
              <Text style={styles.budgetAmountMain}>{formatRupiah(totalSpent)}</Text>

              {/* Target & Trend Badge */}
              <View style={styles.budgetBottomRow}>
                <View style={styles.trendBadge}>
                  <TrendingDown size={14} color="#10B981" />
                  <Text style={styles.trendBadgeText}>
                    {trendPct < 0 ? `${trendPct}%` : `+${trendPct}%`} dari bulan lalu
                  </Text>
                </View>
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>Target:</Text>
                  <Text style={styles.targetAmount}>{formatRupiah(targetBudget)}</Text>
                </View>
              </View>
            </View>

            {/* Alokasi Pengeluaran (Donut Chart & Legend) */}
            <View style={styles.allocationCard}>
              <View style={styles.allocationHeaderRow}>
                <Text style={styles.allocationTitle}>Alokasi Pengeluaran</Text>
                <Text style={styles.allocationCount}>5 Kategori</Text>
              </View>

              {/* Donut Chart Visual Representation (SVG) */}
              <View style={styles.donutCenterWrap}>
                <View style={{ width: size, height: size, position: 'relative' }}>
                  <Svg width={size} height={size}>
                    <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                      {categories.map((cat) => {
                        const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -currentAngleOffset;
                        currentAngleOffset += (cat.percentage / 100) * circumference;

                        return (
                          <Circle
                            key={cat.id}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={cat.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            fill="none"
                            strokeLinecap="butt"
                          />
                        );
                      })}
                    </G>
                  </Svg>

                  {/* Center Content in Donut Ring */}
                  <View style={styles.donutHoleContent}>
                    <View style={styles.donutIconCircle}>
                      <Utensils size={15} color="#E11D48" />
                    </View>
                    <Text style={styles.donutPercentageText}>42%</Text>
                    <Text style={styles.donutSubText}>Makan & Minum</Text>
                  </View>
                </View>
              </View>

              {/* Legend Category Rows */}
              <View style={styles.categoriesList}>
                {categories.map((c) => (
                  <View key={c.id} style={styles.categoryRow}>
                    <View style={styles.catLeftRow}>
                      <View style={[styles.catColorDot, { backgroundColor: c.color }]} />
                      <View>
                        <Text style={styles.catNameText}>{c.name}</Text>
                        <Text style={styles.catSubtitleText}>{c.subtitle}</Text>
                      </View>
                    </View>
                    <Text style={styles.catAmountText}>{formatRupiah(c.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Struk Tanggal Terbaru */}
            <View style={styles.receiptsCard}>
              <View style={styles.receiptsHeaderRow}>
                <View style={styles.receiptsHeaderTitleWrap}>
                  <Text style={{ fontSize: 16 }}>🧾</Text>
                  <Text style={styles.receiptsTitle}>Struk Tanggal Terbaru</Text>
                </View>
                <TouchableOpacity
                  onPress={onViewAllReceipts}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.seeAllText}>Lihat Semua</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Receipts List */}
              <View style={styles.receiptsList}>
                {recentReceipts.map((rec, idx) => (
                  <View
                    key={rec.id}
                    style={[
                      styles.receiptRow,
                      idx < recentReceipts.length - 1 && styles.receiptRowBorder,
                    ]}>
                    <View style={styles.receiptLeft}>
                      <Image
                        source={{ uri: rec.imageUrl }}
                        style={styles.receiptThumb}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.receiptPlaceText} numberOfLines={1}>
                          {rec.placeName}
                        </Text>
                        <Text style={styles.receiptDateText}>{rec.dateLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.receiptRight}>
                      <Text style={styles.receiptAmountText}>{formatRupiah(rec.amount)}</Text>
                      <Text style={styles.receiptPayerText}>{rec.payerLabel}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          /* Tab: Transaksi */
          <View style={styles.transactionsContainer}>
            <View style={styles.transHeaderCard}>
              <Text style={styles.transHeaderTitle}>Riwayat Transaksi Lengkap</Text>
              <Text style={styles.transHeaderSub}>
                Semua pengeluaran yang dicatat oleh Daniel & Sasa
              </Text>
            </View>

            {recentReceipts.map((rec) => (
              <View key={rec.id} style={styles.transItemCard}>
                <Image
                  source={{ uri: rec.imageUrl }}
                  style={styles.transThumb}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.transPlaceName}>{rec.fullName || rec.placeName}</Text>
                  <Text style={styles.transDateLabel}>{rec.dateLabel}</Text>
                  <View style={styles.transPayerPill}>
                    <Text style={styles.transPayerPillText}>{rec.payerLabel}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.transAmountText}>{formatRupiah(rec.amount)}</Text>
                  <Text style={styles.transSplitText}>{rec.splitLabel || 'Bagi 50:50'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* CTA Button: Catat Pengeluaran */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => {
            if (onScanReceipt) onScanReceipt();
            else if (onManualExpense) onManualExpense();
          }}
          style={styles.floatingCtaBtn}>
          <Plus size={18} color="#FFFFFF" strokeWidth={3} />
          <Text style={styles.floatingCtaText}>Catat Pengeluaran</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heartIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCoupleCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#BE123C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCoupleText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },

  /* Tabs */
  tabBarWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#F8F9FF',
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    padding: 3,
    borderRadius: 18,
  },
  tabSegmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabSegmentTextActive: {
    color: '#BE123C',
    fontWeight: '900',
  },

  /* Scroll Area */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },

  /* Budget Card */
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  budgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthDropdownBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthDropdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  splitRatioBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  avatarsOverlap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMicro: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMicroText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  splitRatioText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E11D48',
  },
  statusBadgeHemat: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  statusBadgeHematText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },

  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemActive: {
    backgroundColor: '#FFF1F2',
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  dropdownItemTextActive: {
    color: '#BE123C',
    fontWeight: '800',
  },

  budgetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 4,
  },
  budgetAmountMain: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  budgetBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  targetAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },

  /* Allocation Card */
  allocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  allocationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allocationTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  allocationCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  donutCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  donutHoleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  donutPercentageText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 28,
  },
  donutSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 1,
  },

  categoriesList: {
    marginTop: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  catLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  catNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  catSubtitleText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  catAmountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },

  /* Recent Receipts Card */
  receiptsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  receiptsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptsHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
  },
  receiptsList: {},
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  receiptRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  receiptThumb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3F4F6',
  },
  receiptPlaceText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  receiptDateText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  receiptRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  receiptAmountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E11D48',
  },
  receiptPayerText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '600',
  },

  /* Floating CTA */
  floatingCtaBtn: {
    backgroundColor: '#BE123C',
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#BE123C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 20,
  },
  floatingCtaText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  /* Transactions View */
  transactionsContainer: {
    marginBottom: 16,
  },
  transHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  transHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  transHeaderSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  transThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  transPlaceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  transDateLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transPayerPill: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  transPayerPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
  },
  transAmountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E11D48',
  },
  transSplitText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

export default ExpenseScreen;
