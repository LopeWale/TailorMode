# TailorMode Web Skeleton

This Next.js app is the walking skeleton for the TailorMode platform. It provides:

- A marketing-style home view that communicates the mobile capture, secure reconstruction, and tailor workflow pillars.
- A health check endpoint (`/api/healthz`) that probes database connectivity for uptime monitoring.
- A capture intake API (`POST /api/capture-sessions`) that validates device metadata and records LiDAR/RGB capture intents.
- Shared environment parsing and Prisma schema definitions aligned with the NDPA-compliant architecture.

## Prerequisites

- Node.js 20+
- Postgres database (Neon, Supabase, or local) reachable via `DATABASE_URL`.

## Setup

```bash
cp .env.example .env.local
# edit the connection string and telemetry keys for your environment
npm install
npm run prisma:generate # optional if you want the generated client ahead of runtime
```

## Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the TailorMode build cockpit.

### Capture intake API

```bash
curl -X POST http://localhost:3000/api/capture-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "organizationSlug": "atelier-x",
    "clientLabel": "Jane Doe",
    "captureMode": "LIDAR",
    "deviceProfile": {
      "deviceModel": "iPhone 15 Pro",
      "osVersion": "17.4",
      "lidarEnabled": true
    }
  }'
```

The endpoint validates the payload, ensures the organization exists, and returns the created capture session record. It also
emits PostHog analytics and Sentry error traces (when the respective keys are configured) so you can monitor intake reliability
before the reconstruction pipeline is online. Use this as the base for wiring upload URLs and reconstruction jobs in subsequent
iterations.

### Measurement job API

```bash
curl -X POST http://localhost:3000/api/measurement-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "organizationSlug": "atelier-x",
    "captureSessionId": "session_123",
    "kind": "MEASUREMENT_EXTRACTION",
    "parameters": {
      "measurementSet": "full-body",
      "landmarkPreset": "smpl-x"
    }
  }'
```

This queues a measurement job that downstream workers can use to drive SMPL fitting, measurement extraction, or quality audits.
The route enforces organization and capture session ownership checks before inserting queue records, and emits PostHog telemetry
for both successful and rejected requests so you can spot data issues before enabling tailors to trigger jobs from the dashboard.

## Quality checks

```bash
npm run lint
npm test
```

## Prisma schema overview

- `Organization`, `User`, and `Subscription` support regional tenancy and billing.
- `CaptureSession` and `MeasurementJob` map the LiDAR/RGB ingestion and geometry processing pipeline.
- `CaptureSession.captureMode` stores whether the intake originated from LiDAR depth fusion or RGB photogrammetry fallback.
- `FeatureFlag` enables dark launches (e.g., measurement assistant) before private beta rollout.

## Deployment

When you're ready to deploy, set the production secrets (`DATABASE_URL`, `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_API_KEY`, Stripe keys) and run the standard Next.js build pipeline:

```bash
npm run build
npm run start
```

The app can be hosted on Vercel, Fly.io, or any platform that supports Next.js App Router deployments with Node.js 20.
