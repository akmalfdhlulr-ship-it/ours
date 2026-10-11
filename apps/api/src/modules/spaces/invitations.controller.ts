import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CreateInvitationResponse,
  InvitationMetadata,
  InvitationPreviewResponse,
  RevokeInvitationResponse,
} from '@ours/contracts';
import { AuthGuard } from '../../common/guards/auth.guard';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AllowPendingSpace } from '../../common/decorators/allow-pending-space.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { InvitationsService } from './invitations.service';

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @UseGuards(AuthGuard, EmailVerifiedGuard, CoupleSpaceGuard)
  @AllowPendingSpace()
  @Post('spaces/:spaceId/invitations')
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
  ): Promise<{ data: CreateInvitationResponse }> {
    const data = await this.invitationsService.createInvitation(
      userId,
      spaceId,
    );
    return { data };
  }

  @UseGuards(AuthGuard, CoupleSpaceGuard)
  @AllowPendingSpace()
  @Get('spaces/:spaceId/invitations')
  async listInvitations(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
  ): Promise<{ data: InvitationMetadata[] }> {
    const data = await this.invitationsService.listInvitations(
      userId,
      spaceId,
    );
    return { data };
  }

  @UseGuards(AuthGuard, CoupleSpaceGuard)
  @AllowPendingSpace()
  @Post('spaces/:spaceId/invitations/:id/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeInvitation(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: RevokeInvitationResponse }> {
    const data = await this.invitationsService.revokeInvitation(
      userId,
      spaceId,
      id,
    );
    return { data };
  }

  @Public()
  @Get('invitations/:token/preview')
  async previewInvitation(
    @Param('token') token: string,
  ): Promise<{ data: InvitationPreviewResponse }> {
    const data = await this.invitationsService.previewInvitation(token);
    return { data };
  }
}
