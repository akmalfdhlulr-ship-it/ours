import { ReviewsService } from '../src/modules/reviews/reviews.service';
import { ExpensesService } from '../src/modules/expenses/expenses.service';
import { WishlistService } from '../src/modules/wishlist/wishlist.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('Phase 05 & 06 Domain Invariants', () => {
  describe('Blind Reviews Service', () => {
    let reviewsService: ReviewsService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        visit: {
          findFirst: jest.fn(),
        },
        review: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
        },
      };
      reviewsService = new ReviewsService(mockPrisma);
    });

    it('should NOT leak partner review or rating before both submit (single submitter)', async () => {
      mockPrisma.visit.findFirst.mockResolvedValue({ id: 'visit-1', coupleSpaceId: 'space-1' });
      // Only user-1 submitted
      mockPrisma.review.findMany.mockResolvedValue([
        {
          id: 'rev-1',
          visitId: 'visit-1',
          authorId: 'user-1',
          overallRating: 5,
          categoryRatings: null,
          text: 'Super romantic candlelight dinner',
          createdAt: new Date(),
        },
      ]);

      const result = await reviewsService.getReviewsForVisit('user-1', 'space-1', 'visit-1');

      expect(result.revealed).toBe(false);
      expect(result.coupleScore).toBeNull();
      expect(result.myReview).not.toBeNull();
      expect(result.myReview?.overallRating).toBe(5);
      expect(result.partnerReview).toBeNull(); // Zero leak!
    });

    it('should reveal both reviews and compute simple average couple score when both submit', async () => {
      mockPrisma.visit.findFirst.mockResolvedValue({ id: 'visit-1', coupleSpaceId: 'space-1' });
      // Both user-1 and user-2 submitted
      mockPrisma.review.findMany.mockResolvedValue([
        {
          id: 'rev-1',
          visitId: 'visit-1',
          authorId: 'user-1',
          overallRating: 5,
          categoryRatings: null,
          text: 'Loved the dessert',
          createdAt: new Date(),
        },
        {
          id: 'rev-2',
          visitId: 'visit-1',
          authorId: 'user-2',
          overallRating: 4,
          categoryRatings: null,
          text: 'Music was slightly loud but great vibe',
          createdAt: new Date(),
        },
      ]);

      const result = await reviewsService.getReviewsForVisit('user-1', 'space-1', 'visit-1');

      expect(result.revealed).toBe(true);
      expect(result.coupleScore).toBe(4.5); // (5 + 4) / 2
      expect(result.myReview?.overallRating).toBe(5);
      expect(result.partnerReview?.overallRating).toBe(4);
      expect(result.partnerReview?.text).toBe('Music was slightly loud but great vibe');
    });

    it('should prevent submitting duplicate review for the same visit', async () => {
      mockPrisma.visit.findFirst.mockResolvedValue({ id: 'visit-1', coupleSpaceId: 'space-1' });
      mockPrisma.review.findUnique.mockResolvedValue({ id: 'rev-existing' });

      await expect(
        reviewsService.submitReview('user-1', 'space-1', 'visit-1', {
          overallRating: 5,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject invalid overall rating outside 1..5 range', async () => {
      mockPrisma.visit.findFirst.mockResolvedValue({ id: 'visit-1', coupleSpaceId: 'space-1' });

      await expect(
        reviewsService.submitReview('user-1', 'space-1', 'visit-1', {
          overallRating: 6,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Expenses Service', () => {
    let expensesService: ExpensesService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        coupleSpace: {
          findUnique: jest.fn(),
        },
        expense: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
      };
      expensesService = new ExpensesService(mockPrisma);
    });

    it('should require positive integer minor units for amount', async () => {
      mockPrisma.coupleSpace.findUnique.mockResolvedValue({ id: 'space-1', currencyCode: 'USD' });

      await expect(
        expensesService.createExpense('user-1', 'space-1', {
          description: 'Dinner',
          amount: 25.5, // float is forbidden
          expenseDate: '2026-10-10',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        expensesService.createExpense('user-1', 'space-1', {
          description: 'Dinner',
          amount: -500, // negative forbidden
          expenseDate: '2026-10-10',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require mandatory voidReason when voiding an expense', async () => {
      await expect(
        expensesService.voidExpense('space-1', 'exp-1', {
          voidReason: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate 50/50 balance and exclude voided expenses', async () => {
      mockPrisma.coupleSpace.findUnique.mockResolvedValue({
        id: 'space-1',
        currencyCode: 'USD',
        memberships: [
          { userId: 'u1', user: { profile: { displayName: 'Jordan' } } },
          { userId: 'u2', user: { profile: { displayName: 'Jordin' } } },
        ],
      });

      // Active expenses: Jordan paid 6000 ($60.00), Jordin paid 2000 ($20.00). Total = 8000.
      mockPrisma.expense.findMany.mockResolvedValue([
        { id: '1', amount: 6000, paidById: 'u1', status: 'ACTIVE', currencyCode: 'USD' },
        { id: '2', amount: 2000, paidById: 'u2', status: 'ACTIVE', currencyCode: 'USD' },
      ]);

      const summary = await expensesService.getSummary('space-1');

      expect(summary.totalActiveAmount).toBe(8000);
      expect(summary.partner1.totalPaid).toBe(6000);
      expect(summary.partner2?.totalPaid).toBe(2000);
      // Balance owed = (6000 - 2000) / 2 = 2000 minor units ($20.00)
      expect(summary.balanceOwed).toBe(2000);
      expect(summary.debtorUserId).toBe('u2');
      expect(summary.creditorUserId).toBe('u1');
    });
  });

  describe('Wishlist Service', () => {
    let wishlistService: WishlistService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        wishlistItem: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
      };
      wishlistService = new WishlistService(mockPrisma);
    });

    it('should create wishlist item with status ACTIVE and explicit completion timestamp on complete', async () => {
      mockPrisma.wishlistItem.create.mockImplementation((args: any) => ({
        id: 'w-1',
        ...args.data,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const item = await wishlistService.createItem('u1', 'space-1', {
        title: 'See Northern Lights in Tromsø',
        priority: 'HIGH',
      });

      expect(item.status).toBe('ACTIVE');
      expect(item.completedAt).toBeNull();
    });
  });
});
