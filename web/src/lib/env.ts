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
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  CAPTURE_UPLOAD_BUCKET: z
    .string()
    .min(1, 'CAPTURE_UPLOAD_BUCKET is required'),
  CAPTURE_UPLOAD_PREFIX: z.string().optional(),
  CAPTURE_UPLOAD_URL_TTL_SECONDS: z
    .coerce
    .number()
    .int()
    .min(60, 'CAPTURE_UPLOAD_URL_TTL_SECONDS must be at least 60 seconds')
    .max(86400, 'CAPTURE_UPLOAD_URL_TTL_SECONDS must be less than a day')
    .default(900),
  CAPTURE_UPLOAD_ENDPOINT: z.string().url().optional(),
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
  AWS_REGION: process.env.AWS_REGION ?? 'af-south-1',
  CAPTURE_UPLOAD_BUCKET: process.env.CAPTURE_UPLOAD_BUCKET ?? 'tailormode-captures-dev',
  CAPTURE_UPLOAD_PREFIX: process.env.CAPTURE_UPLOAD_PREFIX,
  CAPTURE_UPLOAD_URL_TTL_SECONDS: process.env.CAPTURE_UPLOAD_URL_TTL_SECONDS,
  CAPTURE_UPLOAD_ENDPOINT: process.env.CAPTURE_UPLOAD_ENDPOINT,
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
  awsRegion: parsed.data.AWS_REGION,
  captureUploadBucket: parsed.data.CAPTURE_UPLOAD_BUCKET,
  captureUploadPrefix: parsed.data.CAPTURE_UPLOAD_PREFIX
    ? parsed.data.CAPTURE_UPLOAD_PREFIX.replace(/^\/+/, '').replace(/\/+$/, '')
    : 'captures',
  captureUploadUrlTtlSeconds: parsed.data.CAPTURE_UPLOAD_URL_TTL_SECONDS,
  captureUploadEndpoint: parsed.data.CAPTURE_UPLOAD_ENDPOINT,
};
