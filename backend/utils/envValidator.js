/**
 * Validates critical environment variables.
 * Exits the process if any required variables are missing.
 */
export const validateEnv = () => {
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missingEnvVars = [];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missingEnvVars.push(envVar);
    }
  });

  if (missingEnvVars.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing essential environment variables!');
    console.error(`Please define the following variables in your .env file:\n   -> ${missingEnvVars.join('\n   -> ')}`);
    process.exit(1);
  }
};
