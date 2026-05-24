import { AppError } from './errors.js';

/**
 * Password strength rules (shared policy for register, change, reset).
 */
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export function validatePassword(password) {
  const checks = {
    minLength: (password?.length ?? 0) >= PASSWORD_RULES.minLength,
    uppercase: /[A-Z]/.test(password || ''),
    lowercase: /[a-z]/.test(password || ''),
    number: /\d/.test(password || ''),
    special: SPECIAL_CHARS.test(password || ''),
  };

  const valid = Object.values(checks).every(Boolean);

  let message = 'Password meets all requirements';
  if (!checks.minLength) {
    message = `Password must be at least ${PASSWORD_RULES.minLength} characters`;
  } else if (!checks.uppercase) {
    message = 'Password must include at least one uppercase letter';
  } else if (!checks.lowercase) {
    message = 'Password must include at least one lowercase letter';
  } else if (!checks.number) {
    message = 'Password must include at least one number';
  } else if (!checks.special) {
    message = 'Password must include at least one special character';
  }

  return { valid, message, checks };
}

export function assertValidPassword(password) {
  const result = validatePassword(password);
  if (!result.valid) {
    throw new AppError(result.message, 400);
  }
  return result;
}
