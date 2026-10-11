import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { LettersService } from './letters.service';
import { LoveLetterDto, CreateLoveLetterDto, UpdateLoveLetterDto } from '@ours/contracts';

@Controller('letters')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class LettersController {
  constructor(private readonly lettersService: LettersService) {}

  @Get()
  async list(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<LoveLetterDto[]> {
    return this.lettersService.list(spaceId, userId);
  }

  @Post()
  async create(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLoveLetterDto,
  ): Promise<LoveLetterDto> {
    return this.lettersService.create(spaceId, userId, dto);
  }

  @Get(':id')
  async get(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<LoveLetterDto> {
    return this.lettersService.get(spaceId, userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLoveLetterDto,
  ): Promise<LoveLetterDto> {
    return this.lettersService.update(spaceId, userId, id, dto);
  }

  @Post(':id/send')
  async send(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<LoveLetterDto> {
    return this.lettersService.send(spaceId, userId, id);
  }
}
