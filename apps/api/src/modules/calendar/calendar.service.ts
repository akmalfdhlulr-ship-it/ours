import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  CalendarEventItem,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from '@ours/contracts';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async listEvents(
    spaceId: string,
    start?: string,
    end?: string,
  ): Promise<CalendarEventItem[]> {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { id: spaceId },
    });

    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const endDate = end ? new Date(end) : new Date(Date.now() + 60 * 24 * 3600 * 1000);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        coupleSpaceId: spaceId,
        startAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startAt: 'asc' },
    });

    const result: CalendarEventItem[] = events.map((e) => this.mapToItem(e));

    // Inject recurring anniversary event if inside the query window
    if (space?.anniversaryDate) {
      const anniv = new Date(space.anniversaryDate);
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      for (let y = startYear; y <= endYear; y++) {
        const candidateDate = new Date(Date.UTC(y, anniv.getMonth(), anniv.getDate()));
        if (candidateDate >= startDate && candidateDate <= endDate) {
          const yearsTogether = y - anniv.getFullYear();
          result.push({
            id: `anniversary_${y}`,
            coupleSpaceId: spaceId,
            createdById: 'system',
            title: yearsTogether > 0 ? `${yearsTogether} Year Anniversary` : 'Our Anniversary',
            description: 'Our special relationship milestone',
            eventType: 'ANNIVERSARY',
            startAt: candidateDate.toISOString(),
            endAt: null,
            allDay: true,
            linkedDatePlanId: null,
          });
        }
      }
    }

    result.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    return result;
  }

  async createEvent(
    userId: string,
    spaceId: string,
    dto: CreateCalendarEventRequest,
  ): Promise<CalendarEventItem> {
    const startAt = new Date(dto.startAt);
    const endAt = dto.endAt ? new Date(dto.endAt) : null;

    const event = await this.prisma.calendarEvent.create({
      data: {
        coupleSpaceId: spaceId,
        createdById: userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        eventType: dto.eventType || 'MANUAL',
        startAt,
        endAt,
        allDay: dto.allDay ?? false,
        linkedDatePlanId: dto.linkedDatePlanId || null,
      },
    });

    return this.mapToItem(event);
  }

  async updateEvent(
    spaceId: string,
    id: string,
    dto: UpdateCalendarEventRequest,
  ): Promise<CalendarEventItem> {
    const existing = await this.prisma.calendarEvent.findFirst({
      where: { id, coupleSpaceId: spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Calendar event not found');
    }

    const updated = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        title: dto.title?.trim() || undefined,
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        allDay: dto.allDay !== undefined ? dto.allDay : undefined,
      },
    });

    return this.mapToItem(updated);
  }

  async deleteEvent(spaceId: string, id: string): Promise<{ success: boolean }> {
    await this.prisma.calendarEvent.deleteMany({
      where: { id, coupleSpaceId: spaceId },
    });
    return { success: true };
  }

  private mapToItem(event: any): CalendarEventItem {
    return {
      id: event.id,
      coupleSpaceId: event.coupleSpaceId,
      createdById: event.createdById,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt ? event.endAt.toISOString() : null,
      allDay: event.allDay,
      linkedDatePlanId: event.linkedDatePlanId,
    };
  }
}
