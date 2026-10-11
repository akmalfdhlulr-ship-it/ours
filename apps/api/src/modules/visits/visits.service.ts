import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  CreateVisitRequest,
  UpdateVisitRequest,
  VisitItem,
} from '@ours/contracts';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async listVisits(userId: string, spaceId: string): Promise<VisitItem[]> {
    const visits = await this.prisma.visit.findMany({
      where: { coupleSpaceId: spaceId },
      include: {
        place: true,
        reviews: true,
      },
      orderBy: { visitedAt: 'desc' },
    });

    return visits.map((v) => this.mapToItem(v, userId));
  }

  async getVisitById(userId: string, spaceId: string, id: string): Promise<VisitItem> {
    const visit = await this.prisma.visit.findFirst({
      where: { id, coupleSpaceId: spaceId },
      include: {
        place: true,
        reviews: true,
      },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    return this.mapToItem(visit, userId);
  }

  async createVisit(
    userId: string,
    spaceId: string,
    dto: CreateVisitRequest,
  ): Promise<VisitItem> {
    const visit = await this.prisma.visit.create({
      data: {
        coupleSpaceId: spaceId,
        recordedById: userId,
        placeId: dto.placeId || null,
        datePlanId: dto.datePlanId || null,
        visitedAt: new Date(dto.visitedAt),
        notes: dto.notes?.trim() || null,
      },
      include: {
        place: true,
        reviews: true,
      },
    });

    return this.mapToItem(visit, userId);
  }

  async updateVisit(
    userId: string,
    spaceId: string,
    id: string,
    dto: UpdateVisitRequest,
  ): Promise<VisitItem> {
    const existing = await this.prisma.visit.findFirst({
      where: { id, coupleSpaceId: spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Visit not found');
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data: {
        visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : undefined,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
      },
      include: {
        place: true,
        reviews: true,
      },
    });

    return this.mapToItem(updated, userId);
  }

  private mapToItem(visit: any, currentUserId: string): VisitItem {
    const reviews = visit.reviews || [];
    const reviewsCount = reviews.length;
    const userReview = reviews.find((r: any) => r.authorId === currentUserId);
    const bothSubmitted = reviewsCount >= 2;

    let coupleScore: number | null = null;
    if (bothSubmitted) {
      const sum = reviews.reduce((acc: number, r: any) => acc + r.overallRating, 0);
      coupleScore = Math.round((sum / reviews.length) * 10) / 10;
    }

    return {
      id: visit.id,
      coupleSpaceId: visit.coupleSpaceId,
      placeId: visit.placeId,
      place: visit.place
        ? {
            id: visit.place.id,
            provider: visit.place.provider,
            providerPlaceId: visit.place.providerPlaceId,
            name: visit.place.name,
            address: visit.place.address,
            category: visit.place.category,
            latitude: visit.place.latitude,
            longitude: visit.place.longitude,
          }
        : null,
      recordedById: visit.recordedById,
      datePlanId: visit.datePlanId,
      visitedAt: visit.visitedAt.toISOString(),
      notes: visit.notes,
      createdAt: visit.createdAt.toISOString(),
      reviewsCount,
      coupleScore,
      userReviewSubmitted: !!userReview,
    };
  }
}
