import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ChangePasswordResponse,
  UserMeResponse,
  UserMembershipItem,
} from '@ours/contracts';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSession } from '../../common/decorators/current-session.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

interface SessionContext {
  id: string;
}

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(
    @CurrentUser('id') userId: string,
  ): Promise<{ data: UserMeResponse }> {
    const data = await this.usersService.getMe(userId);
    return { data };
  }

  @Patch('me/profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ data: UserMeResponse['profile'] }> {
    const data = await this.usersService.updateProfile(userId, dto);
    return { data };
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @CurrentSession() session: SessionContext,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ data: ChangePasswordResponse }> {
    const data = await this.usersService.changePassword(userId, session.id, dto);
    return { data };
  }

  @Get('me/memberships')
  async getMemberships(
    @CurrentUser('id') userId: string,
  ): Promise<{ data: UserMembershipItem[] }> {
    const data = await this.usersService.getMemberships(userId);
    return { data };
  }
}
