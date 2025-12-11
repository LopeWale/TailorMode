# TailorMode Web Skeleton

This Next.js app is the walking skeleton for the TailorMode platform. It provides:

- A marketing-style home view that communicates the mobile capture, secure reconstruction, and tailor workflow pillars.
- A health check endpoint (`/api/healthz`) that probes database connectivity for uptime monitoring.
- A capture intake API (`POST /api/capture-sessions`) that validates device metadata, records LiDAR/RGB capture intents, and
  issues signed object storage upload URLs.
- Shared environment parsing and Prisma schema definitions aligned with the NDPA-compliant architecture.

## Prerequisites

- Node.js 20+
- Postgres database (Neon, Supabase, or local) reachable via `DATABASE_URL`.

## Setup

```bash
cp .env.example .env.local
# edit the connection string, telemetry keys, and capture upload configuration for your environment
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
    "payloadContentType": "application/zip",
    "deviceProfile": {
      "deviceModel": "iPhone 15 Pro",
      "osVersion": "17.4",
      "lidarEnabled": true
    }
  }'
```

Example response:

```json
{
  "session": {
    "id": "session_123",
    "organizationId": "org_123",
    "clientLabel": "Jane Doe",
    "captureMode": "LIDAR",
    "uploadObjectKey": "captures/atelier-x/session_123/uuid",
    "uploadUrlExpiresAt": "2024-01-01T00:10:00.000Z",
    "uploadContentType": "application/zip",
    "status": "CREATED",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "uploadTarget": {
    "bucket": "tailormode-captures-dev",
    "key": "captures/atelier-x/session_123/uuid",
    "url": "https://s3.af-south-1.amazonaws.com/...",
    "expiresAt": "2024-01-01T00:10:00.000Z",
    "method": "PUT",
    "headers": {
      "Content-Type": "application/zip"
    }
  }
}
```

The endpoint validates the payload, ensures the organization exists, and returns both the created capture session record and a
signed upload target so the mobile app can stream LiDAR payloads directly to regional object storage. It also emits PostHog
analytics and Sentry error traces (when the respective keys are configured) so you can monitor intake reliability before the
reconstruction pipeline is online.

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
