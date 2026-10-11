export interface DecisionVoteDto {
  userId: string;
  optionIndex: number;
  votedAt: string;
}

export interface DecisionPollDto {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  question: string;
  options: string[];
  votes: DecisionVoteDto[];
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  winnerOptionIndex?: number;
  totalVotes: number;
  hasVoted: boolean;
  myVoteIndex?: number;
  createdAt: string;
}

export interface CreateDecisionPollDto {
  question: string;
  options: string[];
}

export interface CastVoteDto {
  optionIndex: number;
}
