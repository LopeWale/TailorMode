# TailorMode Build Cockpit

## Overview
A privacy-first platform that turns LiDAR scans into metrically accurate measurement sets. This is a Next.js 16 web application with Prisma ORM and PostgreSQL database.

## Project Architecture
```
web/
├── prisma/           # Database schema
├── public/           # Static assets
├── src/
│   ├── app/          # Next.js App Router pages and API routes
│   │   ├── api/      # API endpoints (capture-sessions, healthz)
│   │   ├── page.tsx  # Main landing page
│   │   └── layout.tsx
│   └── lib/          # Shared utilities (prisma, storage, observability)
├── package.json
└── next.config.ts
```

## Key Technologies
- Next.js 16 with App Router and Turbopack
- Prisma ORM with PostgreSQL
- React 19
- TypeScript
- Vitest for testing
- Sentry for error tracking
- PostHog for analytics
- AWS S3 for storage

## Development
The development server runs on port 5000:
```bash
cd web && npm run dev -- -p 5000 -H 0.0.0.0
```

## Database
Using Replit's built-in PostgreSQL database. Prisma schema defines:
- Organization (multi-tenant)
- User (with roles: OWNER, ADMIN, TAILOR, SUPPORT)
- CaptureSession (LiDAR/RGB capture workflows)
- MeasurementJob (processing jobs)
- Subscription (billing)
- FeatureFlag (feature toggles)

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run prisma:generate` - Generate Prisma client

## Recent Changes
- 2025-12-11: Initial Replit setup, configured Next.js for Replit proxy, synced Prisma schema with database
