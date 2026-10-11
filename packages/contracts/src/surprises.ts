export interface ScheduledSurpriseDto {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  message: string | null;
  revealAt: string;
  isRevealed: boolean;
  giftType?: string;
  createdAt: string;
}

export interface CreateScheduledSurpriseDto {
  title: string;
  message: string;
  revealAt: string;
  giftType?: string;
}
