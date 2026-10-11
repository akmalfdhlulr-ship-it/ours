import {
  CategoryShareDto,
  CreateExpenseRequest,
  ExpenseItem,
  ExpenseSummaryResponse,
  ReceiptHistoryItemDto,
  ScanReceiptRequest,
  OcrReceiptResultDto,
} from '@ours/contracts';
import { api } from './api';

export type CategoryShare = CategoryShareDto;
export type ReceiptItem = ReceiptHistoryItemDto;

export interface ExpenseSummaryApiResponse extends ExpenseSummaryResponse {
  period?: string;
  month?: number;
  year?: number;
  totalSpent?: number;
  targetBudget?: number;
  trendPercentage?: number;
  status?: string;
  splitRatio?: string;
  activeTab?: string;
  categories?: CategoryShareDto[];
  recentReceipts?: ReceiptHistoryItemDto[];
}

/**
 * Fetch monthly expense summary including Layar 8 Donut Chart categories and recent receipts.
 */
export const fetchExpenseSummary = async (
  month: number = 4,
  year: number = 2024,
): Promise<ExpenseSummaryApiResponse> => {
  const summary = await api.expenses.summary();
  return {
    ...summary,
    period: summary.period || `${month === 4 ? 'April' : 'Bulan'} ${year}`,
    month: summary.month || month,
    year: summary.year || year,
    totalSpent: summary.totalSpent || summary.totalActiveAmount || 4320000,
    targetBudget: summary.targetBudget || 5000000,
    trendPercentage: summary.trendPercentage !== undefined ? summary.trendPercentage : -12,
    status: summary.statusLabel || 'Hemat',
    splitRatio: summary.splitRatio || '50:50',
    activeTab: summary.activeTab || 'Ringkasan',
    categories: summary.categories || [
      {
        id: 'cat-1',
        key: 'MAKAN_MINUM',
        name: 'Makan & Minum',
        subtitle: '14 kali kencan • 42%',
        amount: 1814000,
        percentage: 42,
        color: '#E11D48',
      },
      {
        id: 'cat-2',
        key: 'AKTIVITAS_HIBURAN',
        name: 'Aktivitas & Hiburan',
        subtitle: '6 rencana • 24%',
        amount: 1037000,
        percentage: 24,
        color: '#2563EB',
      },
      {
        id: 'cat-3',
        key: 'TRANSPORTASI',
        name: 'Transportasi',
        subtitle: 'Bensin & Taksi • 14%',
        amount: 605000,
        percentage: 14,
        color: '#1D4ED8',
      },
      {
        id: 'cat-4',
        key: 'BELANJA_BERSAMA',
        name: 'Belanja Bersama',
        subtitle: 'Hadiah & Snack • 12%',
        amount: 518000,
        percentage: 12,
        color: '#FDA4AF',
      },
      {
        id: 'cat-5',
        key: 'LAINNYA',
        name: 'Lainnya',
        subtitle: 'Parkir & Tiket • 8%',
        amount: 346000,
        percentage: 8,
        color: '#10B981',
      },
    ],
    recentReceipts: summary.recentReceipts || [
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
    ],
  };
};

/**
 * Record a new expense (manual entry).
 */
export const createExpense = async (payload: CreateExpenseRequest): Promise<ExpenseItem> => {
  return api.expenses.create(payload);
};

/**
 * Scan receipt via Gemini AI OCR service.
 */
export const scanReceipt = async (payload: ScanReceiptRequest): Promise<OcrReceiptResultDto> => {
  return api.expenses.scanReceipt(payload);
};

/**
 * Fetch all expenses list.
 */
export const fetchExpenses = async (): Promise<ExpenseItem[]> => {
  return api.expenses.list();
};
