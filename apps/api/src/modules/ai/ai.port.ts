import {
  AiDatePlanProposalDto,
  AiDateRecommendationDto,
  AiRelationshipInsightDto,
} from '@ours/contracts';

export interface AiPort {
  generatePlanProposal(
    prompt: string,
    budgetMinorUnits?: number,
    category?: string,
  ): Promise<AiDatePlanProposalDto>;

  generateRecommendations(
    categoryPreferences: string[],
    budgetMinorUnits?: number,
    existingPlaces?: string[],
  ): Promise<AiDateRecommendationDto[]>;

  generateRelationshipInsights(stats: {
    daysTogether: number;
    visitsCount: number;
    datesCompletedCount: number;
    topCategory?: string;
  }): Promise<AiRelationshipInsightDto[]>;
}

export const AI_PORT = Symbol('AI_PORT');
