import {
  generateSecureToken,
  hashSha256,
  parseCookies,
} from '../src/modules/auth/token.util';

describe('Token Utilities', () => {
  it('should generate secure hex tokens of requested byte size', () => {
    const token = generateSecureToken(32);
    expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('should generate unique tokens', () => {
    const t1 = generateSecureToken(32);
    const t2 = generateSecureToken(32);
    expect(t1).not.toBe(t2);
  });

  it('should hash tokens deterministically with SHA-256', () => {
    const raw = 'test-token-value';
    const h1 = hashSha256(raw);
    const h2 = hashSha256(raw);
    expect(h1).toHaveLength(64);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(raw);
  });

  it('should parse cookie headers correctly', () => {
    const header = 'ours_session=abc123xyz; theme=dark; other=value%20space';
    const parsed = parseCookies(header);
    expect(parsed.ours_session).toBe('abc123xyz');
    expect(parsed.theme).toBe('dark');
    expect(parsed.other).toBe('value space');
  });

  it('should handle empty or undefined cookie header gracefully', () => {
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('')).toEqual({});
  });
});
