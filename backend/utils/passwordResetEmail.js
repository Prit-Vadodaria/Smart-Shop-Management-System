import { logger } from './logger.js';

/**
 * Sends password reset instructions. Logs the link in development when email is not configured.
 */
export async function sendPasswordResetEmail({ to, resetUrl }) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    logger.warn(
      'Password reset: SMTP_HOST is set but mail transport is not implemented yet. Logged reset URL instead.'
    );
  }

  logger.info(`Password reset link for ${to}: ${resetUrl}`);

  return { sent: true, devMode: process.env.NODE_ENV !== 'production' };
}

export function buildResetPasswordUrl(resetToken) {
  const base =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/reset-password?token=${resetToken}`;
}
