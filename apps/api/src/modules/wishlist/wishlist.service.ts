import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  CreateWishlistItemRequest,
  UpdateWishlistItemRequest,
  WishlistItemResponse,
  WishlistStatus,
} from '@ours/contracts';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async listItems(
    spaceId: string,
    status?: WishlistStatus,
  ): Promise<WishlistItemResponse[]> {
    const items = await this.prisma.wishlistItem.findMany({
      where: {
        coupleSpaceId: spaceId,
        ...(status ? { status } : { status: { not: 'ARCHIVED' } }),
      },
      include: {
        linkedPlace: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return items.map((i) => this.mapToResponse(i));
  }

  async getItemById(spaceId: string, id: string): Promise<WishlistItemResponse> {
    const item = await this.prisma.wishlistItem.findFirst({
      where: { id, coupleSpaceId: spaceId },
      include: { linkedPlace: true },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    return this.mapToResponse(item);
  }

  async createItem(
    userId: string,
    spaceId: string,
    dto: CreateWishlistItemRequest,
  ): Promise<WishlistItemResponse> {
    const item = await this.prisma.wishlistItem.create({
      data: {
        coupleSpaceId: spaceId,
        createdById: userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        category: dto.category?.trim() || 'General',
        priority: dto.priority || 'MEDIUM',
        status: 'ACTIVE',
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        budgetAmount: dto.budgetAmount || null,
        budgetCurrency: dto.budgetCurrency || null,
        linkedPlaceId: dto.linkedPlaceId || null,
      },
      include: {
        linkedPlace: true,
      },
    });

    return this.mapToResponse(item);
  }

  async updateItem(
    spaceId: string,
    id: string,
    dto: UpdateWishlistItemRequest,
  ): Promise<WishlistItemResponse> {
    const existing = await this.prisma.wishlistItem.findFirst({
      where: { id, coupleSpaceId: spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Wishlist item not found');
    }

    let completedAt = existing.completedAt;
    if (dto.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      completedAt = new Date();
    } else if (dto.status === 'ACTIVE' && existing.status === 'COMPLETED') {
      completedAt = null;
    }

    const updated = await this.prisma.wishlistItem.update({
      where: { id },
      data: {
        title: dto.title?.trim() || undefined,
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        category: dto.category?.trim() || undefined,
        priority: dto.priority || undefined,
        status: dto.status || undefined,
        completedAt,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        budgetAmount: dto.budgetAmount !== undefined ? dto.budgetAmount : undefined,
        budgetCurrency: dto.budgetCurrency !== undefined ? dto.budgetCurrency : undefined,
        linkedPlaceId: dto.linkedPlaceId !== undefined ? dto.linkedPlaceId : undefined,
      },
      include: {
        linkedPlace: true,
      },
    });

    return this.mapToResponse(updated);
  }

  async archiveItem(spaceId: string, id: string): Promise<WishlistItemResponse> {
    const existing = await this.prisma.wishlistItem.findFirst({
      where: { id, coupleSpaceId: spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Wishlist item not found');
    }

    const archived = await this.prisma.wishlistItem.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: { linkedPlace: true },
    });

    return this.mapToResponse(archived);
  }

  private mapToResponse(item: any): WishlistItemResponse {
    return {
      id: item.id,
      coupleSpaceId: item.coupleSpaceId,
      createdById: item.createdById,
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      status: item.status,
      targetDate: item.targetDate ? item.targetDate.toISOString().split('T')[0] : null,
      budgetAmount: item.budgetAmount,
      budgetCurrency: item.budgetCurrency,
      linkedPlaceId: item.linkedPlaceId,
      linkedPlace: item.linkedPlace
        ? {
            id: item.linkedPlace.id,
            provider: item.linkedPlace.provider,
            providerPlaceId: item.linkedPlace.providerPlaceId,
            name: item.linkedPlace.name,
            address: item.linkedPlace.address,
            category: item.linkedPlace.category,
            latitude: item.linkedPlace.latitude,
            longitude: item.linkedPlace.longitude,
          }
        : null,
      completedAt: item.completedAt ? item.completedAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
