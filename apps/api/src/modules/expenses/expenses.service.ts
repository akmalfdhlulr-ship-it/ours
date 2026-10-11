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
    const normalizedAmount = Math.round(Number(dto.amount));
    if (isNaN(normalizedAmount) || normalizedAmount <= 0) {
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
        amount: normalizedAmount,
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
