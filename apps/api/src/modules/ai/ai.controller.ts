import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { AiService } from './ai.service';
import {
  AiDatePlanProposalDto,
  AiDateRecommendationDto,
  AiRelationshipInsightDto,
  AiPlanRequestDto,
} from '@ours/contracts';

@Controller('ai')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('plan-date')
  async planDate(
    @CurrentSpace('id') spaceId: string,
    @Body() dto: AiPlanRequestDto,
  ): Promise<AiDatePlanProposalDto> {
    return this.aiService.planDate(spaceId, dto);
  }

  @Post('recommendations')
  async getRecommendations(
    @CurrentSpace('id') spaceId: string,
  ): Promise<AiDateRecommendationDto[]> {
    return this.aiService.getRecommendations(spaceId);
  }

  @Get('insights')
  async getInsights(
    @CurrentSpace('id') spaceId: string,
  ): Promise<AiRelationshipInsightDto[]> {
    return this.aiService.getInsights(spaceId);
  }

  @Get('consent')
  getConsent(
    @CurrentSpace('id') spaceId: string,
  ): { enabled: boolean } {
    return { enabled: this.aiService.isConsentEnabled(spaceId) };
  }

  @Post('consent')
  setConsent(
    @CurrentSpace('id') spaceId: string,
    @Body() body: { enabled: boolean },
  ): { enabled: boolean } {
    return this.aiService.setConsent(spaceId, Boolean(body.enabled));
  }
}
