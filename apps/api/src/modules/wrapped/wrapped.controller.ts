import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoupleSpaceGuard } from '../../common/guards/couple-space.guard';
import { CurrentSpace } from '../../common/decorators/current-space.decorator';
import { WrappedService } from './wrapped.service';
import { OursWrappedDto } from '@ours/contracts';

@Controller('wrapped')
@UseGuards(AuthGuard, CoupleSpaceGuard)
export class WrappedController {
  constructor(private readonly wrappedService: WrappedService) {}

  @Get()
  async getWrapped(
    @CurrentSpace('id') spaceId: string,
    @Query('year') year?: string,
  ): Promise<OursWrappedDto> {
    const numYear = year ? parseInt(year, 10) : undefined;
    return this.wrappedService.getWrapped(spaceId, numYear);
  }
}
