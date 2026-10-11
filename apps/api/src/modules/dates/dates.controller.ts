import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import {
  CreateDatePlanRequest,
  CreateDateStopRequest,
  DatePlanDetailResponse,
  DatePlanStatus,
  UpdateDatePlanRequest,
} from '@ours/contracts';
import { DatesService } from './dates.service';

@Controller('dates')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class DatesController {
  constructor(private readonly datesService: DatesService) {}

  @Get()
  async listPlans(
    @CurrentSpace('id') spaceId: string,
    @Query('status') status?: DatePlanStatus,
  ): Promise<{ data: DatePlanDetailResponse[] }> {
    const data = await this.datesService.listPlans(spaceId, status);
    return { data };
  }

  @Post()
  async createPlan(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: CreateDatePlanRequest,
  ): Promise<{ data: DatePlanDetailResponse }> {
    const data = await this.datesService.createPlan(userId, spaceId, body);
    return { data };
  }

  @Get(':id')
  async getPlanById(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: DatePlanDetailResponse }> {
    const data = await this.datesService.getPlanById(spaceId, id);
    return { data };
  }

  @Patch(':id')
  async updatePlan(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Body() body: UpdateDatePlanRequest,
  ): Promise<{ data: DatePlanDetailResponse }> {
    const data = await this.datesService.updatePlan(userId, spaceId, id, body);
    return { data };
  }

  @Post(':id/stops')
  async addStop(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Body() body: CreateDateStopRequest,
  ): Promise<{ data: DatePlanDetailResponse }> {
    const data = await this.datesService.addStop(spaceId, id, body);
    return { data };
  }

  @Delete(':id/stops/:stopId')
  async deleteStop(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Param('stopId') stopId: string,
  ): Promise<{ data: DatePlanDetailResponse }> {
    const data = await this.datesService.deleteStop(spaceId, id, stopId);
    return { data };
  }

  @Delete(':id')
  async deletePlan(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: { success: boolean } }> {
    const data = await this.datesService.deletePlan(spaceId, id);
    return { data };
  }
}
