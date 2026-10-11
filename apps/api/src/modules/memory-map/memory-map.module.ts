import { Module } from '@nestjs/common';
import { MemoryMapController } from './memory-map.controller';
import { MemoryMapService } from './memory-map.service';

@Module({
  controllers: [MemoryMapController],
  providers: [MemoryMapService],
  exports: [MemoryMapService],
})
export class MemoryMapModule {}
