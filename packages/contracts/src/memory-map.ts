export interface MemoryMapPinDto {
  id: string;
  type: 'VISIT' | 'MEMORY' | 'PLACE';
  title: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  visitedAt?: string;
  category?: string;
  coverMediaUrl?: string;
  visitId?: string;
  memoryId?: string;
}

export interface MemoryMapResponseDto {
  pins: MemoryMapPinDto[];
  totalPins: number;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}
