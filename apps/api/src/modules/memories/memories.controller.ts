import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import {
  CreateMemoryRequest,
  MemoryItem,
  UpdateMemoryRequest,
} from '@ours/contracts';
import { MemoriesService } from './memories.service';

@Controller('memories')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Get()
  async listMemories(
    @CurrentSpace('id') spaceId: string,
    @Query('isFavorite') isFavorite?: string,
  ): Promise<{ data: MemoryItem[] }> {
    const data = await this.memoriesService.listMemories(
      spaceId,
      isFavorite === 'true' ? true : undefined,
    );
    return { data };
  }

  @Get('on-this-day')
  async getOnThisDay(
    @CurrentSpace('id') spaceId: string,
  ): Promise<{ data: MemoryItem[] }> {
    const data = await this.memoriesService.getOnThisDay(spaceId);
    return { data };
  }

  @Post()
  async createMemory(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: CreateMemoryRequest,
  ): Promise<{ data: MemoryItem }> {
    const data = await this.memoriesService.createMemory(userId, spaceId, body);
    return { data };
  }

  @Get(':id')
  async getMemoryById(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: MemoryItem }> {
    const data = await this.memoriesService.getMemoryById(spaceId, id);
    return { data };
  }

  @Patch(':id')
  async updateMemory(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Body() body: UpdateMemoryRequest,
  ): Promise<{ data: MemoryItem }> {
    const data = await this.memoriesService.updateMemory(spaceId, id, body);
    return { data };
  }

  @Delete(':id')
  async deleteMemory(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: { success: boolean } }> {
    const data = await this.memoriesService.deleteMemory(spaceId, id);
    return { data };
  }
}
