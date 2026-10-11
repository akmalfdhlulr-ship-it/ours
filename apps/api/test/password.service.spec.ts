import { PasswordService } from '../src/modules/auth/password.service';
import { isStrongPassword } from '@ours/core';

describe('PasswordService & Password Policies', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  it('should hash password and verify matching password', async () => {
    const raw = 'SecurePass123';
    const hash = await passwordService.hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(raw);
    expect(hash.startsWith('$2')).toBe(true);

    const matches = await passwordService.verifyPassword(raw, hash);
    expect(matches).toBe(true);

    const wrong = await passwordService.verifyPassword('WrongPass123', hash);
    expect(wrong).toBe(false);
  });

  describe('isStrongPassword (Policy BR-I02)', () => {
    it('should accept passwords with min 8 chars, 1 uppercase, 1 lowercase, 1 digit', () => {
      expect(isStrongPassword('ValidPass1')).toBe(true);
      expect(isStrongPassword('SuperLongSecret123!')).toBe(true);
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(isStrongPassword('Short1A')).toBe(false);
    });

    it('should reject passwords without uppercase letters', () => {
      expect(isStrongPassword('lowercase123')).toBe(false);
    });

    it('should reject passwords without lowercase letters', () => {
      expect(isStrongPassword('UPPERCASE123')).toBe(false);
    });

    it('should reject passwords without digits', () => {
      expect(isStrongPassword('NoDigitsHere')).toBe(false);
    });

    it('should reject passwords longer than 128 characters', () => {
      expect(isStrongPassword('A1a' + 'x'.repeat(126))).toBe(false);
    });
  });
});
