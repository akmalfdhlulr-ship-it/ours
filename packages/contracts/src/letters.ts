export interface LoveLetterDto {
  id: string;
  coupleSpaceId: string;
  authorId: string;
  recipientId: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'SENT';
  unlockAt?: string;
  metadata?: Record<string, any>;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoveLetterDto {
  title: string;
  content: string;
  status?: 'DRAFT' | 'SENT';
  unlockAt?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLoveLetterDto {
  title?: string;
  content?: string;
  unlockAt?: string;
  metadata?: Record<string, any>;
}
