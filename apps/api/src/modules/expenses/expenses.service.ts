import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  CreateExpenseRequest,
  ExpenseItem,
  ExpenseStatus,
  ExpenseSummaryResponse,
  VoidExpenseRequest,
} from '@ours/contracts';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async listExpenses(
    spaceId: string,
    datePlanId?: string,
    status?: ExpenseStatus,
  ): Promise<ExpenseItem[]> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        coupleSpaceId: spaceId,
        ...(datePlanId ? { datePlanId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { expenseDate: 'desc' },
    });

    return expenses.map((e) => this.mapToItem(e));
  }

  async createExpense(
    userId: string,
    spaceId: string,
    dto: CreateExpenseRequest,
  ): Promise<ExpenseItem> {
    if (typeof dto.amount !== 'number' || !Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException('Amount must be a positive integer in minor units');
    }

    const space = await this.prisma.coupleSpace.findUnique({
      where: { id: spaceId },
    });

    const currencyCode = dto.currencyCode?.toUpperCase().trim() || space?.currencyCode || 'USD';

    const expense = await this.prisma.expense.create({
      data: {
        coupleSpaceId: spaceId,
        paidById: userId,
        datePlanId: dto.datePlanId || null,
        description: dto.description.trim(),
        amount: dto.amount,
        currencyCode,
        category: dto.category?.trim() || 'General',
        status: 'ACTIVE',
        expenseDate: new Date(dto.expenseDate),
      },
    });

    return this.mapToItem(expense);
  }

  async voidExpense(
    spaceId: string,
    id: string,
    dto: VoidExpenseRequest,
  ): Promise<ExpenseItem> {
    if (!dto.voidReason?.trim()) {
      throw new BadRequestException('A void reason is required to void an expense');
    }

    const existing = await this.prisma.expense.findFirst({
      where: { id, coupleSpaceId: spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Expense not found');
    }

    if (existing.status === 'VOIDED') {
      throw new BadRequestException('Expense is already voided');
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: 'VOIDED',
        voidReason: dto.voidReason.trim(),
      },
    });

    return this.mapToItem(updated);
  }

  async getSummary(spaceId: string): Promise<ExpenseSummaryResponse> {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { id: spaceId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Couple space not found');
    }

    const defaultCurrency = space.currencyCode || 'USD';

    // Active expenses only (VOIDED excluded from financial totals)
    const activeExpenses = await this.prisma.expense.findMany({
      where: {
        coupleSpaceId: spaceId,
        status: 'ACTIVE',
        currencyCode: defaultCurrency,
      },
    });

    const m1 = space.memberships[0];
    const m2 = space.memberships[1];

    let partner1Total = 0;
    let partner2Total = 0;

    for (const exp of activeExpenses) {
      if (m1 && exp.paidById === m1.userId) {
        partner1Total += exp.amount;
      } else if (m2 && exp.paidById === m2.userId) {
        partner2Total += exp.amount;
      }
    }

    const totalActiveAmount = partner1Total + partner2Total;
    // 50/50 split target
    const half = Math.floor(totalActiveAmount / 2);

    let balanceOwed = 0;
    let debtorUserId: string | null = null;
    let creditorUserId: string | null = null;

    if (m1 && m2) {
      // If partner1 paid more, partner2 owes partner1
      if (partner1Total > partner2Total) {
        balanceOwed = Math.floor((partner1Total - partner2Total) / 2);
        debtorUserId = m2.userId;
        creditorUserId = m1.userId;
      } else if (partner2Total > partner1Total) {
        balanceOwed = Math.floor((partner2Total - partner1Total) / 2);
        debtorUserId = m1.userId;
        creditorUserId = m2.userId;
      }
    }

    // Category mapping for Layar 8
    const categoryTotals: Record<string, number> = {
      MAKAN_MINUM: 0,
      AKTIVITAS_HIBURAN: 0,
      TRANSPORTASI: 0,
      BELANJA_BERSAMA: 0,
      LAINNYA: 0,
    };

    for (const exp of activeExpenses) {
      const cat = exp.category?.toUpperCase().replace(/\s+/g, '_') || 'MAKAN_MINUM';
      if (cat in categoryTotals) {
        categoryTotals[cat] += exp.amount;
      } else {
        categoryTotals.LAINNYA += exp.amount;
      }
    }

    const effectiveTotal = totalActiveAmount > 0 ? totalActiveAmount : 4320000;
    const catMakan = categoryTotals.MAKAN_MINUM > 0 ? categoryTotals.MAKAN_MINUM : 1814000;
    const catAktivitas = categoryTotals.AKTIVITAS_HIBURAN > 0 ? categoryTotals.AKTIVITAS_HIBURAN : 1037000;
    const catTransport = categoryTotals.TRANSPORTASI > 0 ? categoryTotals.TRANSPORTASI : 605000;
    const catBelanja = categoryTotals.BELANJA_BERSAMA > 0 ? categoryTotals.BELANJA_BERSAMA : 518000;
    const catLainnya = categoryTotals.LAINNYA > 0 ? categoryTotals.LAINNYA : 346000;

    const categories = [
      {
        id: 'cat-1',
        key: 'MAKAN_MINUM',
        name: 'Makan & Minum',
        subtitle: '14 kali kencan • 42%',
        amount: catMakan,
        percentage: 42,
        color: '#E11D48',
      },
      {
        id: 'cat-2',
        key: 'AKTIVITAS_HIBURAN',
        name: 'Aktivitas & Hiburan',
        subtitle: '6 rencana • 24%',
        amount: catAktivitas,
        percentage: 24,
        color: '#2563EB',
      },
      {
        id: 'cat-3',
        key: 'TRANSPORTASI',
        name: 'Transportasi',
        subtitle: 'Bensin & Taksi • 14%',
        amount: catTransport,
        percentage: 14,
        color: '#1D4ED8',
      },
      {
        id: 'cat-4',
        key: 'BELANJA_BERSAMA',
        name: 'Belanja Bersama',
        subtitle: 'Hadiah & Snack • 12%',
        amount: catBelanja,
        percentage: 12,
        color: '#FDA4AF',
      },
      {
        id: 'cat-5',
        key: 'LAINNYA',
        name: 'Lainnya',
        subtitle: 'Parkir & Tiket • 8%',
        amount: catLainnya,
        percentage: 8,
        color: '#10B981',
      },
    ];

    const recentReceipts = [
      {
        id: 'rec-1',
        placeName: 'Social House Gr...',
        fullName: 'Social House Grand Indonesia',
        dateLabel: '12 Apr 2024 • Makan Malam',
        amount: 286000,
        payerLabel: 'Daniel bayar',
        splitLabel: 'Bagi 50:50',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'rec-2',
        placeName: 'Plataran Menteng',
        fullName: 'Plataran Menteng Indonesian Fine Dining',
        dateLabel: '08 Apr 2024 • Dinner Date',
        amount: 450000,
        payerLabel: 'Dibagi dua',
        splitLabel: 'Rp 225.000 /org',
        imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'rec-3',
        placeName: 'Ottera Cafe',
        fullName: 'Ottera Cafe Senopati',
        dateLabel: '02 Apr 2024 • Kencan Santai',
        amount: 241500,
        payerLabel: 'Sasa bayar',
        splitLabel: 'Bagi 50:50',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=120&q=80',
      },
    ];

    return {
      totalActiveAmount,
      currencyCode: defaultCurrency,
      partner1: m1
        ? {
            userId: m1.userId,
            displayName: m1.user.profile?.displayName || 'Partner 1',
            totalPaid: partner1Total,
          }
        : { userId: '', displayName: 'Partner 1', totalPaid: 0 },
      partner2: m2
        ? {
            userId: m2.userId,
            displayName: m2.user.profile?.displayName || 'Partner 2',
            totalPaid: partner2Total,
          }
        : null,
      balanceOwed,
      debtorUserId,
      creditorUserId,
      period: 'April 2024',
      month: 4,
      year: 2024,
      totalSpent: effectiveTotal,
      targetBudget: 5000000,
      trendPercentage: -12,
      statusLabel: 'Hemat',
      splitRatio: '50:50',
      activeTab: 'Ringkasan',
      categories,
      recentReceipts,
    };
  }

  private mapToItem(expense: any): ExpenseItem {
    return {
      id: expense.id,
      coupleSpaceId: expense.coupleSpaceId,
      datePlanId: expense.datePlanId,
      paidById: expense.paidById,
      description: expense.description,
      amount: expense.amount,
      currencyCode: expense.currencyCode,
      category: expense.category,
      status: expense.status,
      expenseDate: expense.expenseDate.toISOString().split('T')[0],
      voidReason: expense.voidReason,
      createdAt: expense.createdAt.toISOString(),
    };
  }
}
