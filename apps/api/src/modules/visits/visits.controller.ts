import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import {
  CreateVisitRequest,
  UpdateVisitRequest,
  VisitItem,
} from '@ours/contracts';
import { VisitsService } from './visits.service';

@Controller('visits')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  async listVisits(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
  ): Promise<{ data: VisitItem[] }> {
    const data = await this.visitsService.listVisits(userId, spaceId);
    return { data };
  }

  @Post()
  async createVisit(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: CreateVisitRequest,
  ): Promise<{ data: VisitItem }> {
    const data = await this.visitsService.createVisit(userId, spaceId, body);
    return { data };
  }

  @Get(':id')
  async getVisitById(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: VisitItem }> {
    const data = await this.visitsService.getVisitById(userId, spaceId, id);
    return { data };
  }

  @Patch(':id')
  async updateVisit(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Body() body: UpdateVisitRequest,
  ): Promise<{ data: VisitItem }> {
    const data = await this.visitsService.updateVisit(userId, spaceId, id, body);
    return { data };
  }
}
