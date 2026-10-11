import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import {
  AlbumItem,
  CreateAlbumRequest,
  MemoryItem,
  UpdateAlbumRequest,
} from '@ours/contracts';
import { AlbumsService } from './albums.service';

@Controller('albums')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get()
  async listAlbums(
    @CurrentSpace('id') spaceId: string,
  ): Promise<{ data: AlbumItem[] }> {
    const data = await this.albumsService.listAlbums(spaceId);
    return { data };
  }

  @Post()
  async createAlbum(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: CreateAlbumRequest,
  ): Promise<{ data: AlbumItem }> {
    const data = await this.albumsService.createAlbum(userId, spaceId, body);
    return { data };
  }

  @Get(':id')
  async getAlbumById(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: AlbumItem & { memories: MemoryItem[] } }> {
    const data = await this.albumsService.getAlbumById(spaceId, id);
    return { data };
  }

  @Patch(':id')
  async updateAlbum(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Body() body: UpdateAlbumRequest,
  ): Promise<{ data: AlbumItem }> {
    const data = await this.albumsService.updateAlbum(spaceId, id, body);
    return { data };
  }

  @Post(':id/memories')
  async addMemory(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Body('memoryId') memoryId: string,
  ): Promise<{ data: { success: boolean } }> {
    const data = await this.albumsService.addMemoryToAlbum(spaceId, id, memoryId);
    return { data };
  }

  @Delete(':id/memories/:memoryId')
  async removeMemory(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Param('memoryId') memoryId: string,
  ): Promise<{ data: { success: boolean } }> {
    const data = await this.albumsService.removeMemoryFromAlbum(spaceId, id, memoryId);
    return { data };
  }

  @Delete(':id')
  async deleteAlbum(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: { success: boolean } }> {
    const data = await this.albumsService.deleteAlbum(spaceId, id);
    return { data };
  }
}
