import { Module } from '@nestjs/common';
import { MemoriesController } from './memories.controller';
import { MemoriesService } from './memories.service';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';

@Module({
  controllers: [MemoriesController, AlbumsController],
  providers: [MemoriesService, AlbumsService],
  exports: [MemoriesService, AlbumsService],
})
export class MemoriesModule {}
