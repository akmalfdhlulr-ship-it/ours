import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';
import { PasswordService } from '../src/modules/auth/password.service';
import { RateLimiterService } from '../src/common/security/rate-limiter.service';
import { hashSha256 } from '../src/modules/auth/token.util';

describe('AuthService Lifecycle', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockPasswordService: any;
  let mockRateLimiter: any;
  let mockEmailAdapter: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      coupleMembership: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    mockPasswordService = {
      hashPassword: jest.fn().mockResolvedValue('hashed-password-123'),
      verifyPassword: jest.fn(),
    };

    mockRateLimiter = {
      consume: jest.fn(),
    };

    mockEmailAdapter = {
      send: jest.fn().mockResolvedValue(true),
    };

    authService = new AuthService(
      mockPrisma,
      mockPasswordService,
      mockRateLimiter,
      mockEmailAdapter,
    );
  });

  describe('register', () => {
    it('should normalize email, hash password, create user and profile, and send verification email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-1',
        email: 'alex@example.com',
        emailVerified: false,
        profile: {
          displayName: 'Alex',
          avatarUrl: null,
        },
      });

      const res = await authService.register(
        { email: '  ALEX@Example.com  ', password: 'ValidPass123', displayName: 'Alex' },
        '127.0.0.1',
      );

      expect(res.user.email).toBe('alex@example.com');
      expect(res.user.emailVerified).toBe(false);
      expect(res.user.profile.displayName).toBe('Alex');
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith('ValidPass123');
      expect(mockEmailAdapter.send).toHaveBeenCalled();
    });

    it('should throw ConflictException when email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-u' });

      await expect(
        authService.register(
          { email: 'existing@example.com', password: 'ValidPass123', displayName: 'Alex' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyEmail', () => {
    it('should mark email as verified and clear verification tokens', async () => {
      const rawToken = 'raw-verify-token-123';
      const tokenHash = hashSha256(rawToken);

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'u-1',
        emailVerificationTokenHash: tokenHash,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await authService.verifyEmail({ token: rawToken });
      expect(res.verified).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: {
          emailVerified: true,
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
        },
      });
    });

    it('should throw BadRequestException when token is invalid or expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.verifyEmail({ token: 'nonexistent-token' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return session token and active couple space on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'alex@example.com',
        passwordHash: 'hashed-password-123',
        emailVerified: true,
        profile: { displayName: 'Alex', avatarUrl: null },
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockPrisma.session.create.mockResolvedValue({
        id: 's-1',
        expiresAt: new Date(Date.now() + 3600000),
      });
      mockPrisma.coupleMembership.findFirst.mockResolvedValue({
        coupleSpace: {
          id: 'cs-1',
          name: 'Alex & Jordan',
          status: 'ACTIVE',
        },
      });

      const { response, rawSessionToken } = await authService.login(
        { email: 'alex@example.com', password: 'ValidPass123' },
        '127.0.0.1',
      );

      expect(response.user.email).toBe('alex@example.com');
      expect(response.session.token).toBe(rawSessionToken);
      expect(response.coupleSpace).toEqual({
        id: 'cs-1',
        name: 'Alex & Jordan',
        status: 'ACTIVE',
      });
      expect(mockPrisma.session.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'alex@example.com',
        passwordHash: 'hashed-password-123',
      });
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      await expect(
        authService.login(
          { email: 'alex@example.com', password: 'WrongPassword' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword (Policy BR-I05)', () => {
    it('should update password and revoke ALL active sessions for the user', async () => {
      const rawToken = 'valid-reset-token';
      const tokenHash = hashSha256(rawToken);

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'u-1',
        passwordResetTokenHash: tokenHash,
      });
      mockPasswordService.hashPassword.mockResolvedValue('new-hashed-password');

      const res = await authService.resetPassword({
        token: rawToken,
        newPassword: 'NewSecurePass456',
      });

      expect(res.passwordReset).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
      });
    });
  });
});
