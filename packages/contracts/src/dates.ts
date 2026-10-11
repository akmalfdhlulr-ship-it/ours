import { PlaceItem } from './places';

export type DatePlanStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface DateChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DateStopItem {
  id: string;
  datePlanId: string;
  placeId: string | null;
  place?: PlaceItem | null;
  title: string;
  notes: string | null;
  sortOrder: number;
  estimatedStart: string | null;
  estimatedDurationMin: number | null;
}

export interface DatePlanDetailResponse {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  description: string | null;
  status: DatePlanStatus;
  plannedDate: string | null;
  plannedStartTime: string | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  linkedWishlistId: string | null;
  checklist: DateChecklistItem[];
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  stops: DateStopItem[];
}

export interface CreateDatePlanRequest {
  title: string;
  description?: string;
  plannedDate?: string;
  plannedStartTime?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  linkedWishlistId?: string;
}

export interface UpdateDatePlanRequest {
  title?: string;
  description?: string;
  status?: DatePlanStatus;
  plannedDate?: string;
  plannedStartTime?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  linkedWishlistId?: string;
  checklist?: DateChecklistItem[];
}

export interface CreateDateStopRequest {
  title: string;
  placeId?: string;
  notes?: string;
  sortOrder: number;
  estimatedStart?: string;
  estimatedDurationMin?: number;
}
