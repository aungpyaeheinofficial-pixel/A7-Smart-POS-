import { z } from 'zod';

/**
 * Environment variable schema
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(9000),
  CORS_ORIGIN: z.string().url().or(z.literal('*')).default('*'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ADMIN_PASSWORD: z.string().min(8).optional().default('password'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env | null = null;

/**
 * Get validated environment variables
 * Throws descriptive error if validation fails
 */
export function getEnv(): Env {
  if (env) {
    return env;
  }

  try {
    env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw new Error(`Environment validation failed: ${missing}`);
    }
    throw error;
  }
}

