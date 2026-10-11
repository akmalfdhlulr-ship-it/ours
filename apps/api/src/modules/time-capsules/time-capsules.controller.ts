import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { TimeCapsulesService } from './time-capsules.service';
import { TimeCapsuleDto, CreateTimeCapsuleDto } from '@ours/contracts';

@Controller('time-capsules')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class TimeCapsulesController {
  constructor(private readonly timeCapsulesService: TimeCapsulesService) {}

  @Get()
  async list(@CurrentSpace('id') spaceId: string): Promise<TimeCapsuleDto[]> {
    return this.timeCapsulesService.list(spaceId);
  }

  @Post()
  async create(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTimeCapsuleDto,
  ): Promise<TimeCapsuleDto> {
    return this.timeCapsulesService.create(spaceId, userId, dto);
  }

  @Get(':id')
  async get(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<TimeCapsuleDto> {
    return this.timeCapsulesService.get(spaceId, id);
  }
}
