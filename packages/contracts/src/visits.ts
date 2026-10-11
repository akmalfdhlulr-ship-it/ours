import { PlaceItem } from './places';

export interface VisitItem {
  id: string;
  coupleSpaceId: string;
  placeId: string | null;
  place?: PlaceItem | null;
  recordedById: string;
  datePlanId: string | null;
  visitedAt: string;
  notes: string | null;
  createdAt: string;
  reviewsCount: number;
  coupleScore: number | null;
  userReviewSubmitted: boolean;
}

export interface CreateVisitRequest {
  placeId?: string;
  datePlanId?: string;
  visitedAt: string;
  notes?: string;
}

export interface UpdateVisitRequest {
  visitedAt?: string;
  notes?: string;
}
