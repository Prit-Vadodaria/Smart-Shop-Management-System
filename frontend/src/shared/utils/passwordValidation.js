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
    message = `At least ${PASSWORD_RULES.minLength} characters`;
  } else if (!checks.uppercase) {
    message = 'Include an uppercase letter';
  } else if (!checks.lowercase) {
    message = 'Include a lowercase letter';
  } else if (!checks.number) {
    message = 'Include a number';
  } else if (!checks.special) {
    message = 'Include a special character';
  }

  return { valid, message, checks };
}

export const PASSWORD_HINTS = [
  `At least ${PASSWORD_RULES.minLength} characters`,
  'One uppercase letter (A–Z)',
  'One lowercase letter (a–z)',
  'One number (0–9)',
  'One special character (!@#$…)',
];
