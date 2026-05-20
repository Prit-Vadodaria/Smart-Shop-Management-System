import User from '../modules/auth/models/User.js';
import { logger } from './logger.js';

/**
 * Automatically creates a default admin account if no admin exists in the database.
 * Credentials are read from environment variables or fall back to secure defaults.
 */
export const bootstrapAdmin = async () => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      logger.info('Admin check: Default admin account already exists.');
      return;
    }

    const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'admin@123';
    const name = 'admin';

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      logger.warn(
        'Admin Bootstrap: Using default credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env for production.'
      );
    }

    // Create default admin user
    // The password will be automatically hashed by Mongoose schema pre-save hook
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true
    });

    logger.info(`🚀 Admin Bootstrap: Created default admin account successfully!`);
    logger.info(`   - Email: ${email}`);
    logger.info(`   - Role: admin`);
  } catch (error) {
    logger.error(`❌ Admin Bootstrap failed: ${error.message}`);
  }
};

export default bootstrapAdmin;
