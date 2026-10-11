export interface MilestoneDto {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface CoupleGoalDto {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  description?: string;
  category: string;
  targetDate?: string;
  milestones: MilestoneDto[];
  progressPercentage: number;
  status: 'IN_PROGRESS' | 'ACHIEVED';
  achievedAt?: string;
  createdAt: string;
}

export interface CreateCoupleGoalDto {
  title: string;
  description?: string;
  category: string;
  targetDate?: string;
  milestones?: string[];
}

export interface ToggleMilestoneDto {
  completed: boolean;
}
