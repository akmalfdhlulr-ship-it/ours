import * as crypto from 'crypto';

const CODE_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a cryptographically random 64-character hex URL token (32 bytes).
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes SHA-256 hash of an invitation URL token.
 */
export function hashInvitationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a 6-character uppercase alphanumeric pairing code avoiding ambiguous characters.
 */
export function generatePairingCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = crypto.randomInt(0, CODE_CHARSET.length);
    code += CODE_CHARSET[idx];
  }
  return code;
}

/**
 * Computes keyed HMAC-SHA256 for a pairing code.
 */
export function hmacPairingCode(code: string, secret: string): string {
  const normalized = code.trim().toUpperCase();
  return crypto.createHmac('sha256', secret).update(normalized).digest('hex');
}

/**
 * Constant-time comparison to prevent timing side-channel attacks on pairing codes.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      const dummy = Buffer.alloc(bufA.length);
      crypto.timingSafeEqual(bufA, dummy);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
