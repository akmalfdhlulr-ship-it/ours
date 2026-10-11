import { ExpensesService } from '../src/modules/expenses/expenses.service';
import { DatesService } from '../src/modules/dates/dates.service';
import { WishlistService } from '../src/modules/wishlist/wishlist.service';
import { NotFoundException } from '@nestjs/common';

describe('Database Persistence & Lifecycle Verification (Create, Read-Back, Update, Delete & Isolation)', () => {
  const spaceId = 'space-test-persisted-1111';
  const otherSpaceId = 'space-intruder-9999';
  const user1 = 'user-alice-persisted-1111';
  const user2 = 'user-bob-persisted-2222';

  describe('1. Expenses Lifecycle (Create -> Read-Back -> Void -> CoupleSpace Isolation)', () => {
    let service: ExpensesService;
    let inMemoryDb: any[];

    beforeEach(() => {
      inMemoryDb = [];
      const mockPrisma: any = {
        coupleSpace: {
          findUnique: jest.fn().mockResolvedValue({
            id: spaceId,
            currencyCode: 'IDR',
            memberships: [
              { userId: user1, user: { displayName: 'Alice' } },
              { userId: user2, user: { displayName: 'Bob' } },
            ],
          }),
        },
        expense: {
          create: jest.fn().mockImplementation(({ data }) => {
            const record = {
              id: `exp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              coupleSpaceId: data.coupleSpaceId,
              paidById: data.paidById,
              description: data.description,
              amount: data.amount,
              currencyCode: data.currencyCode || 'IDR',
              category: data.category || null,
              status: 'ACTIVE',
              expenseDate: new Date(data.expenseDate),
              voidReason: null,
              createdAt: new Date(),
              datePlanId: data.datePlanId || null,
            };
            inMemoryDb.push(record);
            return Promise.resolve(record);
          }),
          findMany: jest.fn().mockImplementation(({ where }) => {
            let list = [...inMemoryDb];
            if (where.coupleSpaceId) {
              list = list.filter((r) => r.coupleSpaceId === where.coupleSpaceId);
            }
            if (where.status) {
              list = list.filter((r) => r.status === where.status);
            }
            return Promise.resolve(list);
          }),
          findFirst: jest.fn().mockImplementation(({ where }) => {
            const found = inMemoryDb.find(
              (r) => r.id === where.id && r.coupleSpaceId === where.coupleSpaceId,
            );
            return Promise.resolve(found || null);
          }),
          update: jest.fn().mockImplementation(({ where, data }) => {
            const idx = inMemoryDb.findIndex((r) => r.id === where.id);
            if (idx === -1) throw new Error('Not found');
            inMemoryDb[idx] = { ...inMemoryDb[idx], ...data };
            return Promise.resolve(inMemoryDb[idx]);
          }),
        },
        coupleMembership: {
          findMany: jest.fn().mockResolvedValue([
            { userId: user1, user: { displayName: 'Alice' } },
            { userId: user2, user: { displayName: 'Bob' } },
          ]),
        },
      };

      service = new ExpensesService(mockPrisma);
    });

    it('Step 1 (Create): Persists new expense with exact IDR amount and category', async () => {
      const created = await service.createExpense(user1, spaceId, {
        description: 'Makan Malam Romantis Sofia Gunawarman',
        amount: 350000,
        category: 'Makan & Minum',
        expenseDate: '2026-10-11T12:00:00.000Z',
      });

      expect(created).toBeDefined();
      expect(created.id).toContain('exp-');
      expect(created.amount).toBe(350000);
      expect(created.status).toBe('ACTIVE');
      expect(created.coupleSpaceId).toBe(spaceId);
    });

    it('Step 2 (Read-Back & Summary): Reads back persisted expense and computes 50:50 balance owed', async () => {
      // Alice pays 350.000
      await service.createExpense(user1, spaceId, {
        description: 'Makan Malam',
        amount: 350000,
        expenseDate: '2026-10-11T12:00:00.000Z',
      });
      // Bob pays 150.000
      await service.createExpense(user2, spaceId, {
        description: 'Kopi & Dessert',
        amount: 150000,
        expenseDate: '2026-10-11T14:00:00.000Z',
      });

      const summary = await service.getSummary(spaceId);
      expect(summary.totalActiveAmount).toBe(500000);
      expect(summary.partner1.totalPaid).toBe(350000);
      expect(summary.partner2?.totalPaid).toBe(150000);
      // Balance owed: Bob owes Alice 100.000
      expect(summary.balanceOwed).toBe(100000);
      expect(summary.debtorUserId).toBe(user2);
      expect(summary.creditorUserId).toBe(user1);
    });

    it('Step 3 (Update/Void): Voids expense and removes it from active financial balance', async () => {
      const created = await service.createExpense(user1, spaceId, {
        description: 'Tiket Bioskop',
        amount: 120000,
        expenseDate: '2026-10-11T12:00:00.000Z',
      });

      const voided = await service.voidExpense(spaceId, created.id, {
        voidReason: 'Salah input nominal',
      });
      expect(voided.status).toBe('VOIDED');
      expect(voided.voidReason).toBe('Salah input nominal');

      // Read-back active summary
      const summary = await service.getSummary(spaceId);
      expect(summary.totalActiveAmount).toBe(0);
    });

    it('Step 4 (Authorization Boundary): Rejects access to expense from different couple space', async () => {
      const created = await service.createExpense(user1, spaceId, {
        description: 'Secret Dinner',
        amount: 200000,
        expenseDate: '2026-10-11T12:00:00.000Z',
      });

      // Attempting to void or read from an unauthorized couple space
      await expect(
        service.voidExpense(otherSpaceId, created.id, { voidReason: 'Intrusion test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('2. Date Plans Lifecycle (Create Plan & Stops -> Read-Back -> Status Transition)', () => {
    let service: DatesService;
    let plansDb: any[];

    beforeEach(() => {
      plansDb = [];
      const mockPrisma: any = {
        datePlan: {
          create: jest.fn().mockImplementation(({ data }) => {
            const plan = {
              id: `plan-${Date.now()}`,
              coupleSpaceId: data.coupleSpaceId,
              title: data.title,
              status: 'DRAFT',
              plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
              notes: data.notes || null,
              budgetAmount: data.budgetAmount || null,
              currencyCode: data.currencyCode || 'IDR',
              createdById: data.createdById,
              stops: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            plansDb.push(plan);
            return Promise.resolve(plan);
          }),
          findFirst: jest.fn().mockImplementation(({ where }) => {
            const found = plansDb.find(
              (p) => p.id === where.id && p.coupleSpaceId === where.coupleSpaceId,
            );
            return Promise.resolve(found || null);
          }),
          update: jest.fn().mockImplementation(({ where, data }) => {
            const idx = plansDb.findIndex((p) => p.id === where.id);
            if (idx === -1) throw new Error('Not found');
            plansDb[idx] = { ...plansDb[idx], ...data };
            return Promise.resolve(plansDb[idx]);
          }),
        },
      };

      service = new DatesService(mockPrisma);
    });

    it('Creates date plan and reads back complete details', async () => {
      const plan = await service.createPlan(user1, spaceId, {
        title: 'Kencan Akhir Pekan Dago & Punclut',
        plannedDate: '2026-10-17T18:00:00.000Z',
      });

      expect(plan.id).toBeDefined();
      expect(plan.title).toBe('Kencan Akhir Pekan Dago & Punclut');
      expect(plan.status).toBe('DRAFT');

      // Read back
      const readBack = await service.getPlanById(spaceId, plan.id);
      expect(readBack.title).toBe('Kencan Akhir Pekan Dago & Punclut');
    });

    it('Enforces CoupleSpace isolation on date plans', async () => {
      const plan = await service.createPlan(user1, spaceId, { title: 'Rencana Privat' });
      await expect(service.getPlanById(otherSpaceId, plan.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Wishlist Lifecycle (Add -> Read-Back -> Status Update)', () => {
    let service: WishlistService;
    let wishlistDb: any[];

    beforeEach(() => {
      wishlistDb = [];
      const mockPrisma: any = {
        wishlistItem: {
          create: jest.fn().mockImplementation(({ data }) => {
            const item = {
              id: `wish-${Date.now()}`,
              coupleSpaceId: data.coupleSpaceId,
              createdById: data.createdById,
              title: data.title,
              description: data.description || null,
              category: data.category || 'Kencan',
              priority: data.priority || 'MEDIUM',
              status: 'ACTIVE',
              targetDate: null,
              budgetAmount: null,
              placeId: null,
              linkedPlace: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            wishlistDb.push(item);
            return Promise.resolve(item);
          }),
          findMany: jest.fn().mockImplementation(({ where }) => {
            return Promise.resolve(wishlistDb.filter((w) => w.coupleSpaceId === where.coupleSpaceId));
          }),
          findFirst: jest.fn().mockImplementation(({ where }) => {
            return Promise.resolve(
              wishlistDb.find((w) => w.id === where.id && w.coupleSpaceId === where.coupleSpaceId) || null,
            );
          }),
          update: jest.fn().mockImplementation(({ where, data }) => {
            const idx = wishlistDb.findIndex((w) => w.id === where.id);
            wishlistDb[idx] = { ...wishlistDb[idx], ...data };
            return Promise.resolve(wishlistDb[idx]);
          }),
        },
      };

      service = new WishlistService(mockPrisma);
    });

    it('Persists wishlist item and updates status to COMPLETED', async () => {
      const item = await service.createItem(user1, spaceId, {
        title: 'Mencoba Kafe Lilin Dago',
        category: 'Kafe',
      });
      expect(item.status).toBe('ACTIVE');

      const updated = await service.updateItem(spaceId, item.id, { status: 'COMPLETED' });
      expect(updated.status).toBe('COMPLETED');

      const items = await service.listItems(spaceId);
      expect(items[0].status).toBe('COMPLETED');
    });
  });
});
