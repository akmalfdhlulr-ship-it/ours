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

