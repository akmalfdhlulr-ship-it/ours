import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  CreateManualPlaceRequest,
  PlaceItem,
  SavedPlaceItem,
} from '@ours/contracts';
import { PLACE_PORT, PlacePort } from './places.port';

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PLACE_PORT) private readonly placePort: PlacePort,
  ) {}

  async search(
    spaceId: string,
    query?: string,
    category?: string,
    lat?: number,
    lng?: number,
  ): Promise<PlaceItem[]> {
    // 1. Fetch provider places
    const providerResults = await this.placePort.searchPlaces(query, category, lat, lng);

    // 2. Fetch space-specific manual places
    const manualPlaces = await this.prisma.place.findMany({
      where: {
        coupleSpaceId: spaceId,
        provider: 'manual',
        ...(category && category.toLowerCase() !== 'all'
          ? { category: { contains: category, mode: 'insensitive' } }
          : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });

    // 3. Upsert provider places into DB so they have real internal IDs
    const syncedProviderPlaces: PlaceItem[] = [];
    for (const pr of providerResults) {
      let place = await this.prisma.place.findFirst({
        where: {
          provider: pr.provider,
          providerPlaceId: pr.providerPlaceId,
        },
      });

      if (!place) {
        try {
          place = await this.prisma.place.create({
            data: {
              provider: pr.provider,
              providerPlaceId: pr.providerPlaceId,
              name: pr.name,
              address: pr.address,
              category: pr.category,
              latitude: pr.latitude,
              longitude: pr.longitude,
              metadata: pr.metadata || {},
            },
          });
        } catch {
          // If created concurrently by another process or partner search, retrieve it
          place = await this.prisma.place.findFirst({
            where: {
              provider: pr.provider,
              providerPlaceId: pr.providerPlaceId,
            },
          });
        }
      } else {
        place = await this.prisma.place.update({
          where: { id: place.id },
          data: {
            name: pr.name,
            address: pr.address,
            category: pr.category,
            latitude: pr.latitude,
            longitude: pr.longitude,
            metadata: pr.metadata || {},
          },
        });
      }

      if (place) {
        syncedProviderPlaces.push({
          id: place.id,
          provider: place.provider,
          providerPlaceId: place.providerPlaceId,
          name: place.name,
          address: place.address,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          metadata: (place.metadata as any) || null,
        });
      }
    }

    // 4. Combine and check saved status for this couple space
    const allPlaces: PlaceItem[] = [
      ...manualPlaces.map((p) => ({
        id: p.id,
        provider: p.provider,
        providerPlaceId: p.providerPlaceId,
        name: p.name,
        address: p.address,
        category: p.category,
        latitude: p.latitude,
        longitude: p.longitude,
        metadata: (p.metadata as any) || null,
      })),
      ...syncedProviderPlaces,
    ];

    const savedPlaceRecords = await this.prisma.savedPlace.findMany({
      where: {
        coupleSpaceId: spaceId,
        placeId: { in: allPlaces.map((p) => p.id) },
      },
    });

    const savedPlaceIdSet = new Set(savedPlaceRecords.map((s) => s.placeId));

    return allPlaces.map((p) => ({
      ...p,
      isSaved: savedPlaceIdSet.has(p.id),
    }));
  }

  async getPlaceById(spaceId: string, placeId: string): Promise<PlaceItem> {
    const place = await this.prisma.place.findFirst({
      where: {
        id: placeId,
        OR: [{ coupleSpaceId: null }, { coupleSpaceId: spaceId }],
      },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    const saved = await this.prisma.savedPlace.findFirst({
      where: {
        coupleSpaceId: spaceId,
        placeId: place.id,
      },
    });

    return {
      id: place.id,
      provider: place.provider,
      providerPlaceId: place.providerPlaceId,
      name: place.name,
      address: place.address,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      metadata: (place.metadata as any) || null,
      isSaved: !!saved,
    };
  }

  async getSavedPlaces(spaceId: string): Promise<SavedPlaceItem[]> {
    const saved = await this.prisma.savedPlace.findMany({
      where: { coupleSpaceId: spaceId },
      include: { place: true },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((s) => ({
      id: s.id,
      placeId: s.placeId,
      notes: s.notes,
      savedAt: s.createdAt.toISOString(),
      place: {
        id: s.place.id,
        provider: s.place.provider,
        providerPlaceId: s.place.providerPlaceId,
        name: s.place.name,
        address: s.place.address,
        category: s.place.category,
        latitude: s.place.latitude,
        longitude: s.place.longitude,
        metadata: (s.place.metadata as any) || null,
        isSaved: true,
      },
    }));
  }

  async savePlace(
    userId: string,
    spaceId: string,
    placeId: string,
    notes?: string,
  ): Promise<SavedPlaceItem> {
    const place = await this.prisma.place.findFirst({
      where: {
        id: placeId,
        OR: [{ coupleSpaceId: null }, { coupleSpaceId: spaceId }],
      },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    const saved = await this.prisma.savedPlace.upsert({
      where: {
        coupleSpaceId_placeId: {
          coupleSpaceId: spaceId,
          placeId: place.id,
        },
      },
      update: {
        notes: notes || undefined,
      },
      create: {
        coupleSpaceId: spaceId,
        placeId: place.id,
        savedById: userId,
        notes,
      },
      include: {
        place: true,
      },
    });

    return {
      id: saved.id,
      placeId: saved.placeId,
      notes: saved.notes,
      savedAt: saved.createdAt.toISOString(),
      place: {
        id: saved.place.id,
        provider: saved.place.provider,
        providerPlaceId: saved.place.providerPlaceId,
        name: saved.place.name,
        address: saved.place.address,
        category: saved.place.category,
        latitude: saved.place.latitude,
        longitude: saved.place.longitude,
        metadata: (saved.place.metadata as any) || null,
        isSaved: true,
      },
    };
  }

  async unsavePlace(spaceId: string, placeId: string): Promise<{ success: boolean }> {
    await this.prisma.savedPlace.deleteMany({
      where: {
        coupleSpaceId: spaceId,
        placeId,
      },
    });
    return { success: true };
  }

  async createManualPlace(
    userId: string,
    spaceId: string,
    dto: CreateManualPlaceRequest,
  ): Promise<PlaceItem> {
    const place = await this.prisma.place.create({
      data: {
        coupleSpaceId: spaceId,
        provider: 'manual',
        providerPlaceId: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: dto.name.trim(),
        address: dto.address?.trim() || null,
        category: dto.category?.trim() || 'Custom',
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        metadata: { manual: true, createdByUserId: userId },
      },
    });

    // Auto-save manual place to saved places
    await this.prisma.savedPlace.create({
      data: {
        coupleSpaceId: spaceId,
        placeId: place.id,
        savedById: userId,
      },
    });

    return {
      id: place.id,
      provider: place.provider,
      providerPlaceId: place.providerPlaceId,
      name: place.name,
      address: place.address,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      metadata: (place.metadata as any) || null,
      isSaved: true,
    };
  }
}
