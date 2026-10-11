/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Strips sensitive keys (like passwords, tokens, secrets) from an object for safe logging.
 */
export function sanitizeForLogging<T>(obj: T): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeForLogging(item));

  const sensitivePattern = /password|token|secret|authorization|cookie|key/i;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (sensitivePattern.test(key)) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeForLogging(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Normalizes email address to lower case and trimmed.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates password meets minimum security policy:
 * - 8 to 128 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 */
export function isStrongPassword(password: string): boolean {
  if (!password || password.length < 8 || password.length > 128) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasUpper && hasLower && hasDigit;
}
