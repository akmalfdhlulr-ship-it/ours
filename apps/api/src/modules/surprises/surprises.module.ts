import { Module } from '@nestjs/common';
import { SurprisesController } from './surprises.controller';
import { SurprisesService } from './surprises.service';

@Module({
  controllers: [SurprisesController],
  providers: [SurprisesService],
  exports: [SurprisesService],
})
export class SurprisesModule {}
