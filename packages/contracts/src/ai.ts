export interface AiDateRecommendationDto {
  title: string;
  category: string;
  estimatedBudgetMinorUnits: number;
  description: string;
  recommendedLocation?: string;
  whyYouWillLoveIt: string;
}

export interface AiDatePlanProposalDto {
  title: string;
  description: string;
  suggestedDate: string;
  estimatedBudgetMinorUnits: number;
  stops: {
    title: string;
    placeName: string;
    notes: string;
    estimatedDurationMin: number;
  }[];
  checklist: string[];
}

export interface AiRelationshipInsightDto {
  headline: string;
  body: string;
  metric?: string;
  category: string;
}

export interface AiPlanRequestDto {
  prompt: string;
  budgetMinorUnits?: number;
  category?: string;
}
