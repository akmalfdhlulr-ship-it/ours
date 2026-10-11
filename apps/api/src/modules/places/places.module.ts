import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { PLACE_PORT } from './places.port';
import { OpenStreetMapPlacesAdapter } from './openstreetmap-places.adapter';

@Module({
  controllers: [PlacesController],
  providers: [
    PlacesService,
    {
      provide: PLACE_PORT,
      useClass: OpenStreetMapPlacesAdapter,
    },
  ],
  exports: [PlacesService, PLACE_PORT],
})
export class PlacesModule {}
