import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { DecisionsService } from './decisions.service';
import { DecisionPollDto, CreateDecisionPollDto, CastVoteDto } from '@ours/contracts';

@Controller('decisions')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Get()
  async list(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<DecisionPollDto[]> {
    return this.decisionsService.list(spaceId, userId);
  }

  @Post()
  async create(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDecisionPollDto,
  ): Promise<DecisionPollDto> {
    return this.decisionsService.create(spaceId, userId, dto);
  }

  @Post(':id/vote')
  async vote(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CastVoteDto,
  ): Promise<DecisionPollDto> {
    return this.decisionsService.vote(spaceId, userId, id, dto);
  }

  @Post(':id/close')
  async close(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<DecisionPollDto> {
    return this.decisionsService.close(spaceId, id, userId);
  }
}
