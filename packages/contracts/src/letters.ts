export interface LoveLetterDto {
  id: string;
  coupleSpaceId: string;
  authorId: string;
  recipientId: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'SENT';
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoveLetterDto {
  title: string;
  content: string;
  status?: 'DRAFT' | 'SENT';
}

export interface UpdateLoveLetterDto {
  title?: string;
  content?: string;
}
