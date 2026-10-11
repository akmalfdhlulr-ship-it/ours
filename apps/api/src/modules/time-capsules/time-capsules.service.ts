import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TimeCapsuleDto, CreateTimeCapsuleDto } from '@ours/contracts';
import { randomUUID } from 'crypto';

interface StoredCapsule {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  content: string;
  unlockAt: Date;
  mediaAssetIds?: string[];
  createdAt: Date;
}

import { DurableStore } from '../../common/persistence/durable-store';

@Injectable()
export class TimeCapsulesService {
  private capsules = new DurableStore<StoredCapsule>('time_capsules');

  async list(coupleSpaceId: string): Promise<TimeCapsuleDto[]> {
    const now = new Date();
    const result: TimeCapsuleDto[] = [];

    for (const cap of this.capsules.values()) {
      if (cap.coupleSpaceId !== coupleSpaceId) continue;
      const unlockDate = new Date(cap.unlockAt);
      const isLocked = now < unlockDate;

      result.push({
        id: cap.id,
        coupleSpaceId: cap.coupleSpaceId,
        createdById: cap.createdById,
        title: cap.title,
        content: isLocked ? null : cap.content, // Masked if locked!
        unlockAt: new Date(cap.unlockAt).toISOString(),
        isLocked,
        mediaCount: cap.mediaAssetIds?.length || 0,
        createdAt: new Date(cap.createdAt).toISOString(),
      });
    }

    return result.sort((a, b) => new Date(a.unlockAt).getTime() - new Date(b.unlockAt).getTime());
  }

  async create(coupleSpaceId: string, createdById: string, dto: CreateTimeCapsuleDto): Promise<TimeCapsuleDto> {
    if (!dto.title?.trim() || !dto.content?.trim()) {
      throw new BadRequestException('Title and content are required');
    }

    const unlockAtDate = new Date(dto.unlockAt);
    if (isNaN(unlockAtDate.getTime())) {
      throw new BadRequestException('Invalid unlock date');
    }

    const now = new Date();
    const capsule: StoredCapsule = {
      id: randomUUID(),
      coupleSpaceId,
      createdById,
      title: dto.title.trim(),
      content: dto.content.trim(),
      unlockAt: unlockAtDate,
      mediaAssetIds: dto.mediaAssetIds || [],
      createdAt: now,
    };

    this.capsules.set(capsule.id, capsule);
    const isLocked = now < capsule.unlockAt;

    return {
      id: capsule.id,
      coupleSpaceId: capsule.coupleSpaceId,
      createdById: capsule.createdById,
      title: capsule.title,
      content: isLocked ? null : capsule.content,
      unlockAt: capsule.unlockAt.toISOString(),
      isLocked,
      mediaCount: capsule.mediaAssetIds?.length || 0,
      createdAt: capsule.createdAt.toISOString(),
    };
  }

  async get(coupleSpaceId: string, id: string): Promise<TimeCapsuleDto> {
    const capsule = this.capsules.get(id);
    if (!capsule || capsule.coupleSpaceId !== coupleSpaceId) {
      throw new NotFoundException('Time capsule not found');
    }

    const now = new Date();
    const unlockDate = new Date(capsule.unlockAt);
    const isLocked = now < unlockDate;

    return {
      id: capsule.id,
      coupleSpaceId: capsule.coupleSpaceId,
      createdById: capsule.createdById,
      title: capsule.title,
      content: isLocked ? null : capsule.content, // Server-enforced privacy
      unlockAt: unlockDate.toISOString(),
      isLocked,
      mediaCount: capsule.mediaAssetIds?.length || 0,
      createdAt: new Date(capsule.createdAt).toISOString(),
    };
  }
}
