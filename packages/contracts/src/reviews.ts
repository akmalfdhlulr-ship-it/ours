export interface ReviewItem {
  id: string;
  visitId: string;
  authorId: string;
  overallRating: number;
  categoryRatings: Record<string, number> | null;
  text: string | null;
  createdAt: string;
}

export interface SubmitReviewRequest {
  overallRating: number;
  categoryRatings?: Record<string, number>;
  text?: string;
}

export interface VisitReviewsResponse {
  revealed: boolean;
  coupleScore: number | null;
  myReview: ReviewItem | null;
  partnerReview: ReviewItem | null;
}
