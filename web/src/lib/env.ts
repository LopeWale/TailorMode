import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default('https://app.posthog.com'),
  SENTRY_DSN: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  FEATURE_FLAG_MEASUREMENT_ASSISTANT: z
    .enum(['true', 'false'])
    .default('false'),
});

const parsed = envSchema.safeParse({
  DATABASE_URL:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/tailormode?schema=public',
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  POSTHOG_API_KEY:
    process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
  SENTRY_DSN: process.env.SENTRY_DSN,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  FEATURE_FLAG_MEASUREMENT_ASSISTANT:
    process.env.FEATURE_FLAG_MEASUREMENT_ASSISTANT,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
  );
}

export const env = {
  ...parsed.data,
  measurementAssistantEnabled:
    parsed.data.FEATURE_FLAG_MEASUREMENT_ASSISTANT === 'true',
  posthogServerKey: parsed.data.POSTHOG_API_KEY,
};
