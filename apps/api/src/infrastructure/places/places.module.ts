import { Global, Module } from '@nestjs/common';
import { PLACES_ADAPTER } from './places.interface';
import { MockPlacesAdapter } from './mock-places.adapter';

@Global()
@Module({
  providers: [
    {
      provide: PLACES_ADAPTER,
      useClass: MockPlacesAdapter,
    },
  ],
  exports: [PLACES_ADAPTER],
})
export class PlacesModule {}
