import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  AlbumItem,
  CreateAlbumRequest,
  MemoryItem,
  UpdateAlbumRequest,
} from '@ours/contracts';

@Injectable()
export class AlbumsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAlbums(spaceId: string): Promise<AlbumItem[]> {
    const albums = await this.prisma.album.findMany({
      where: { coupleSpaceId: spaceId },
      include: {
        coverMedia: true,
        albumMemories: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return albums.map((a) => this.mapToItem(a));
  }

  async getAlbumById(
    spaceId: string,
    id: string,
  ): Promise<AlbumItem & { memories: MemoryItem[] }> {
    const album = await this.prisma.album.findFirst({
      where: { id, coupleSpaceId: spaceId },
      include: {
        coverMedia: true,
        albumMemories: {
          include: {
            memory: {
              include: {
                media: {
                  include: { mediaAsset: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    const memories = album.albumMemories.map((am) => ({
      id: am.memory.id,
      coupleSpaceId: am.memory.coupleSpaceId,
      createdById: am.memory.createdById,
      title: am.memory.title,
      description: am.memory.description,
      memoryDate: am.memory.memoryDate.toISOString().split('T')[0],
      locationName: am.memory.locationName,
      latitude: am.memory.latitude,
      longitude: am.memory.longitude,
      linkedVisitId: am.memory.linkedVisitId,
      linkedDatePlanId: am.memory.linkedDatePlanId,
      isFavorite: am.memory.isFavorite,
      media: (am.memory.media || []).map((mm: any) => ({
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
            mm.mediaAsset.storageKey.startsWith('http://') ||
            mm.mediaAsset.storageKey.startsWith('https://') ||
            mm.mediaAsset.storageKey.startsWith('data:')
              ? mm.mediaAsset.storageKey
              : `/api/v1/media/stream?key=${encodeURIComponent(mm.mediaAsset.storageKey)}`,
          capturedAt: mm.mediaAsset.capturedAt ? mm.mediaAsset.capturedAt.toISOString() : null,
          createdAt: mm.mediaAsset.createdAt.toISOString(),
        },
        sortOrder: mm.sortOrder,
        caption: mm.caption,
      })),
      createdAt: am.memory.createdAt.toISOString(),
      updatedAt: am.memory.updatedAt.toISOString(),
    }));

    return {
      ...this.mapToItem(album),
      memories,
    };
  }

  async createAlbum(
    userId: string,
    spaceId: string,
    dto: CreateAlbumRequest,
  ): Promise<AlbumItem> {
    const album = await this.prisma.album.create({
      data: {
        coupleSpaceId: spaceId,
        createdById: userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        coverMediaId: dto.coverMediaId || null,
      },
      include: {
        coverMedia: true,
        albumMemories: true,
      },
    });

    if (dto.memoryIds && dto.memoryIds.length > 0) {
      let order = 0;
      for (const mId of dto.memoryIds) {
        await this.prisma.albumMemory.create({
          data: {
            coupleSpaceId: spaceId,
            albumId: album.id,
            memoryId: mId,
            sortOrder: order++,
          },
        });
      }
    }

    return this.mapToItem(album);
  }

  async updateAlbum(
    spaceId: string,
    id: string,
    dto: UpdateAlbumRequest,
  ): Promise<AlbumItem> {
    const existing = await this.prisma.album.findFirst({
      where: { id, coupleSpaceId: spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Album not found');
    }

    const updated = await this.prisma.album.update({
      where: { id },
      data: {
        title: dto.title?.trim() || undefined,
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        coverMediaId: dto.coverMediaId !== undefined ? dto.coverMediaId : undefined,
      },
      include: {
        coverMedia: true,
        albumMemories: true,
      },
    });

    return this.mapToItem(updated);
  }

  async addMemoryToAlbum(
    spaceId: string,
    albumId: string,
    memoryId: string,
  ): Promise<{ success: boolean }> {
    const album = await this.prisma.album.findFirst({
      where: { id: albumId, coupleSpaceId: spaceId },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    const existingCount = await this.prisma.albumMemory.count({
      where: { albumId },
    });

    await this.prisma.albumMemory.upsert({
      where: {
        albumId_memoryId: {
          albumId,
          memoryId,
        },
      },
      update: {},
      create: {
        coupleSpaceId: spaceId,
        albumId,
        memoryId,
        sortOrder: existingCount,
      },
    });

    return { success: true };
  }

  async removeMemoryFromAlbum(
    spaceId: string,
    albumId: string,
    memoryId: string,
  ): Promise<{ success: boolean }> {
    await this.prisma.albumMemory.deleteMany({
      where: {
        albumId,
        memoryId,
        coupleSpaceId: spaceId,
      },
    });

    return { success: true };
  }

  async deleteAlbum(spaceId: string, id: string): Promise<{ success: boolean }> {
    await this.prisma.album.deleteMany({
      where: { id, coupleSpaceId: spaceId },
    });
    return { success: true };
  }

  private mapToItem(album: any): AlbumItem {
    return {
      id: album.id,
      coupleSpaceId: album.coupleSpaceId,
      createdById: album.createdById,
      title: album.title,
      description: album.description,
      coverMediaId: album.coverMediaId,
      coverMedia: album.coverMedia
        ? {
            id: album.coverMedia.id,
            coupleSpaceId: album.coverMedia.coupleSpaceId,
            uploadedById: album.coverMedia.uploadedById,
            storageKey: album.coverMedia.storageKey,
            originalFilename: album.coverMedia.originalFilename,
            mimeType: album.coverMedia.mimeType,
            fileSizeBytes: album.coverMedia.fileSizeBytes,
            width: album.coverMedia.width,
            height: album.coverMedia.height,
            status: album.coverMedia.status,
            secureUrl:
              album.coverMedia.storageKey.startsWith('http://') ||
              album.coverMedia.storageKey.startsWith('https://') ||
              album.coverMedia.storageKey.startsWith('data:')
                ? album.coverMedia.storageKey
                : `/api/v1/media/stream?key=${encodeURIComponent(album.coverMedia.storageKey)}`,
            capturedAt: album.coverMedia.capturedAt ? album.coverMedia.capturedAt.toISOString() : null,
            createdAt: album.coverMedia.createdAt.toISOString(),
          }
        : null,
      memoriesCount: album.albumMemories?.length || 0,
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString(),
    };
  }
}
