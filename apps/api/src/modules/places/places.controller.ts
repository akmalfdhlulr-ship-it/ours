import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import {
  CreateManualPlaceRequest,
  PlaceItem,
  SavePlaceRequest,
  SavedPlaceItem,
} from '@ours/contracts';
import { PlacesService } from './places.service';

@Controller('places')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('search')
  async search(
    @CurrentSpace('id') spaceId: string,
    @Query('query') query?: string,
    @Query('category') category?: string,
    @Query('latitude') lat?: string,
    @Query('longitude') lng?: string,
  ): Promise<{ data: PlaceItem[] }> {
    const data = await this.placesService.search(
      spaceId,
      query,
      category,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
    );
    return { data };
  }

  @Get('saved')
  async getSavedPlaces(
    @CurrentSpace('id') spaceId: string,
  ): Promise<{ data: SavedPlaceItem[] }> {
    const data = await this.placesService.getSavedPlaces(spaceId);
    return { data };
  }

  @Post('saved')
  async savePlace(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: SavePlaceRequest,
  ): Promise<{ data: SavedPlaceItem }> {
    const data = await this.placesService.savePlace(
      userId,
      spaceId,
      body.placeId,
      body.notes,
    );
    return { data };
  }

  @Delete('saved/:id')
  async unsavePlace(
    @CurrentSpace('id') spaceId: string,
    @Param('id') placeId: string,
  ): Promise<{ data: { success: boolean } }> {
    const data = await this.placesService.unsavePlace(spaceId, placeId);
    return { data };
  }

  @Post('manual')
  async createManualPlace(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
    @Body() body: CreateManualPlaceRequest,
  ): Promise<{ data: PlaceItem }> {
    const data = await this.placesService.createManualPlace(userId, spaceId, body);
    return { data };
  }

  @Get(':id')
  async getPlaceById(
    @CurrentSpace('id') spaceId: string,
    @Param('id') id: string,
  ): Promise<{ data: PlaceItem }> {
    const data = await this.placesService.getPlaceById(spaceId, id);
    return { data };
  }
}
