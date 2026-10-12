import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@ours/database';
import { AUTH_CONFIG, normalizeEmail } from '@ours/core';
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
import { EMAIL_ADAPTER, EmailAdapter } from '../../infrastructure/email/email.interface';
import { RateLimiterService } from '../../common/security/rate-limiter.service';
import { PasswordService } from './password.service';
import { generateSecureToken, hashSha256 } from './token.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly rateLimiter: RateLimiterService,
    @Inject(EMAIL_ADAPTER) private readonly emailAdapter: EmailAdapter,
  ) {}

  async register(dto: RegisterDto, ipAddress = '127.0.0.1'): Promise<RegisterResponse> {
    // Rate limit: 5 registration attempts per IP per hour
    this.rateLimiter.consume(`register:${ipAddress}`, { max: 5, windowMs: 3600000 });

    const normalized = normalizeEmail(dto.email);

    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);
    const verificationToken = generateSecureToken(32);
    const verificationTokenHash = hashSha256(verificationToken);
    const verificationExpiresAt = new Date(
      Date.now() + AUTH_CONFIG.EMAIL_VERIFICATION_EXPIRY_HOURS * 3600000,
    );

    const isMockEmail = !process.env.SMTP_HOST && !process.env.RESEND_API_KEY;
    const shouldAutoVerify = process.env.AUTO_VERIFY_EMAIL === 'true' || isMockEmail;

    const user = await this.prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        emailVerified: shouldAutoVerify,
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationExpiresAt: verificationExpiresAt,
        profile: {
          create: {
            displayName: dto.displayName.trim(),
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Send verification email
    await this.emailAdapter.send({
      to: user.email,
      subject: 'Verify your OURS account',
      html: `<p>Welcome to OURS! Your verification token is: <strong>${verificationToken}</strong></p>`,
      text: `Welcome to OURS! Your verification token is: ${verificationToken}`,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        profile: {
          displayName: user.profile?.displayName ?? '',
          avatarUrl: user.profile?.avatarUrl ?? null,
        },
      },
      verificationToken,
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<VerifyEmailResponse> {
    const tokenHash = hashSha256(dto.token);

    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { verified: true };
  }

  async resendVerification(userId: string): Promise<ResendVerificationResponse> {
    // Rate limit: 3 resend requests per user per hour
    this.rateLimiter.consume(`resend:${userId}`, { max: 3, windowMs: 3600000 });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified' };
    }

    const verificationToken = generateSecureToken(32);
    const verificationTokenHash = hashSha256(verificationToken);
    const verificationExpiresAt = new Date(
      Date.now() + AUTH_CONFIG.EMAIL_VERIFICATION_EXPIRY_HOURS * 3600000,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationExpiresAt: verificationExpiresAt,
      },
    });

    await this.emailAdapter.send({
      to: user.email,
      subject: 'Verify your OURS account',
      html: `<p>Your new verification token is: <strong>${verificationToken}</strong></p>`,
      text: `Your new verification token is: ${verificationToken}`,
    });

    return { message: 'Verification email dispatched', verificationToken };
  }

  async login(
    dto: LoginDto,
    ipAddress = '127.0.0.1',
  ): Promise<{ response: LoginResponse; rawSessionToken: string }> {
    // Rate limit: 10 login attempts per IP per 15 minutes
    this.rateLimiter.consume(`login:${ipAddress}`, { max: 10, windowMs: 900000 });

    const normalized = normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate opaque session token
    const rawSessionToken = generateSecureToken(32);
    const tokenHash = hashSha256(rawSessionToken);
    const expiresAt = new Date(
      Date.now() + AUTH_CONFIG.SESSION_EXPIRY_DAYS * 24 * 3600000,
    );

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        lastActiveAt: new Date(),
        deviceInfo: dto.deviceInfo || null,
        pushToken: dto.pushToken || null,
        ipAddress: ipAddress || null,
      },
    });

    // Check active couple space membership
    const activeMembership = await this.prisma.coupleMembership.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        coupleSpace: true,
      },
    });

    const coupleSpace = activeMembership
      ? {
          id: activeMembership.coupleSpace.id,
          name: activeMembership.coupleSpace.name,
          status: activeMembership.coupleSpace.status,
        }
      : null;

    return {
      rawSessionToken,
      response: {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          profile: {
            displayName: user.profile?.displayName ?? '',
            avatarUrl: user.profile?.avatarUrl ?? null,
          },
        },
        session: {
          token: rawSessionToken,
          expiresAt: session.expiresAt.toISOString(),
        },
        coupleSpace,
      },
    };
  }

  async logout(sessionToken: string): Promise<LogoutResponse> {
    if (sessionToken) {
      const tokenHash = hashSha256(sessionToken);
      await this.prisma.session.deleteMany({
        where: { tokenHash },
      });
    }

    return { loggedOut: true };
  }

  async getSessions(userId: string, currentSessionToken: string): Promise<SessionItem[]> {
    const currentTokenHash = currentSessionToken ? hashSha256(currentSessionToken) : '';

    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        lastActiveAt: 'desc',
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt.toISOString(),
      isCurrent: s.tokenHash === currentTokenHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<RevokeSessionResponse> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    return { revoked: true };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    ipAddress = '127.0.0.1',
  ): Promise<ForgotPasswordResponse> {
    const normalized = normalizeEmail(dto.email);

    // Rate limit: 3 requests per email per hour
    this.rateLimiter.consume(`forgot:${normalized}`, { max: 3, windowMs: 3600000 });
    this.rateLimiter.consume(`forgot-ip:${ipAddress}`, { max: 10, windowMs: 3600000 });

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (user) {
      const resetToken = generateSecureToken(32);
      const resetTokenHash = hashSha256(resetToken);
      const resetExpiresAt = new Date(
        Date.now() + AUTH_CONFIG.PASSWORD_RESET_EXPIRY_HOURS * 3600000,
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: resetTokenHash,
          passwordResetExpiresAt: resetExpiresAt,
        },
      });

      await this.emailAdapter.send({
        to: user.email,
        subject: 'Password reset request for OURS',
        html: `<p>Your password reset token is: <strong>${resetToken}</strong></p>`,
        text: `Your password reset token is: ${resetToken}`,
      });
    }

    // Always return same response to prevent user enumeration
    return {
      message: 'If an account exists, a reset email was sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
    const tokenHash = hashSha256(dto.token);

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword);

    // Atomic transaction: update password and revoke ALL active sessions (BR-I05)
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      }),
      this.prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return { passwordReset: true };
  }
}
