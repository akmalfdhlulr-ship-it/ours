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
  CreateWishlistItemRequest,
  UpdateWishlistItemRequest,
  WishlistItemResponse,
  WishlistStatus,
} from '@ours/contracts';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async listItems(
    @CurrentSpace('id') spaceId: string,
    @Query('status') status?: WishlistStatus,
  ): Promise<{ data: WishlistItemResponse[] }> {
    const data = await this.wishlistService.listItems(spaceId, status);
    return { data };
  }

  @Post()
  async createItem(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: CreateWishlistItemRequest,
  ): Promise<{ data: WishlistItemResponse }> {
    const data = await this.wishlistService.createItem(userId, spaceId, body);
    return { data };
  }

  @Get(':id')
  async getItemById(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: WishlistItemResponse }> {
    const data = await this.wishlistService.getItemById(spaceId, id);
    return { data };
  }

  @Patch(':id')
  async updateItem(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
    @Body() body: UpdateWishlistItemRequest,
  ): Promise<{ data: WishlistItemResponse }> {
    const data = await this.wishlistService.updateItem(spaceId, id, body);
    return { data };
  }

  @Delete(':id')
  async archiveItem(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: WishlistItemResponse }> {
    const data = await this.wishlistService.archiveItem(spaceId, id);
    return { data };
  }
}
