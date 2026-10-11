export type ExpenseStatus = 'ACTIVE' | 'VOIDED';

export interface ExpenseItem {
  id: string;
  coupleSpaceId: string;
  datePlanId: string | null;
  paidById: string;
  description: string;
  amount: number; // Integer minor units (e.g. cents)
  currencyCode: string;
  category: string | null;
  status: ExpenseStatus;
  expenseDate: string;
  voidReason: string | null;
  createdAt: string;
}

export interface CreateExpenseRequest {
  datePlanId?: string;
  description: string;
  amount: number; // Integer minor units
  currencyCode?: string;
  category?: string;
  expenseDate: string;
}

export interface VoidExpenseRequest {
  voidReason: string;
}

export type SplitMode = 'FIFTY_FIFTY' | 'DANIEL_FULL' | 'SASA_FULL' | 'CUSTOM';

export type ExpenseCategoryKey =
  | 'MAKAN_MINUM'
  | 'AKTIVITAS_HIBURAN'
  | 'TRANSPORTASI'
  | 'BELANJA_BERSAMA'
  | 'LAINNYA';

export interface CategoryShareDto {
  id: string;
  key: string;
  name: string;
  subtitle: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface ReceiptHistoryItemDto {
  id: string;
  placeName: string;
  fullName?: string;
  dateLabel: string;
  amount: number;
  payerLabel: string;
  splitLabel?: string;
  imageUrl: string;
}

export interface ExpenseSummaryResponse {
  totalActiveAmount: number;
  currencyCode: string;
  partner1: {
    userId: string;
    displayName: string;
    totalPaid: number;
  };
  partner2: {
    userId: string;
    displayName: string;
    totalPaid: number;
  } | null;
  balanceOwed: number; // Positive means partner2 owes partner1, negative means partner1 owes partner2
  debtorUserId: string | null;
  creditorUserId: string | null;
  
  // Layar 8 Analytics & Budget Extension
  period?: string;
  month?: number;
  year?: number;
  totalSpent?: number;
  targetBudget?: number;
  trendPercentage?: number;
  statusLabel?: string;
  splitRatio?: string;
  activeTab?: string;
  categories?: CategoryShareDto[];
  recentReceipts?: ReceiptHistoryItemDto[];
}

export interface ScanReceiptRequest {
  imageBase64?: string;
  imageUrl?: string;
}

export interface OcrReceiptItemDto {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  category?: 'Makanan' | 'Minuman' | 'Lainnya';
}

export interface OcrReceiptResultDto {
  rawText: string;
  merchantName: string | null;
  address?: string | null;
  transactionDate: string | null;
  transactionTime?: string | null;
  category?: string | null;
  subCategory?: string | null;
  imageUrl?: string | null;
  items: OcrReceiptItemDto[];
  subtotal: number | null;
  tax: number | null;
  serviceCharge: number | null;
  grandTotal: number | null;
  currency: string;
  confidence: number;
  engine: string;
  isArithmeticConsistent: boolean;
}

