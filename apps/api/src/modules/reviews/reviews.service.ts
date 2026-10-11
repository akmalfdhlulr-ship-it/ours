import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  ReviewItem,
  SubmitReviewRequest,
  VisitReviewsResponse,
} from '@ours/contracts';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReviewsForVisit(
    userId: string,
    spaceId: string,
    visitId: string,
  ): Promise<VisitReviewsResponse> {
    const visit = await this.prisma.visit.findFirst({
      where: { id: visitId, coupleSpaceId: spaceId },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    const reviews = await this.prisma.review.findMany({
      where: {
        visitId,
        coupleSpaceId: spaceId,
      },
    });

    const myReviewRecord = reviews.find((r) => r.authorId === userId);
    const partnerReviewRecord = reviews.find((r) => r.authorId !== userId);

    const bothSubmitted = reviews.length >= 2;

    // Zero-leak mutual reveal logic:
    // If both have submitted, reveal both reviews and derived couple score
    if (bothSubmitted) {
      const sum = reviews.reduce((acc, r) => acc + r.overallRating, 0);
      const coupleScore = Math.round((sum / reviews.length) * 10) / 10;

      return {
        revealed: true,
        coupleScore,
        myReview: myReviewRecord ? this.mapToItem(myReviewRecord) : null,
        partnerReview: partnerReviewRecord ? this.mapToItem(partnerReviewRecord) : null,
      };
    }

    // If only current user submitted: caller sees ONLY their own review, zero partner details or score
    if (myReviewRecord) {
      return {
        revealed: false,
        coupleScore: null,
        myReview: this.mapToItem(myReviewRecord),
        partnerReview: null,
      };
    }

    // Caller has not submitted: completely blind (cannot see partner's review)
    return {
      revealed: false,
      coupleScore: null,
      myReview: null,
      partnerReview: null,
    };
  }

  async submitReview(
    userId: string,
    spaceId: string,
    visitId: string,
    dto: SubmitReviewRequest,
  ): Promise<VisitReviewsResponse> {
    const visit = await this.prisma.visit.findFirst({
      where: { id: visitId, coupleSpaceId: spaceId },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    if (dto.overallRating < 1 || dto.overallRating > 5) {
      throw new BadRequestException('Overall rating must be between 1 and 5');
    }

    // Check if user already submitted a review for this visit
    const existing = await this.prisma.review.findUnique({
      where: {
        visitId_authorId: {
          visitId,
          authorId: userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted a review for this visit');
    }

    await this.prisma.review.create({
      data: {
        coupleSpaceId: spaceId,
        visitId,
        authorId: userId,
        overallRating: dto.overallRating,
        categoryRatings: dto.categoryRatings ? (dto.categoryRatings as any) : undefined,
        text: dto.text?.trim() || null,
      },
    });

    return this.getReviewsForVisit(userId, spaceId, visitId);
  }

  private mapToItem(review: any): ReviewItem {
    return {
      id: review.id,
      visitId: review.visitId,
      authorId: review.authorId,
      overallRating: review.overallRating,
      categoryRatings: (review.categoryRatings as any) || null,
      text: review.text,
      createdAt: review.createdAt.toISOString(),
    };
  }
}
