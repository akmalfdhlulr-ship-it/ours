import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import {
  ForgotPasswordResponse,
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
  ResendVerificationResponse,
  ResetPasswordResponse,
  RevokeSessionResponse,
  SessionItem,
  VerifyEmailResponse,
} from '@ours/contracts';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface RequestWithSessionToken extends Request {
  sessionToken?: string;
  user?: { id: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
  ): Promise<{ data: RegisterResponse }> {
    const data = await this.authService.register(dto, ip);
    return { data };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
  ): Promise<{ data: VerifyEmailResponse }> {
    const data = await this.authService.verifyEmail(dto);
    return { data };
  }

  @UseGuards(AuthGuard)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @CurrentUser('id') userId: string,
  ): Promise<{ data: ResendVerificationResponse }> {
    const data = await this.authService.resendVerification(userId);
    return { data };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: LoginResponse }> {
    const { response, rawSessionToken } = await this.authService.login(dto, ip);

    // Set HttpOnly session cookie
    res.cookie('ours_session', rawSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 3600 * 1000,
    });

    return { data: response };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: RequestWithSessionToken,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: LogoutResponse }> {
    const sessionToken = req.sessionToken || '';
    const data = await this.authService.logout(sessionToken);

    res.clearCookie('ours_session', { path: '/' });

    return { data };
  }

  @UseGuards(AuthGuard)
  @Get('sessions')
  async getSessions(
    @CurrentUser('id') userId: string,
    @Req() req: RequestWithSessionToken,
  ): Promise<{ data: SessionItem[] }> {
    const sessionToken = req.sessionToken || '';
    const data = await this.authService.getSessions(userId, sessionToken);
    return { data };
  }

  @UseGuards(AuthGuard)
  @Delete('sessions/:id')
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ): Promise<{ data: RevokeSessionResponse }> {
    const data = await this.authService.revokeSession(userId, sessionId);
    return { data };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Ip() ip: string,
  ): Promise<{ data: ForgotPasswordResponse }> {
    const data = await this.authService.forgotPassword(dto, ip);
    return { data };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: ResetPasswordResponse }> {
    const data = await this.authService.resetPassword(dto);

    res.clearCookie('ours_session', { path: '/' });

    return { data };
  }
}
