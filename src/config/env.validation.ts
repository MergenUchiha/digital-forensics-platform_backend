import { z } from 'zod';

/**
 * Every environment variable the application reads, in one place.
 *
 * `JWT_SECRET` has no fallback: a default written into the source is a
 * published secret. The SIEM key has no fallback either — see the note on
 * `SIEM_API_KEY` below.
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z
    .string()
    .min(
      32,
      'JWT_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48',
    ),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:5173'),

  SWAGGER_ENABLED: z.enum(['true', 'false']).optional(),

  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(10_000).default(100),

  /**
   * Forwarding request logs to a SIEM is optional. Both values must be present
   * for it to run, and the `/api/logs` endpoints are only mounted when they
   * are: the previous check was `if (validKey && apiKey !== validKey)`, which
   * meant an unset key disabled the check rather than the endpoint.
   */
  SIEM_URL: z.string().url().or(z.literal('')).default(''),
  SIEM_API_KEY: z.string().default(''),
});

export type Env = Omit<z.infer<typeof EnvSchema>, 'SWAGGER_ENABLED'> & {
  SWAGGER_ENABLED: boolean;
  SIEM_ENABLED: boolean;
};

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.errors
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration:\n${details}\n\nSee .env.example for the full list.`,
    );
  }

  const env = parsed.data;
  const siemEnabled = Boolean(env.SIEM_URL) && env.SIEM_API_KEY.length >= 16;

  if (env.SIEM_API_KEY && env.SIEM_API_KEY.length < 16) {
    throw new Error(
      'SIEM_API_KEY must be at least 16 characters when set. It is the only thing guarding the log endpoints.',
    );
  }

  return {
    ...env,
    SWAGGER_ENABLED:
      env.SWAGGER_ENABLED === undefined
        ? env.NODE_ENV !== 'production'
        : env.SWAGGER_ENABLED === 'true',
    SIEM_ENABLED: siemEnabled,
  };
}
