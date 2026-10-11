import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ScheduledSurpriseDto, CreateScheduledSurpriseDto } from '@ours/contracts';
import { randomUUID } from 'crypto';

interface StoredSurprise {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  message: string;
  revealAt: Date;
  giftType?: string;
  createdAt: Date;
}

import { DurableStore } from '../../common/persistence/durable-store';

@Injectable()
export class SurprisesService {
  private surprises = new DurableStore<StoredSurprise>('scheduled_surprises');

  async list(coupleSpaceId: string, currentUserId: string): Promise<ScheduledSurpriseDto[]> {
    const now = new Date();
    const list: ScheduledSurpriseDto[] = [];

    for (const s of this.surprises.values()) {
      if (s.coupleSpaceId !== coupleSpaceId) continue;

      const revealDate = new Date(s.revealAt);
      const isRevealed = now >= revealDate;
      const isAuthor = s.createdById === currentUserId;

      list.push({
        id: s.id,
        coupleSpaceId: s.coupleSpaceId,
        createdById: s.createdById,
        title: s.title,
        message: isAuthor || isRevealed ? s.message : null, // Mask message for recipient until reveal time
        revealAt: revealDate.toISOString(),
        isRevealed,
        giftType: s.giftType,
        createdAt: new Date(s.createdAt).toISOString(),
      });
    }

    return list.sort((a, b) => new Date(a.revealAt).getTime() - new Date(b.revealAt).getTime());
  }

  async create(coupleSpaceId: string, createdById: string, dto: CreateScheduledSurpriseDto): Promise<ScheduledSurpriseDto> {
    if (!dto.title?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('Title and secret message are required');
    }

    const revealDate = new Date(dto.revealAt);
    if (isNaN(revealDate.getTime())) {
      throw new BadRequestException('Invalid reveal date');
    }

    const surprise: StoredSurprise = {
      id: randomUUID(),
      coupleSpaceId,
      createdById,
      title: dto.title.trim(),
      message: dto.message.trim(),
      revealAt: revealDate,
      giftType: dto.giftType || 'NOTE',
      createdAt: new Date(),
    };

    this.surprises.set(surprise.id, surprise);
    const isRevealed = new Date() >= surprise.revealAt;

    return {
      id: surprise.id,
      coupleSpaceId: surprise.coupleSpaceId,
      createdById: surprise.createdById,
      title: surprise.title,
      message: surprise.message,
      revealAt: surprise.revealAt.toISOString(),
      isRevealed,
      giftType: surprise.giftType,
      createdAt: surprise.createdAt.toISOString(),
    };
  }
}
