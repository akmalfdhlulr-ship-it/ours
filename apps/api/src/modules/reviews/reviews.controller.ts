import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import {
  SubmitReviewRequest,
  VisitReviewsResponse,
} from '@ours/contracts';
import { ReviewsService } from './reviews.service';

@Controller('visits/:visitId/reviews')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getReviews(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Param('visitId') visitId: string,
  ): Promise<{ data: VisitReviewsResponse }> {
    const data = await this.reviewsService.getReviewsForVisit(userId, spaceId, visitId);
    return { data };
  }

  @Post()
  async submitReview(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Param('visitId') visitId: string,
    @Body() body: SubmitReviewRequest,
  ): Promise<{ data: VisitReviewsResponse }> {
    const data = await this.reviewsService.submitReview(userId, spaceId, visitId, body);
    return { data };
  }
}
