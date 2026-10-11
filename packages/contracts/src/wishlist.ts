import { PlaceItem } from './places';

export type WishlistStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type WishlistPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface WishlistItemResponse {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: WishlistPriority;
  status: WishlistStatus;
  targetDate: string | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  linkedPlaceId: string | null;
  linkedPlace?: PlaceItem | null;
  linkedDatePlanId?: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishlistItemRequest {
  title: string;
  description?: string;
  category?: string;
  priority?: WishlistPriority;
  targetDate?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  linkedPlaceId?: string;
}

export interface UpdateWishlistItemRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: WishlistPriority;
  status?: WishlistStatus;
  targetDate?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  linkedPlaceId?: string;
}
