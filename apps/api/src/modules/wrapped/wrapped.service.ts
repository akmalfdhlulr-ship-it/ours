import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import { OursWrappedDto } from '@ours/contracts';

@Injectable()
export class WrappedService {
  constructor(private readonly prisma: PrismaService) {}

  async getWrapped(coupleSpaceId: string, targetYear?: number): Promise<OursWrappedDto> {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { id: coupleSpaceId },
    });

    if (!space) {
      throw new NotFoundException('Couple space not found');
    }

    const year = targetYear || new Date().getFullYear();

    // 1. Days together
    const baseDate = space.anniversaryDate || space.createdAt;
    const diffMs = Math.max(0, Date.now() - new Date(baseDate).getTime());
    const daysTogether = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // 2. Dates
    const allDates = await this.prisma.datePlan.findMany({
      where: { coupleSpaceId },
    });
    const totalDatesPlanned = allDates.length;
    const totalDatesCompleted = allDates.filter((d: any) => d.status === 'COMPLETED').length;

    // 3. Visits & Top Place Categories
    const visits = await this.prisma.visit.findMany({
      where: { coupleSpaceId },
      include: {
        place: true,
        reviews: true,
      },
    });
    const totalVisitsLogged = visits.length;

    const categoryMap = new Map<string, number>();
    let mostMemorableSpot: string | undefined = undefined;

    for (const v of visits) {
      if (v.place?.category) {
        categoryMap.set(v.place.category, (categoryMap.get(v.place.category) || 0) + 1);
      }
      if (!mostMemorableSpot && v.place?.name) {
        mostMemorableSpot = v.place.name;
      }
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 4. Derived Average Couple Rating
    let totalScoreSum = 0;
    let scoredVisitCount = 0;
    for (const v of visits) {
      if (v.reviews.length >= 2) {
        const avg = (v.reviews[0].overallRating + v.reviews[1].overallRating) / 2;
        totalScoreSum += avg;
        scoredVisitCount++;
      }
    }
    const coupleScoreAverage =
      scoredVisitCount > 0 ? Math.round((totalScoreSum / scoredVisitCount) * 10) / 10 : null;

    // 5. Memories & Media
    const totalMemoriesCreated = await this.prisma.memory.count({
      where: { coupleSpaceId },
    });

    const totalMediaUploaded = await this.prisma.mediaAsset.count({
      where: { coupleSpaceId, status: 'ACTIVE' },
    });

    // 6. Expenses (Strictly ACTIVE, never VOIDED)
    const expenses = await this.prisma.expense.findMany({
      where: { coupleSpaceId, status: 'ACTIVE' },
    });
    const totalExpensesAmount = expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0);

    return {
      year,
      daysTogether,
      totalDatesPlanned,
      totalDatesCompleted,
      totalVisitsLogged,
      topCategories,
      totalMemoriesCreated,
      totalMediaUploaded,
      totalExpensesAmount,
      currencyCode: space.currencyCode || 'USD',
      coupleScoreAverage,
      mostMemorableSpot,
      generatedAt: new Date().toISOString(),
    };
  }
}
