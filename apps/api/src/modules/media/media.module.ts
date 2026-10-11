import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { STORAGE_PORT } from './storage.port';
import { CloudinaryAdapter } from './cloudinary.adapter';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: STORAGE_PORT,
      useClass: CloudinaryAdapter,
    },
  ],
  exports: [MediaService, STORAGE_PORT],
})
export class MediaModule {}
