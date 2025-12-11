import * as Sentry from "@sentry/nextjs";

import { env } from "./src/lib/env";

Sentry.init({
  dsn: env.SENTRY_DSN,
  enabled: Boolean(env.SENTRY_DSN),
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: 0.1,
});
