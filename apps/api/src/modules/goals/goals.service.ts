import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CoupleGoalDto, CreateCoupleGoalDto, ToggleMilestoneDto, MilestoneDto } from '@ours/contracts';
import { randomUUID } from 'crypto';

interface StoredGoal {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  description?: string;
  category: string;
  targetDate?: string;
  milestones: MilestoneDto[];
  status: 'IN_PROGRESS' | 'ACHIEVED';
  achievedAt?: Date;
  createdAt: Date;
}

import { DurableStore } from '../../common/persistence/durable-store';

@Injectable()
export class GoalsService {
  private goals = new DurableStore<StoredGoal>('couple_goals');

  async list(coupleSpaceId: string): Promise<CoupleGoalDto[]> {
    const list: CoupleGoalDto[] = [];
    for (const g of this.goals.values()) {
      if (g.coupleSpaceId === coupleSpaceId) {
        list.push(this.mapDto(g));
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(coupleSpaceId: string, createdById: string, dto: CreateCoupleGoalDto): Promise<CoupleGoalDto> {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Goal title is required');
    }

    const milestones: MilestoneDto[] = (dto.milestones || []).map((mTitle) => ({
      id: randomUUID(),
      title: mTitle.trim(),
      completed: false,
    }));

    const goal: StoredGoal = {
      id: randomUUID(),
      coupleSpaceId,
      createdById,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      category: dto.category || 'LIFESTYLE',
      targetDate: dto.targetDate,
      milestones,
      status: 'IN_PROGRESS',
      createdAt: new Date(),
    };

    this.goals.set(goal.id, goal);
    return this.mapDto(goal);
  }

  async toggleMilestone(
    coupleSpaceId: string,
    goalId: string,
    milestoneId: string,
    dto: ToggleMilestoneDto,
  ): Promise<CoupleGoalDto> {
    const goal = this.goals.get(goalId);
    if (!goal || goal.coupleSpaceId !== coupleSpaceId) {
      throw new NotFoundException('Couple goal not found');
    }

    const ms = goal.milestones.find((m) => m.id === milestoneId);
    if (!ms) {
      throw new NotFoundException('Milestone not found');
    }

    ms.completed = dto.completed;
    ms.completedAt = dto.completed ? new Date().toISOString() : undefined;

    // Check if all completed
    const allDone = goal.milestones.length > 0 && goal.milestones.every((m) => m.completed);
    if (allDone) {
      goal.status = 'ACHIEVED';
      goal.achievedAt = new Date();
    } else {
      goal.status = 'IN_PROGRESS';
      goal.achievedAt = undefined;
    }

    this.goals.set(goal.id, goal);
    return this.mapDto(goal);
  }

  async delete(coupleSpaceId: string, goalId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal || goal.coupleSpaceId !== coupleSpaceId) {
      throw new NotFoundException('Couple goal not found');
    }
    this.goals.delete(goalId);
  }

  private mapDto(goal: StoredGoal): CoupleGoalDto {
    const total = goal.milestones.length;
    const completed = goal.milestones.filter((m) => m.completed).length;
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: goal.id,
      coupleSpaceId: goal.coupleSpaceId,
      createdById: goal.createdById,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetDate: goal.targetDate,
      milestones: goal.milestones,
      progressPercentage,
      status: goal.status,
      achievedAt: goal.achievedAt ? new Date(goal.achievedAt).toISOString() : undefined,
      createdAt: new Date(goal.createdAt).toISOString(),
    };
  }
}
