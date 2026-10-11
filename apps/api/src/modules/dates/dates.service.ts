import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  CreateDatePlanRequest,
  CreateDateStopRequest,
  DatePlanDetailResponse,
  DatePlanStatus,
  UpdateDatePlanRequest,
} from '@ours/contracts';

@Injectable()
export class DatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans(
    spaceId: string,
    status?: DatePlanStatus,
  ): Promise<DatePlanDetailResponse[]> {
    const plans = await this.prisma.datePlan.findMany({
      where: {
        coupleSpaceId: spaceId,
        ...(status ? { status } : {}),
      },
      include: {
        stops: {
          include: { place: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ plannedDate: 'asc' }, { createdAt: 'desc' }],
    });

    return plans.map((p) => this.mapToDetail(p));
  }

  async getPlanById(spaceId: string, id: string): Promise<DatePlanDetailResponse> {
    const plan = await this.prisma.datePlan.findFirst({
      where: { id, coupleSpaceId: spaceId },
      include: {
        stops: {
          include: { place: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Date plan not found');
    }

    return this.mapToDetail(plan);
  }

  async createPlan(
    userId: string,
    spaceId: string,
    dto: CreateDatePlanRequest,
  ): Promise<DatePlanDetailResponse> {
    const plan = await this.prisma.datePlan.create({
      data: {
        coupleSpaceId: spaceId,
        createdById: userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        status: 'DRAFT',
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : null,
        plannedStartTime: dto.plannedStartTime
          ? new Date(`1970-01-01T${dto.plannedStartTime}:00.000Z`)
          : null,
        budgetAmount: dto.budgetAmount || null,
        budgetCurrency: dto.budgetCurrency || 'USD',
        linkedWishlistId: dto.linkedWishlistId || null,
        checklist: [],
      },
      include: {
        stops: {
          include: { place: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return this.mapToDetail(plan);
  }

  async updatePlan(
    userId: string,
    spaceId: string,
    id: string,
    dto: UpdateDatePlanRequest,
  ): Promise<DatePlanDetailResponse> {
    const existing = await this.prisma.datePlan.findFirst({
      where: { id, coupleSpaceId: spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Date plan not found');
    }

    // Validate state transitions
    if (dto.status && dto.status !== existing.status) {
      this.validateTransition(existing.status as DatePlanStatus, dto.status);
    }

    let completedAt = existing.completedAt;
    let cancelledAt = existing.cancelledAt;

    if (dto.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      completedAt = new Date();
    } else if (dto.status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      cancelledAt = new Date();
    }

    const updated = await this.prisma.datePlan.update({
      where: { id },
      data: {
        title: dto.title?.trim() || undefined,
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        status: dto.status || undefined,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
        plannedStartTime: dto.plannedStartTime
          ? new Date(`1970-01-01T${dto.plannedStartTime}:00.000Z`)
          : undefined,
        budgetAmount: dto.budgetAmount !== undefined ? dto.budgetAmount : undefined,
        budgetCurrency: dto.budgetCurrency !== undefined ? dto.budgetCurrency : undefined,
        linkedWishlistId: dto.linkedWishlistId !== undefined ? dto.linkedWishlistId : undefined,
        checklist: dto.checklist ? (dto.checklist as any) : undefined,
        completedAt,
        cancelledAt,
      },
      include: {
        stops: {
          include: { place: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Synchronize Calendar event when finalized/planned
    if (updated.status === 'PLANNED' && updated.plannedDate) {
      await this.syncCalendarEvent(spaceId, userId, updated);
    } else if (updated.status === 'CANCELLED') {
      // Remove calendar event if cancelled
      await this.prisma.calendarEvent.deleteMany({
        where: {
          coupleSpaceId: spaceId,
          linkedDatePlanId: updated.id,
        },
      });
    }

    return this.mapToDetail(updated);
  }

  async addStop(
    spaceId: string,
    datePlanId: string,
    dto: CreateDateStopRequest,
  ): Promise<DatePlanDetailResponse> {
    const plan = await this.prisma.datePlan.findFirst({
      where: { id: datePlanId, coupleSpaceId: spaceId },
    });

    if (!plan) {
      throw new NotFoundException('Date plan not found');
    }

    await this.prisma.dateStop.create({
      data: {
        coupleSpaceId: spaceId,
        datePlanId,
        placeId: dto.placeId || null,
        title: dto.title.trim(),
        notes: dto.notes?.trim() || null,
        sortOrder: dto.sortOrder,
        estimatedDurationMin: dto.estimatedDurationMin || null,
      },
    });

    return this.getPlanById(spaceId, datePlanId);
  }

  async deleteStop(
    spaceId: string,
    datePlanId: string,
    stopId: string,
  ): Promise<DatePlanDetailResponse> {
    await this.prisma.dateStop.deleteMany({
      where: {
        id: stopId,
        datePlanId,
        coupleSpaceId: spaceId,
      },
    });

    return this.getPlanById(spaceId, datePlanId);
  }

  async deletePlan(spaceId: string, id: string): Promise<{ success: boolean }> {
    const plan = await this.prisma.datePlan.findFirst({
      where: { id, coupleSpaceId: spaceId },
    });

    if (!plan) {
      throw new NotFoundException('Date plan not found');
    }

    if (plan.status !== 'DRAFT' && plan.status !== 'CANCELLED') {
      throw new ForbiddenException('Only DRAFT or CANCELLED date plans can be deleted');
    }

    // Clean up calendar events
    await this.prisma.calendarEvent.deleteMany({
      where: { linkedDatePlanId: id, coupleSpaceId: spaceId },
    });

    await this.prisma.datePlan.delete({
      where: { id },
    });

    return { success: true };
  }

  private validateTransition(current: DatePlanStatus, next: DatePlanStatus) {
    const allowedTransitions: Record<DatePlanStatus, DatePlanStatus[]> = {
      DRAFT: ['PLANNED', 'CANCELLED'],
      PLANNED: ['IN_PROGRESS', 'CANCELLED', 'DRAFT'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'PLANNED'],
      COMPLETED: [],
      CANCELLED: ['DRAFT', 'PLANNED'],
    };

    if (!allowedTransitions[current]?.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}`,
      );
    }
  }

  private async syncCalendarEvent(
    spaceId: string,
    userId: string,
    plan: any,
  ) {
    if (!plan.plannedDate) return;

    const startAt = new Date(plan.plannedDate);
    const existing = await this.prisma.calendarEvent.findFirst({
      where: {
        coupleSpaceId: spaceId,
        linkedDatePlanId: plan.id,
      },
    });

    if (existing) {
      await this.prisma.calendarEvent.update({
        where: { id: existing.id },
        data: {
          title: plan.title,
          description: plan.description,
          startAt,
        },
      });
    } else {
      await this.prisma.calendarEvent.create({
        data: {
          coupleSpaceId: spaceId,
          createdById: userId,
          title: `Date: ${plan.title}`,
          description: plan.description,
          eventType: 'DATE_LINKED',
          startAt,
          allDay: true,
          linkedDatePlanId: plan.id,
        },
      });
    }
  }

  private mapToDetail(plan: any): DatePlanDetailResponse {
    return {
      id: plan.id,
      coupleSpaceId: plan.coupleSpaceId,
      createdById: plan.createdById,
      title: plan.title,
      description: plan.description,
      status: plan.status,
      plannedDate: plan.plannedDate ? plan.plannedDate.toISOString().split('T')[0] : null,
      plannedStartTime: plan.plannedStartTime
        ? plan.plannedStartTime.toISOString().split('T')[1].substring(0, 5)
        : null,
      budgetAmount: plan.budgetAmount,
      budgetCurrency: plan.budgetCurrency,
      linkedWishlistId: plan.linkedWishlistId,
      checklist: (plan.checklist as any) || [],
      completedAt: plan.completedAt ? plan.completedAt.toISOString() : null,
      cancelledAt: plan.cancelledAt ? plan.cancelledAt.toISOString() : null,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      stops: (plan.stops || []).map((s: any) => ({
        id: s.id,
        datePlanId: s.datePlanId,
        placeId: s.placeId,
        place: s.place
          ? {
              id: s.place.id,
              provider: s.place.provider,
              providerPlaceId: s.place.providerPlaceId,
              name: s.place.name,
              address: s.place.address,
              category: s.place.category,
              latitude: s.place.latitude,
              longitude: s.place.longitude,
            }
          : null,
        title: s.title,
        notes: s.notes,
        sortOrder: s.sortOrder,
        estimatedStart: s.estimatedStart
          ? s.estimatedStart.toISOString().split('T')[1].substring(0, 5)
          : null,
        estimatedDurationMin: s.estimatedDurationMin,
      })),
    };
  }
}
