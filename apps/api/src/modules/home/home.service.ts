import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import { HomeDashboardResponse } from '@ours/contracts';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string, spaceId: string): Promise<HomeDashboardResponse> {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { id: spaceId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Couple space not found');
    }

    // Partner calculation
    const partnerMembership = space.memberships.find((m) => m.userId !== userId);
    const partner = partnerMembership
      ? {
          id: partnerMembership.user.id,
          displayName: partnerMembership.user.profile?.displayName || 'Partner',
          avatarUrl: partnerMembership.user.profile?.avatarUrl || null,
          email: partnerMembership.user.email,
        }
      : null;

    // Days together calculation (derived, never independent editable metric)
    const baseDate = space.anniversaryDate || space.createdAt;
    const now = new Date();
    const diffMs = now.getTime() - new Date(baseDate).getTime();
    const daysTogether = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Next anniversary countdown
    let daysUntilNextAnniversary: number | null = null;
    let milestone: string | null = null;

    if (space.anniversaryDate) {
      const anniv = new Date(space.anniversaryDate);
      const currentYear = now.getFullYear();
      let nextAnniv = new Date(currentYear, anniv.getMonth(), anniv.getDate());
      if (nextAnniv.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
        nextAnniv = new Date(currentYear + 1, anniv.getMonth(), anniv.getDate());
      }
      const annivDiffMs = nextAnniv.getTime() - now.getTime();
      daysUntilNextAnniversary = Math.max(0, Math.ceil(annivDiffMs / (1000 * 60 * 60 * 24)));

      const yearsTogether = Math.floor(daysTogether / 365);
      if (yearsTogether >= 1) {
        milestone = `${yearsTogether} Year${yearsTogether > 1 ? 's' : ''} Together`;
      }
    } else if (daysTogether > 0 && daysTogether % 100 === 0) {
      milestone = `${daysTogether} Days Milestone!`;
    }

    // Upcoming dates
    const datePlans = await this.prisma.datePlan.findMany({
      where: {
        coupleSpaceId: spaceId,
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
      },
      orderBy: { plannedDate: 'asc' },
      take: 3,
      include: {
        stops: true,
      },
    });

    const upcomingDates = datePlans.map((d) => ({
      id: d.id,
      title: d.title,
      plannedDate: d.plannedDate ? d.plannedDate.toISOString().split('T')[0] : null,
      status: d.status,
      stopsCount: d.stops.length,
    }));

    // Recent memories
    const memories = await this.prisma.memory.findMany({
      where: { coupleSpaceId: spaceId },
      orderBy: { memoryDate: 'desc' },
      take: 4,
      include: {
        media: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    });

    const recentMemories = memories.map((m) => ({
      id: m.id,
      title: m.title,
      memoryDate: m.memoryDate.toISOString().split('T')[0],
      coverUrl: m.media[0]?.mediaAsset ? `/api/v1/media/${m.media[0].mediaAsset.id}/file` : null,
      isFavorite: m.isFavorite,
    }));

    // On This Day: search memories with same month and day from previous years
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const candidateMemories = await this.prisma.memory.findMany({
      where: {
        coupleSpaceId: spaceId,
        memoryDate: { lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
      include: {
        media: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { memoryDate: 'desc' },
    });

    const onThisDayMemoryMatch = candidateMemories.find((m) => {
      const d = new Date(m.memoryDate);
      return d.getMonth() + 1 === currentMonth && d.getDate() === currentDay;
    });

    const onThisDay = {
      memory: onThisDayMemoryMatch
        ? {
            id: onThisDayMemoryMatch.id,
            title: onThisDayMemoryMatch.title,
            memoryDate: onThisDayMemoryMatch.memoryDate.toISOString().split('T')[0],
            yearsAgo: now.getFullYear() - new Date(onThisDayMemoryMatch.memoryDate).getFullYear(),
            coverUrl: onThisDayMemoryMatch.media[0]?.mediaAsset
              ? `/api/v1/media/${onThisDayMemoryMatch.media[0].mediaAsset.id}/file`
              : null,
          }
        : null,
      milestone,
    };

    return {
      coupleSpace: {
        id: space.id,
        name: space.name,
        status: space.status,
        currencyCode: space.currencyCode,
        timezone: space.timezone,
        anniversaryDate: space.anniversaryDate
          ? space.anniversaryDate.toISOString().split('T')[0]
          : null,
        daysTogether,
        daysUntilNextAnniversary,
      },
      partner,
      upcomingDates,
      recentMemories,
      onThisDay,
    };
  }
}
