import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { RateLimiterService } from '../../common/security/rate-limiter.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    RateLimiterService,
    AuthGuard,
    EmailVerifiedGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    RateLimiterService,
    AuthGuard,
    EmailVerifiedGuard,
  ],
})
export class AuthModule {}
