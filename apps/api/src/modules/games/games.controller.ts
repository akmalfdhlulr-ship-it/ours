import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { GamesService } from './games.service';
import { DailySparkQuestionDto, QuizSessionDto, CreateQuizSessionDto, SubmitQuizAnswersDto } from '@ours/contracts';

@Controller('games')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('daily-spark')
  getDailySpark(): DailySparkQuestionDto {
    return this.gamesService.getDailySpark();
  }

  @Get('sessions')
  async listSessions(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<QuizSessionDto[]> {
    return this.gamesService.listSessions(spaceId, userId);
  }

  @Post('sessions')
  async createSession(
    @CurrentSpace('id') spaceId: string,
    @Body() dto: CreateQuizSessionDto,
  ): Promise<QuizSessionDto> {
    return this.gamesService.createSession(spaceId, dto);
  }

  @Post('sessions/:id/answer')
  async submitAnswers(
    @CurrentSpace('id') spaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SubmitQuizAnswersDto,
  ): Promise<QuizSessionDto> {
    return this.gamesService.submitAnswers(spaceId, userId, id, dto);
  }
}
