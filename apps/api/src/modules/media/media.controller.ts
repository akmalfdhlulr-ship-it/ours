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
    @Body()
    body: {
      imageBase64?: string;
      dataUrl?: string;
      filename?: string;
      fileName?: string;
      mimeType?: string;
    },
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
    if (!key) {
      return res.status(400).send('Missing key');
    }
    try {
      const asset = await this.mediaService.getMediaByKey(key);
      if (asset?.metadata && typeof asset.metadata === 'object') {
        const secureUrl = (asset.metadata as any).secureUrl;
        if (secureUrl && typeof secureUrl === 'string' && secureUrl.startsWith('http')) {
          return res.redirect(secureUrl);
        }
        const dataUrl = (asset.metadata as any).dataUrl;
        if (dataUrl && typeof dataUrl === 'string') {
          const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1] || asset.mimeType || 'image/jpeg';
            const buffer = Buffer.from(match[2], 'base64');
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(buffer);
          }
        }
      }
    } catch {
      // Fallback below
    }

    // Clean branded SVG placeholder if missing
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="100%" height="100%" fill="#F8F9F7"/>
      <circle cx="200" cy="130" r="40" fill="#E6EBFA"/>
      <path d="M185 125 L215 125 L215 145 L185 145 Z" fill="#3657D6"/>
      <text x="200" y="200" font-family="system-ui, sans-serif" font-size="14" fill="#666" text-anchor="middle">OURS Ruang Kita Photo</text>
    </svg>`;
    return res.send(svg);
  }
}
