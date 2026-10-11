import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { SurprisesService } from './surprises.service';
import { ScheduledSurpriseDto, CreateScheduledSurpriseDto } from '@ours/contracts';

@Controller('surprises')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class SurprisesController {
  constructor(private readonly surprisesService: SurprisesService) {}

  @Get()
  async list(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ScheduledSurpriseDto[]> {
    return this.surprisesService.list(spaceId, userId);
  }

  @Post()
  async create(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateScheduledSurpriseDto,
  ): Promise<ScheduledSurpriseDto> {
    return this.surprisesService.create(spaceId, userId, dto);
  }
}
