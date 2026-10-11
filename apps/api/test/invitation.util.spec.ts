import {
  generateInvitationToken,
  generatePairingCode,
  hashInvitationToken,
  hmacPairingCode,
  timingSafeCompare,
} from '../src/modules/spaces/invitation.util';

describe('invitation.util', () => {
  const secret = 'super-secret-hmac-key-min-32-chars-long';

  describe('generateInvitationToken', () => {
    it('generates a 64-character hex string (32 bytes entropy)', () => {
      const token1 = generateInvitationToken();
      const token2 = generateInvitationToken();
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).toMatch(/^[0-9a-f]{64}$/);
      expect(token1).not.toBe(token2);
    });
  });

  describe('generatePairingCode', () => {
    it('generates a 6-character uppercase alphanumeric code without ambiguous characters', () => {
      const code = generatePairingCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
      // Verify no ambiguous characters: 0, O, 1, I
      expect(code).not.toMatch(/[01IO]/);
    });
  });

  describe('hashInvitationToken', () => {
    it('deterministically hashes with sha256 to a 64-char hex string', () => {
      const token = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const hash1 = hashInvitationToken(token);
      const hash2 = hashInvitationToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('hmacPairingCode', () => {
    it('generates an HMAC-SHA256 signature using secret', () => {
      const code = 'ABC123';
      const hmac1 = hmacPairingCode(code, secret);
      const hmac2 = hmacPairingCode(code, secret);
      expect(hmac1).toBe(hmac2);
      expect(hmac1).toHaveLength(64);

      const hmacDiff = hmacPairingCode('XYZ987', secret);
      expect(hmac1).not.toBe(hmacDiff);
    });
  });

  describe('timingSafeCompare', () => {
    it('returns true for matching strings of identical length', () => {
      expect(timingSafeCompare('hash123456', 'hash123456')).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(timingSafeCompare('hash123456', 'hash999999')).toBe(false);
    });

    it('returns false for different lengths without throwing', () => {
      expect(timingSafeCompare('hash123', 'hash123456')).toBe(false);
      expect(timingSafeCompare('', 'something')).toBe(false);
    });
  });
});
