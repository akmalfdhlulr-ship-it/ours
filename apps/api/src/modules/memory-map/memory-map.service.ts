import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import { MemoryMapResponseDto, MemoryMapPinDto } from '@ours/contracts';

@Injectable()
export class MemoryMapService {
  constructor(private readonly prisma: PrismaService) {}

  async getMap(coupleSpaceId: string): Promise<MemoryMapResponseDto> {
    const pins: MemoryMapPinDto[] = [];

    // 1. Visited places with coordinates
    const visits = await this.prisma.visit.findMany({
      where: {
        coupleSpaceId,
        place: {
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      include: {
        place: true,
      },
      orderBy: { visitedAt: 'desc' },
    });

    for (const v of visits) {
      if (v.place?.latitude != null && v.place?.longitude != null) {
        pins.push({
          id: `visit-${v.id}`,
          type: 'VISIT',
          title: v.place.name,
          latitude: v.place.latitude,
          longitude: v.place.longitude,
          locationName: v.place.address || v.place.name,
          visitedAt: v.visitedAt.toISOString(),
          category: v.place.category || undefined,
          visitId: v.id,
        });
      }
    }

    // 2. Geolocated memories
    const memories = await this.prisma.memory.findMany({
      where: {
        coupleSpaceId,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        media: {
          include: {
            mediaAsset: true,
          },
          take: 1,
        },
      },
      orderBy: { memoryDate: 'desc' },
    });

    for (const m of memories) {
      if (m.latitude != null && m.longitude != null) {
        pins.push({
          id: `memory-${m.id}`,
          type: 'MEMORY',
          title: m.title,
          latitude: m.latitude,
          longitude: m.longitude,
          locationName: m.locationName || undefined,
          visitedAt: m.memoryDate.toISOString(),
          memoryId: m.id,
        });
      }
    }

    // Calculate bounding box if pins exist
    let bounds: MemoryMapResponseDto['bounds'] = undefined;
    if (pins.length > 0) {
      let minLat = pins[0].latitude;
      let maxLat = pins[0].latitude;
      let minLng = pins[0].longitude;
      let maxLng = pins[0].longitude;

      for (const p of pins) {
        if (p.latitude < minLat) minLat = p.latitude;
        if (p.latitude > maxLat) maxLat = p.latitude;
        if (p.longitude < minLng) minLng = p.longitude;
        if (p.longitude > maxLng) maxLng = p.longitude;
      }

      bounds = { minLat, maxLat, minLng, maxLng };
    }

    return {
      pins,
      totalPins: pins.length,
      bounds,
    };
  }
}
