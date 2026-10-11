import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { InvitationsController } from './invitations.controller';
import { SpacesService } from './spaces.service';
import { InvitationsService } from './invitations.service';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';

@Module({
  controllers: [SpacesController, InvitationsController],
  providers: [SpacesService, InvitationsService, CoupleSpaceGuard],
  exports: [SpacesService, InvitationsService, CoupleSpaceGuard],
})
export class SpacesModule {}
