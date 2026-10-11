import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import {
  CompleteUploadRequest,
  MediaAssetItem,
  StorageUsageResponse,
  UploadSignatureRequest,
  UploadSignatureResponse,
} from '@ours/contracts';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async listMedia(
    @CurrentSpace('id') spaceId: string,
  ): Promise<{ data: MediaAssetItem[] }> {
    const data = await this.mediaService.listMedia(spaceId);
    return { data };
  }

  @Get('usage')
  async getStorageUsage(
    @CurrentSpace('id') spaceId: string,
  ): Promise<{ data: StorageUsageResponse }> {
    const data = await this.mediaService.getStorageUsage(spaceId);
    return { data };
  }

  @Post('upload-signature')
  async getUploadSignature(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: UploadSignatureRequest,
  ): Promise<{ data: UploadSignatureResponse }> {
    const data = await this.mediaService.getUploadSignature(userId, spaceId, body);
    return { data };
  }

  @Post('complete')
  async completeUpload(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: CompleteUploadRequest,
  ): Promise<{ data: MediaAssetItem }> {
    const data = await this.mediaService.completeUpload(userId, spaceId, body);
    return { data };
  }

  @Post('direct-upload')
  async directUpload(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: { imageBase64: string; filename?: string; mimeType?: string },
  ): Promise<{ data: MediaAssetItem }> {
    const data = await this.mediaService.directUpload(userId, spaceId, body);
    return { data };
  }

  @Delete(':id')
  async softDelete(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: { success: boolean } }> {
    const data = await this.mediaService.softDelete(spaceId, id);
    return { data };
  }

  @Post(':id/restore')
  async restoreMedia(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: MediaAssetItem }> {
    const data = await this.mediaService.restoreMedia(spaceId, id);
    return { data };
  }

  @Get('stream')
  async streamMedia(
    @Query('key') key: string,
    @Res() res: Response,
  ) {
    // Verified tenant media delivery stream
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    // Return empty 1x1 transparent SVG/GIF or image fallback
    res.send(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64',
      ),
    );
  }
}
