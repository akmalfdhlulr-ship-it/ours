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
  month: number = new Date().getMonth() + 1,
  year: number = new Date().getFullYear(),
): Promise<ExpenseSummaryApiResponse> => {
  const summary = await api.expenses.summary();
  const currentMonthName = new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' });
  return {
    ...summary,
    period: summary.period || `${currentMonthName} ${year}`,
    month: summary.month || month,
    year: summary.year || year,
    totalSpent: summary.totalSpent ?? summary.totalActiveAmount ?? 0,
    targetBudget: summary.targetBudget || 5000000,
    trendPercentage: summary.trendPercentage !== undefined ? summary.trendPercentage : 0,
    status: summary.statusLabel || (summary.totalActiveAmount ? 'Tercatat' : 'Bersih'),
    splitRatio: summary.splitRatio || '50:50',
    activeTab: summary.activeTab || 'Ringkasan',
    categories: summary.categories || [],
    recentReceipts: summary.recentReceipts || [],
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
