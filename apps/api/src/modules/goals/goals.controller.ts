import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { GoalsService } from './goals.service';
import { CoupleGoalDto, CreateCoupleGoalDto, ToggleMilestoneDto } from '@ours/contracts';

@Controller('goals')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async list(@CurrentSpace('id') spaceId: string): Promise<CoupleGoalDto[]> {
    return this.goalsService.list(spaceId);
  }

  @Post()
  async create(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCoupleGoalDto,
  ): Promise<CoupleGoalDto> {
    return this.goalsService.create(spaceId, userId, dto);
  }

  @Patch(':id/milestones/:milestoneId')
  async toggleMilestone(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: ToggleMilestoneDto,
  ): Promise<CoupleGoalDto> {
    return this.goalsService.toggleMilestone(spaceId, id, milestoneId, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.goalsService.delete(spaceId, id);
    return { success: true };
  }
}
