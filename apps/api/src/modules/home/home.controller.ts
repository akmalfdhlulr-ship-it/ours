import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { HomeDashboardResponse } from '@ours/contracts';
import { HomeService } from './home.service';

@Controller('home')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  async getDashboard(
    @CurrentUser('id') userId: string,
    @CurrentSpace('id') spaceId: string,
  ): Promise<{ data: HomeDashboardResponse }> {
    const data = await this.homeService.getDashboard(userId, spaceId);
    return { data };
  }
}
