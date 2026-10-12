import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  CreateMemoryRequest,
  MemoryItem,
  UpdateMemoryRequest,
} from '@ours/contracts';

@Injectable()
export class MemoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMemories(
    spaceId: string,
    isFavorite?: boolean,
  ): Promise<MemoryItem[]> {
    const memories = await this.prisma.memory.findMany({
      where: {
        coupleSpaceId: spaceId,
        ...(isFavorite !== undefined ? { isFavorite } : {}),
      },
      include: {
        media: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { memoryDate: 'desc' },
    });

    return memories.map((m) => this.mapToItem(m));
  }

  async getMemoryById(spaceId: string, id: string): Promise<MemoryItem> {
    const memory = await this.prisma.memory.findFirst({
      where: { id, coupleSpaceId: spaceId },
      include: {
        media: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!memory) {
      throw new NotFoundException('Memory not found');
    }

    return this.mapToItem(memory);
  }

  async createMemory(
    userId: string,
    spaceId: string,
    dto: CreateMemoryRequest,
  ): Promise<MemoryItem> {
    const memory = await this.prisma.memory.create({
      data: {
        coupleSpaceId: spaceId,
        createdById: userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        memoryDate: new Date(dto.memoryDate),
        locationName: dto.locationName?.trim() || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        linkedVisitId: dto.linkedVisitId || null,
        linkedDatePlanId: dto.linkedDatePlanId || null,
        isFavorite: dto.isFavorite ?? false,
      },
    });

    // Attach media assets if provided
    if (dto.mediaAssetIds && dto.mediaAssetIds.length > 0) {
      let order = 0;
      for (const assetId of dto.mediaAssetIds) {
        await this.prisma.memoryMedia.create({
          data: {
            coupleSpaceId: spaceId,
            memoryId: memory.id,
            mediaAssetId: assetId,
            sortOrder: order++,
          },
        });
      }
    }

    return this.getMemoryById(spaceId, memory.id);
  }

  async updateMemory(
    spaceId: string,
    id: string,
    dto: UpdateMemoryRequest,
  ): Promise<MemoryItem> {
    const existing = await this.prisma.memory.findFirst({
      where: { id, coupleSpaceId: spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Memory not found');
    }

    await this.prisma.memory.update({
      where: { id },
      data: {
        title: dto.title?.trim() || undefined,
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        memoryDate: dto.memoryDate ? new Date(dto.memoryDate) : undefined,
        locationName: dto.locationName !== undefined ? dto.locationName?.trim() || null : undefined,
        latitude: dto.latitude !== undefined ? dto.latitude : undefined,
        longitude: dto.longitude !== undefined ? dto.longitude : undefined,
        isFavorite: dto.isFavorite !== undefined ? dto.isFavorite : undefined,
      },
    });

    // Replace media associations if mediaAssetIds provided
    if (dto.mediaAssetIds) {
      await this.prisma.memoryMedia.deleteMany({
        where: { memoryId: id, coupleSpaceId: spaceId },
      });

      let order = 0;
      for (const assetId of dto.mediaAssetIds) {
        await this.prisma.memoryMedia.create({
          data: {
            coupleSpaceId: spaceId,
            memoryId: id,
            mediaAssetId: assetId,
            sortOrder: order++,
          },
        });
      }
    }

    return this.getMemoryById(spaceId, id);
  }

  async deleteMemory(spaceId: string, id: string): Promise<{ success: boolean }> {
    await this.prisma.memory.deleteMany({
      where: { id, coupleSpaceId: spaceId },
    });
    return { success: true };
  }

  async getOnThisDay(spaceId: string): Promise<MemoryItem[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const candidates = await this.prisma.memory.findMany({
      where: {
        coupleSpaceId: spaceId,
        memoryDate: { lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
      include: {
        media: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { memoryDate: 'desc' },
    });

    const matches = candidates.filter((m) => {
      const d = new Date(m.memoryDate);
      return d.getMonth() + 1 === currentMonth && d.getDate() === currentDay;
    });

    return matches.map((m) => this.mapToItem(m));
  }

  private mapToItem(m: any): MemoryItem {
    return {
      id: m.id,
      coupleSpaceId: m.coupleSpaceId,
      createdById: m.createdById,
      title: m.title,
      description: m.description,
      memoryDate: m.memoryDate.toISOString().split('T')[0],
      locationName: m.locationName,
      latitude: m.latitude,
      longitude: m.longitude,
      linkedVisitId: m.linkedVisitId,
      linkedDatePlanId: m.linkedDatePlanId,
      isFavorite: m.isFavorite,
      media: (m.media || []).map((mm: any) => ({
        id: mm.id,
        mediaAssetId: mm.mediaAssetId,
        mediaAsset: {
          id: mm.mediaAsset.id,
          coupleSpaceId: mm.mediaAsset.coupleSpaceId,
          uploadedById: mm.mediaAsset.uploadedById,
          storageKey: mm.mediaAsset.storageKey,
          originalFilename: mm.mediaAsset.originalFilename,
          mimeType: mm.mediaAsset.mimeType,
          fileSizeBytes: mm.mediaAsset.fileSizeBytes,
          width: mm.mediaAsset.width,
          height: mm.mediaAsset.height,
          status: mm.mediaAsset.status,
          secureUrl:
            (mm.mediaAsset.metadata as any)?.dataUrl ||
            (mm.mediaAsset.metadata as any)?.secureUrl ||
            (mm.mediaAsset.storageKey.startsWith('http://') ||
            mm.mediaAsset.storageKey.startsWith('https://') ||
            mm.mediaAsset.storageKey.startsWith('data:')
              ? mm.mediaAsset.storageKey
              : `/api/v1/media/stream?key=${encodeURIComponent(mm.mediaAsset.storageKey)}`),
          capturedAt: mm.mediaAsset.capturedAt ? mm.mediaAsset.capturedAt.toISOString() : null,
          createdAt: mm.mediaAsset.createdAt.toISOString(),
        },
        sortOrder: mm.sortOrder,
        caption: mm.caption,
      })),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }
}
