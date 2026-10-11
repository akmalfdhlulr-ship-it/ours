import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ArchivedSpaceMetadata,
  ArchiveSpaceResponse,
  CreateSpaceResponse,
  JoinResponse,
  SpaceDetails,
} from '@ours/contracts';
import { AuthGuard } from '../../common/guards/auth.guard';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AllowPendingSpace } from '../../common/decorators/allow-pending-space.decorator';
import { SpacesService } from './spaces.service';
import { InvitationsService } from './invitations.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { ArchiveSpaceDto } from './dto/archive-space.dto';
import { JoinByTokenDto } from './dto/join-by-token.dto';
import { JoinByCodeDto } from './dto/join-by-code.dto';

@UseGuards(AuthGuard)
@Controller('spaces')
export class SpacesController {
  constructor(
    private readonly spacesService: SpacesService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @UseGuards(EmailVerifiedGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSpace(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSpaceDto,
  ): Promise<{ data: CreateSpaceResponse }> {
    const data = await this.spacesService.createSpace(userId, dto);
    return { data };
  }

  @Get('current')
  async getCurrentSpace(
    @CurrentUser('id') userId: string,
  ): Promise<{ data: SpaceDetails | null }> {
    const data = await this.spacesService.getCurrentSpace(userId);
    return { data };
  }

  @Get('archived')
  async getArchivedSpaces(
    @CurrentUser('id') userId: string,
  ): Promise<{ data: ArchivedSpaceMetadata[] }> {
    const data = await this.spacesService.getArchivedSpaces(userId);
    return { data };
  }

  @UseGuards(EmailVerifiedGuard)
  @Post('join')
  @HttpCode(HttpStatus.OK)
  async joinByToken(
    @CurrentUser('id') userId: string,
    @Body() dto: JoinByTokenDto,
  ): Promise<{ data: JoinResponse }> {
    const data = await this.invitationsService.joinByToken(userId, dto.token);
    return { data };
  }

  @UseGuards(EmailVerifiedGuard)
  @Post('join/code')
  @HttpCode(HttpStatus.OK)
  async joinByCode(
    @CurrentUser('id') userId: string,
    @Ip() ip: string,
    @Body() dto: JoinByCodeDto,
  ): Promise<{ data: JoinResponse }> {
    const data = await this.invitationsService.joinByCode(
      userId,
      dto.pairingCode,
      ip,
    );
    return { data };
  }

  @UseGuards(CoupleSpaceGuard)
  @AllowPendingSpace()
  @Get(':spaceId')
  async getSpace(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
  ): Promise<{ data: SpaceDetails }> {
    const data = await this.spacesService.getSpace(userId, spaceId);
    return { data };
  }

  @UseGuards(CoupleSpaceGuard)
  @Patch(':spaceId')
  async updateSpace(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Body() dto: UpdateSpaceDto,
  ): Promise<{ data: SpaceDetails }> {
    const data = await this.spacesService.updateSpace(userId, spaceId, dto);
    return { data };
  }

  @UseGuards(CoupleSpaceGuard)
  @AllowPendingSpace()
  @Post(':spaceId/archive')
  @HttpCode(HttpStatus.OK)
  async archiveSpace(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Body() dto: ArchiveSpaceDto,
  ): Promise<{ data: ArchiveSpaceResponse }> {
    const data = await this.spacesService.archiveSpace(userId, spaceId, dto);
    return { data };
  }
}
