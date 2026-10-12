import React, { useState } from 'react';
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
  Check,
} from 'lucide-react-native';
import { CategoryShareDto, ReceiptHistoryItemDto } from '@ours/contracts';

export interface ExpenseWebProps {
  onScanReceipt?: () => void;
  onManualExpense?: () => void;
  onViewAllReceipts?: () => void;
  onNavigateTab?: (tab: string) => void;
  customCategories?: CategoryShareDto[];
  customReceipts?: ReceiptHistoryItemDto[];
  totalSpent?: number;
  targetBudget?: number;
  trendPct?: number;
}

export const ExpenseWeb: React.FC<ExpenseWebProps> = ({
  onScanReceipt,
  onManualExpense,
  onViewAllReceipts,
  onNavigateTab,
  customCategories,
  customReceipts,
  totalSpent = 0,
  targetBudget = 5000000,
  trendPct = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'transaksi'>('ringkasan');
  const [selectedMonth, setSelectedMonth] = useState('Bulan Ini');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const availableMonths = ['Bulan Ini'];

  const categories: CategoryShareDto[] = customCategories || [];
  const recentReceipts: ReceiptHistoryItemDto[] = customReceipts || [];

  const formatRupiah = (val: number): string => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="w-full max-w-[440px] min-h-[920px] mx-auto bg-[#F8F9FF] text-gray-800 flex flex-col relative shadow-2xl rounded-[40px] overflow-hidden border border-slate-200/80 font-sans select-none">
      {/* Top Header App Bar */}
      <header className="sticky top-0 z-30 bg-[#F8F9FF]/95 backdrop-blur-md px-5 pt-8 pb-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-xs">
            <Heart size={20} className="fill-rose-500" />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Pengeluaran</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-200/80 flex items-center justify-center text-gray-600 hover:text-rose-500 transition"
          >
            <Bell size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#BE123C] text-white flex items-center justify-center font-black text-xs shadow-sm ring-2 ring-white">
            D•S
          </div>
        </div>
      </header>

      {/* Segmented Control (Ringkasan vs Transaksi) */}
      <div className="px-5 pt-3 pb-2 bg-[#F8F9FF]">
        <div className="flex bg-gray-200/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('ringkasan')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition ${
              activeTab === 'ringkasan'
                ? 'bg-white text-[#BE123C] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Ringkasan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transaksi')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition ${
              activeTab === 'transaksi'
                ? 'bg-white text-[#BE123C] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Transaksi
          </button>
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <main className="flex-1 overflow-y-auto px-5 pt-2 pb-28">
        {activeTab === 'ringkasan' ? (
          <>
            {/* Total Budget Card */}
            <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                    className="bg-gray-50 border border-gray-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-gray-800 cursor-pointer hover:bg-gray-100 transition"
                  >
                    <span>📅 {selectedMonth}</span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>

                  {showMonthDropdown && (
                    <div className="absolute top-10 left-0 w-44 bg-white rounded-2xl border border-gray-100 shadow-xl py-2 z-20">
                      {availableMonths.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(m);
                            setShowMonthDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-xs flex justify-between items-center ${
                            m === selectedMonth
                              ? 'bg-rose-50 text-[#BE123C] font-black'
                              : 'text-gray-700 hover:bg-gray-50 font-semibold'
                          }`}
                        >
                          {m}
                          {m === selectedMonth && <Check size={14} className="text-[#BE123C]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <div className="flex -space-x-1">
                      <span className="w-4 h-4 rounded-full bg-[#E11D48] text-white text-[8px] font-black flex items-center justify-center">
                        D
                      </span>
                      <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white text-[8px] font-black flex items-center justify-center">
                        S
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-rose-600">50:50</span>
                  </div>

                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full text-[11px] font-black">
                    ⤹ Hemat
                  </span>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-400 mt-1">Total Pengeluaran Kencan</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-0.5">
                {formatRupiah(totalSpent)}
              </h2>

              <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-50 text-xs">
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 font-bold px-2.5 py-1 rounded-full">
                  <TrendingDown size={14} />
                  <span>{trendPct < 0 ? `${trendPct}%` : `+${trendPct}%`} dari bulan lalu</span>
                </div>
                <div className="text-gray-400">
                  Target: <span className="font-bold text-gray-700">{formatRupiah(targetBudget)}</span>
                </div>
              </div>
            </section>

            {/* Alokasi Pengeluaran (Donut Chart & Legend) */}
            <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-black text-gray-900 tracking-tight">Alokasi Pengeluaran</h3>
                <span className="text-xs font-semibold text-gray-400">5 Kategori</span>
              </div>

              {/* Donut Chart Visual */}
              <div className="flex justify-center items-center my-3">
                <div className="relative w-[180px] h-[180px] flex items-center justify-center">
                  <svg width={size} height={size} className="-rotate-90">
                    {categories.map((cat) => {
                      const dashArray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                      const dashOffset = -currentOffset;
                      currentOffset += (cat.percentage / 100) * circumference;
                      return (
                        <circle
                          key={cat.id}
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke={cat.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          fill="none"
                        />
                      );
                    })}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-[#BE123C] flex items-center justify-center mb-0.5">
                      <Utensils size={15} />
                    </div>
                    <span className="text-2xl font-black text-gray-900 leading-none">42%</span>
                    <span className="text-[10px] font-bold text-gray-400 mt-0.5">Makan & Minum</span>
                  </div>
                </div>
              </div>

              {/* Legend Items */}
              <div className="mt-4 space-y-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <div>
                        <h4 className="font-extrabold text-gray-900">{c.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{c.subtitle}</p>
                      </div>
                    </div>
                    <span className="font-black text-gray-900">{formatRupiah(c.amount)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Struk Tanggal Terbaru */}
            <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1.5">
                  <span>🧾</span>
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">
                    Struk Tanggal Terbaru
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onViewAllReceipts}
                  className="text-xs font-bold text-[#E11D48] hover:underline"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {recentReceipts.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={rec.imageUrl}
                        alt={rec.placeName}
                        className="w-12 h-12 rounded-full object-cover bg-gray-100"
                      />
                      <div>
                        <h4 className="font-black text-gray-900">{rec.placeName}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{rec.dateLabel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#E11D48]">{formatRupiah(rec.amount)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{rec.payerLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-black text-sm text-gray-900">Riwayat Transaksi Lengkap</h3>
              <p className="text-xs text-gray-500 mt-1">Daftar semua struk & pengeluaran kencan</p>
            </div>
            {recentReceipts.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={rec.imageUrl}
                    alt={rec.placeName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-black text-gray-900">{rec.fullName || rec.placeName}</h4>
                    <p className="text-[10px] text-gray-400">{rec.dateLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#E11D48]">{formatRupiah(rec.amount)}</p>
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">
                    {rec.payerLabel}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* CTA Catat Pengeluaran */}
        <button
          type="button"
          onClick={() => {
            if (onScanReceipt) onScanReceipt();
            else if (onManualExpense) onManualExpense();
          }}
          className="w-full py-4 rounded-2xl bg-[#BE123C] hover:bg-[#9F072D] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-98 transition mt-4"
        >
          <Plus size={18} strokeWidth={3} /> Catat Pengeluaran
        </button>
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-3 flex justify-between items-center z-30">
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('beranda')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600"
        >
          <Home size={20} />
          <span className="text-[10px] font-semibold">Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('jelajah')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600"
        >
          <Compass size={20} />
          <span className="text-[10px] font-semibold">Jelajah</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('kalender')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600"
        >
          <Calendar size={20} />
          <span className="text-[10px] font-semibold">Kalender</span>
        </button>

        <button type="button" className="flex flex-col items-center gap-1 text-[#BE123C]">
          <div className="p-1 rounded-xl bg-rose-50">
            <Wallet size={20} />
          </div>
          <span className="text-[10px] font-black">Pengeluaran</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('lainnya')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-semibold">Lainnya</span>
        </button>
      </nav>
    </div>
  );
};

export default ExpenseWeb;
