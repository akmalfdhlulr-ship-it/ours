import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { MemoryMapService } from './memory-map.service';
import { MemoryMapResponseDto } from '@ours/contracts';

@Controller('memory-map')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class MemoryMapController {
  constructor(private readonly memoryMapService: MemoryMapService) {}

  @Get()
  async getMap(@CurrentSpace('id') spaceId: string): Promise<MemoryMapResponseDto> {
    return this.memoryMapService.getMap(spaceId);
  }
}
