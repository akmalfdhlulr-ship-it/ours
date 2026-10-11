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
  CalendarEventItem,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from '@ours/contracts';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async listEvents(
    @CurrentSpace('id') spaceId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ): Promise<{ data: CalendarEventItem[] }> {
    const data = await this.calendarService.listEvents(spaceId, start, end);
    return { data };
  }

  @Post()
  async createEvent(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: CreateCalendarEventRequest,
  ): Promise<{ data: CalendarEventItem }> {
    const data = await this.calendarService.createEvent(userId, spaceId, body);
    return { data };
  }

  @Patch(':id')
  async updateEvent(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Body() body: UpdateCalendarEventRequest,
  ): Promise<{ data: CalendarEventItem }> {
    const data = await this.calendarService.updateEvent(spaceId, id, body);
    return { data };
  }

  @Delete(':id')
  async deleteEvent(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: { success: boolean } }> {
    const data = await this.calendarService.deleteEvent(spaceId, id);
    return { data };
  }
}
