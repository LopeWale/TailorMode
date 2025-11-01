# TailorMode 3D Body Scanning Platform Architecture

## One-Page PRD

### Problem Statement
Remote tailoring currently depends on manual tape-measure walkthroughs that are error prone, uncomfortable for clients, and lead to costly remakes. TailorMode must replace this experience with a private, iPhone-first 3D capture flow that produces metrically accurate, repeatable measurements without exposing raw imagery to third parties.

### Primary Users & Stakeholders
- **Tailors and ateliers** who need precise body measurements, historical comparisons, and auditability.
- **End clients** who perform self-capture on iPhone or web/Android fallback flows and demand privacy guarantees.
- **Operations & compliance teams** responsible for NDPA-aligned processing, retention, and audit logging.
- **Product & support teams** who monitor capture quality, manage subscriptions, and troubleshoot scans.

### Core Use Scenarios
1. Tailor invites a client via secure capture link; the client completes guided scanning on a LiDAR-enabled iPhone and reviews QC feedback in real time.
2. Client with a non-LiDAR phone completes RGB capture using a printed scale marker; reconstruction occurs in a regional backend with encrypted uploads.
3. Tailor opens the web dashboard to inspect the 3D mesh, request custom circumferences using natural language, and export a measurement preset to a CAD workflow.
4. Support agent audits a measurement dispute by reviewing QC logs, measurement history, and subscription usage without accessing raw frames.

### Acceptance Criteria
- ≥ 90% of LiDAR captures pass automated QC on the first attempt with all raw frames deleted after reconstruction.
- Median circumference error ≤ 15 mm compared with in-person tape measurements under validated capture conditions.
- Tailor dashboard renders meshes, measurements, and AI assistant responses within 2 seconds at the 95th percentile.
- All uploads, mesh storage, and analytics respect regional residency (e.g., AWS Cape Town or GCP Johannesburg) and are covered by consent and audit logs.
- Subscription billing enforces seat limits, usage metering, and proration, with automated alerts on anomalies.

### Success Metrics
- ≥ 90% first-attempt capture pass rate on supported iPhones.
- ≥ 30% reduction in remake or alteration incidents for pilot tailors.
- < 3 minutes end-to-end latency (capture to usable mesh) on LiDAR iPhones.
- ≥ 95% of measurement assistant requests auto-resolved without manual intervention.
- Primary activation (“aha”) event: client completes a LiDAR capture with QC pass and mesh delivery in < 3 minutes.
- Early retention: ≥ 55% of tailors who invite a client in Week 0 repeat a capture session in Week 1; ≥ 35% do so by Week 4.
- Time-to-value: median time from tailor account creation to first successful measurement set ≤ 24 hours.
- Qualitative signal: ≥ 40% “very disappointed” on the Sean Ellis PMF survey and NPS ≥ +30 once 50+ responses collected.
- Quality bar: ≥ 99.5% crash-free capture sessions, < 0.5% reconstruction error rate, p95 tailor dashboard latency < 500 ms.

### Measurement & Analytics Plan
- Instrument events across capture and tailor flows: `sign_up`, `client_invite_sent`, `capture_started`, `qc_passed`, `mesh_ready`, `measurement_set_created`, `aha_reached`, `retention_weekN`.
- Attach properties for device capabilities, capture mode (LiDAR vs RGB), QC failure reasons, region, and subscription tier while stripping PII.
- PostHog dashboards track activation conversion, retention cohorts, and time-to-value; alerts trigger when quality bar thresholds are breached.
- Sean Ellis PMF and NPS surveys deployed after the first successful measurement set with anonymized response storage.

### Risks & Mitigations
- **Loose clothing and hair occlusions** → enforce attire guidance, include pose checks, and trigger targeted “fill gaps” capture loops.
- **Scale ambiguity on RGB-only captures** → require printed scale markers or verified height calibration with confidence indicators.
- **Landmark drift on difficult anatomy** → normalize to SMPL/SMPL-X A-pose, run statistical plausibility checks, and allow manual correction in the dashboard.
- **Network unreliability** → provide offline capture with resumable background uploads and automatic retries.

## Technical Overview
TailorMode enables tailors to receive metrically accurate body measurements from clients who capture their own scans on iPhone devices. The solution prioritizes on-device processing, privacy-preserving data flows, and extensible measurement tooling for tailors. Key pillars include:

- **iPhone-first capture** leveraging LiDAR, Object Capture, TrueDepth, and Apple Neural Engine hardware.
- **Privacy by design** through local reconstruction, ephemeral raw data handling, client consent, and de-identified storage.
- **Accuracy and repeatability** achieved with guided capture, automated quality control, SMPL-based landmarking, and robust measurement primitives.
- **Tailor-centric workflows** delivered via a secure web dashboard, measurement assistant, and subscription billing.

## Mobile Capture & On-Device Pipeline
1. **Device Capability Detection**
   - Query ARKit/Device APIs to enumerate LiDAR, TrueDepth, Neural Engine availability.
   - Configure capture presets accordingly (LiDAR depth fusion or RGB photogrammetry fallback).

2. **Guided Capture Flow**
   - SwiftUI-driven state machine orchestrates pose setup, 360° orbit prompts, and progress updates.
   - RealityKit overlays display stance footprints, distance ring (0.8–2.0 m), and live coverage heatmap using raycast density.
   - Voice, haptic, and on-screen cues enforce attire and pose compliance; non-compliance triggers targeted retake loops.

3. **Quality Control (On-Device)**
   - Core ML models running on the Neural Engine evaluate blur, exposure, motion, and coverage completeness per frame set.
   - TrueDepth (where available) validates facial fit data; fallback to RGB depth estimation heuristics otherwise.
   - Automatic retakes trigger when QC scores fall below thresholds; results logged for analytics (on-device until sync).

4. **Reconstruction Pipeline (On-Device Preferred)**
   - LiDAR devices: fuse depth + RGB into a metrically scaled TSDF via ARKit Scene Reconstruction, then mesh and simplify.
   - Object Capture photogrammetry runs on-device when the model supports macOS/iOS Object Capture APIs, producing a watertight mesh.
   - Fill gaps with neural surface completion (Core ML) while preserving metric scale.
   - Export final watertight glTF/GLB mesh in meters; apply mesh decimation and encryption prior to optional upload.

5. **SMPL/SMPL-X Fitting**
   - Run SMPL-based body model fitting using Metal-accelerated optimization.
   - If device compute limits are exceeded, encrypt the mesh and send to the secure geometry microservice for fitting.
   - Return anatomical landmarks (joints, circumferences, planes) to the device for preview and validation.

6. **Privacy Safeguards**
   - Raw frames and intermediate depth maps deleted immediately after successful reconstruction (unless explicit consent retained).
   - Meshes stored locally with client-managed keys; uploads only occur after consent.
   - Consent screens summarize data use, retention, and provide right-to-erase actions.

## Cloud & Backend Services
1. **API Gateway (FastAPI or Node.js)**
   - Provides authenticated endpoints via OAuth2/OIDC for tailors and capture clients.
   - Enforces per-tenant data residency routing (e.g., AWS Cape Town, GCP Johannesburg) through region-aware load balancers.

2. **Mesh & Measurement Storage**
   - De-identified mesh objects stored in regional object storage (S3/GCS) with client-side encryption keys.
   - Metadata & derived measurements stored in a PostgreSQL cluster (regional) with row-level security by tenant.
   - Signed URL access patterns limit exposure; raw imagery is never stored by default.

3. **Geometry Microservices**
   - **Landmarking Service**: Fits SMPL/SMPL-X, handles fallback landmark inference for non-LiDAR scans, and validates anatomical consistency.
   - **Measurement Service**: Uses trimesh/Open3D/libigl to compute point-to-point distances, geodesics, planar slice circumferences, and custom rules.
   - Services communicate over mTLS within a zero-trust VPC mesh (e.g., AWS PrivateLink / GCP VPC Service Controls).

4. **LLM Measurement Assistant**
   - Gemini function-calling layer interprets tailor natural language (“take the hollow-to-hem”) and maps it to the measurement DSL.
   - Contextual grounding includes tailor-specific presets, measurement history, and mesh metadata.
   - Responses return structured measurement definitions, executed via the Measurement Service, and conversational feedback for tailors.

5. **Subscription & Billing**
   - Usage metering (scans, measurement sets) tracked per tailor.
   - Integrate with Stripe Billing or Paddle for subscriptions, seat management, and invoicing.
   - Audit logs record access to meshes, measurements, and billing events for NDPA compliance.

6. **Analytics & Monitoring**
   - Capture QC outcomes aggregated (without raw images) for product analytics.
   - Reconstruction, measurement latency, and success metrics monitored via Prometheus/Grafana.
   - Alerting on SLA breaches ensures timely operational response.

## Cross-Platform Capture Fallbacks
- Non-LiDAR iOS/Android/Web clients capture RGB imagery/videos with guided instructions.
- Require scale calibration via printed ArUco/AprilTag or self-reported verified height + pose normalization.
- Upload encrypted image bundles to regional servers for photogrammetry/NeRF reconstruction.
- Server returns scaled mesh for SMPL fitting and measurement, following same privacy safeguards.

## Tailor Web Dashboard
- Built with React, TypeScript, and Three.js for 3D visualization.
- Features include mesh orbit controls, slicing planes, landmark snapping, and measurement annotation storage.
- Integrates the measurement assistant chat panel for conversational measurement requests and review.
- Supports exporting measurement presets, client reports, and secure share links.

## Data Privacy & Compliance
- NDPA-aligned data processing agreements and consent flows.
- Regional data segregation ensured by per-region databases, storage buckets, and compute clusters.
- Automated retention policies purge inactive meshes after configurable windows; right-to-erasure requests cascade deletes.
- Audit logging captures user actions (capture, view, download, measurement execution).

## Product Delivery Roadmap

### Timeline Overview (Based on Architecture Priorities)
The phased roadmap below translates the architecture requirements into a week-by-week plan that mirrors the provided program board. Each track references the enabling systems described above (on-device capture, reconstruction services, analytics, billing) so that discovery work, prototyping, and implementation land in the right order.

| Track | Week of Oct 9 | Week of Oct 16 | Week of Oct 23 | Week of Oct 30 | Week of Nov 6 | Week of Nov 13 | Week of Nov 20 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Release & Metrics** | Draft product hypothesis covering audience, JTBD, pains, and non-goals. | Finalize measurement plan with activation, retention, time-to-value, and qualitative instrumentation specs. | Baseline success metrics, consent checkpoints, and QC quality bars aligned with on-device pipeline and backend SLAs. | — | — | — | — |
| **Prototype & Validation** | — | Produce 3-screen Figma/Framer flow (capture coach, QC feedback, tailor dashboard handoff) and script moderated sessions. | Stand up concierge loop (Sheets/Airtable) to fake reconstruction + measurements; run initial pilot walkthroughs. | Conduct 5–10 user sessions, iterate copy/interactions twice, and lock MVP v0 slice. | — | — | — |
| **Walking Skeleton** | — | — | Bootstrap repo, CI (lint/type-check/test/build), environment secrets, and health endpoint scaffolding. | Implement Auth.js magic links, initial Postgres schema (users, captures, measurement jobs), `/healthz`, and Sentry/PostHog wiring. | Deploy the skeleton to dev/prod, verify analytics events (`sign_up`, `first_action`, `aha_reached`) and error reporting against instrumentation plan. | — | — |
| **MVP v0** | — | — | — | Kick off vertical slice design for LiDAR capture ingest → reconstruction queue → tailor review, mapping to architecture components. | Implement core flow: LiDAR capture upload API, encrypted mesh handling, reconstruction worker integration, measurement DSL stubs, Stripe test billing. | Wrap with unit/contract/Playwright smoke tests, latency dashboards, FAQ/success checklist, and feature-flagged release toggle. | — |
| **Private Beta** | — | — | — | — | — | Build onboarding checklist, empty-state coaching, and session replay (Highlight/OpenReplay); prep pilot-tailor comms. | Launch private beta to 3 pilot tailors, trigger PMF/NPS surveys after successful measurements, run daily triage + rapid fixes. |
| **Hardening & Safety** | — | — | — | — | — | — | Execute security pass (rate limiting, authz per resource), daily Postgres backups with restore drill, log-scrubbing/retention review, and runbook completion. |
| **Scale Prep** | — | — | — | — | — | — | Evaluate Redis caching for hot measurement queries, idempotency keys, cost-per-active-user review, and readiness for 10× load triggers. |

### Phase 0 — Problem & Metrics (2–3 days)
- Draft a one-page product hypothesis covering audiences, jobs-to-be-done, top pains, and non-goals.
- Ratify the metrics above; specify event schemas, retention windows, and dashboards.
- Outline the “walking skeleton” from sign-up → invite → successful capture → measurement review.
- Exit criteria: product hypothesis approved, measurement plan documented, and a list of 3–5 target tailors for interviews.

### Phase 1 — Prototype & User Checks (1–2 weeks)
- Produce a three-screen Figma/Framer mock that highlights the guided capture, QC feedback, and tailor dashboard handoff.
- Run concierge tests with Airtable/Sheets-backed measurement delivery; manually perform reconstructions if needed.
- Conduct 5–10 moderated sessions, iterate on copy/flows, and ensure ≥ 30–50% reach the mocked “aha” with minimal help.
- Exit criteria: validated desirability signals and a clear MVP v0 scope.

### Phase 2 — Walking Skeleton (1 week)
- Bootstrap repo + CI (lint, type-check, unit tests, build) and configure dev/prod environments with secrets management.
- Implement passwordless auth (magic links), Postgres migrations (users + core entities), and health endpoints.
- Integrate Sentry, structured logging, and PostHog events for `sign_up`, `first_action`, and `aha_reached`.
- Exit criteria: deployable slice where a user signs up, completes a trivial action, sees analytics, and errors are observable.

### Phase 3 — MVP v0 (2–3 weeks)
- Deliver the end-to-end capture-to-measurement flow with server-rendered pages and progressive enhancement.
- Add a background worker (Inngest/QStash) for email notifications, long-running reconstructions, and Stripe webhook handling.
- Cover the flow with unit, contract, and 3–5 Playwright smoke tests; stand up p95 latency dashboards.
- Exit criteria: real users finish the core flow unaided, rollbacks are safe, and on-call monitoring is actionable.

### Phase 4 — Private Beta (≈2 weeks, rolling)
- Layer in onboarding checklists, empty-state coaching, and session replay (Highlight/OpenReplay) for qualitative debugging.
- Run PMF + NPS surveys post-success, iterate quickly via feature flags, and maintain a 24-hour fix SLA for defects.
- Target stable D7 retention within goal range and < 1% error rate while capturing beta feedback for roadmap triage.

### Phase 5 — Hardening & Safety (≈1 week)
- Add rate limiting, input validation, and resource-scoped authorization checks.
- Automate daily Postgres backups and rehearse a full restore locally in < 30 minutes; document runbooks (restore, rotate keys, rollback).
- Tag PII, scrub logs, and enforce data retention policies aligned with NDPA.
- Exit criteria: tested restores, secret rotation confidence, and acceptable p95 latency.

### Phase 6 — Sensible Scale (triggered by demand)
- Introduce Redis caching for hot reads, idempotency keys, and rate limits; adopt durable job queues with retries.
- Evaluate Postgres read replicas or serverless options (e.g., Neon) and add CDN coverage via Cloudflare.
- Track cost per active user to ensure 10× traffic headroom without runaway spend.
- Exit criteria: the platform absorbs 10× current load while keeping performance and costs within targets.

## Recommended Stack & Architecture Pattern
- **Monolith-first philosophy**: Next.js (App Router) with server actions for SSR UI + API routes; Prisma or Drizzle for Postgres migrations.
- **Auth & identity**: Auth.js with email magic links (Resend) and tenant-aware session handling; enforce row-level security per tailor.
- **Background work**: Inngest or QStash worker for reconstruction orchestration, emails, and billing webhooks.
- **Observability**: Sentry for errors, PostHog for product analytics, structured JSON logs, and `/healthz` uptime checks.
- **Storage & infra**: Neon Postgres or Supabase for managed Postgres, Cloudflare R2 or regional S3 for meshes, Upstash Redis for caching.
- **Testing**: Vitest for units, contract tests for API schemas, Playwright for the 3–5 golden paths.
- **UI toolkit**: shadcn/ui over Radix primitives for rapid, accessible UI assembly; Three.js for mesh rendering in the dashboard.

### Minimal Architecture (Next.js + Prisma sketch)
- `/app` for server components, capture links, and tailor dashboard routes.
- `/src/server` housing tRPC routers or REST controllers with validation schemas.
- `/src/db` for Prisma schema, migrations, and typed data access helpers.
- `/src/jobs` for Inngest/QStash handlers managing asynchronous work (emails, reconstruction triggers).
- `/src/lib` centralizing auth, analytics client, feature flag helpers, and measurement DSL bindings.
- `/src/ui` for shared components and design tokens; `/tests` for unit + Playwright suites.

## Backlog Seeds & Operational Guardrails
- Phase 0: “Product one-pager” and “Measurement plan” issues to codify hypotheses and analytics definitions.
- Phase 2: Issues for repo bootstrap, environment secrets, health endpoint, Auth.js integration, Postgres schema, and observability wiring.
- Phase 3: Vertical slice tasks—core flow page, API validation, DB writes with idempotency, background job with retries, E2E test, latency dashboard.
- Phase 4+: Onboarding checklist, session replay installation, PMF/NPS survey triggers, daily triage ritual.
- Operational triggers: scale caching when p95 latency > 600 ms, move long jobs to durable workflows when > 60 s, evaluate read replicas when read/write ratio > 10×, revisit architecture when modules decouple naturally, and optimize spend before introducing new infrastructure.

## Layered Architecture Diagram
```mermaid
graph TD
  subgraph Client Layer
    A[iOS Capture App\nSwiftUI + ARKit/RealityKit]
    B[Web/Android Capture Fallback]
  end

  subgraph AI Inference Layer
    C[On-Device QC Models\n(Core ML + Neural Engine)]
    D[On-Device SMPL Fit]
  end

  subgraph 3D Reconstruction Pipeline
    E[On-Device LiDAR Fusion]
    F[Object Capture Photogrammetry]
    G[Server Photogrammetry/NeRF]
  end

  subgraph Data API Layer
    H[Secure API Gateway\n(FastAPI/Node)]
    I[Mesh Storage (S3/GCS Regional)]
    J[Measurement DB (Postgres RLS)]
    K[Audit Log Stream]
  end

  subgraph LLM Measurement Service
    L[Gemini Function Calling Layer]
    M[Measurement DSL + Geometry Service\n(trimesh/Open3D/libigl)]
  end

  subgraph Web Viewer Layer
    N[React + Three.js Tailor Dashboard]
    O[Measurement Assistant UI]
  end

  subgraph Billing & Subscription Layer
    P[Subscription Service\n(Stripe/Paddle)]
    Q[Usage Metering & Analytics]
  end

  A -->|Depth Frames, RGB, QC Scores| C
  C -->|Pass/Fail + Retake| A
  A -->|Watertight Mesh + Landmarks (local)| D
  A -->|Encrypted Mesh (if needed)| H
  D -->|Landmarks & Pose| A
  A -->|Reconstruction Requests| E
  A -->|Photogrammetry Jobs| F
  B -->|RGB Capture + Scale| H
  F -->|Meshes| A
  E -->|Watertight Mesh| A
  A -->|Encrypted Upload| H

  H -->|Store Mesh| I
  H -->|Store Measurements| J
  H -->|Log Events| K
  H -->|Invoke Landmark/Measurement| M
  M -->|LLM Prompt| L
  L -->|Function Calls| M
  M -->|Results| H
  H -->|Measurements & Mesh| N
  N -->|Measurement Queries| O
  O -->|Natural Language| L
  H -->|Usage Events| Q
  Q -->|Billing Data| P
  P -->|Subscription Status| H

  G -->|Scaled Mesh| H
  H -->|Fallback Reconstruction Requests| G
```

## Security Considerations
- All communication secured with TLS 1.3; device-to-cloud uploads use client-side encryption (per-session keys stored in Secure Enclave).
- mTLS between microservices; secrets managed via HashiCorp Vault or AWS/GCP Secret Manager.
- Continuous compliance checks (Cloud Custodian / AWS Config) enforce residency and retention policies.

## Future Extensions
- Automated attire detection and guidance improvements via additional on-device models.
- Tailor-specific measurement templates powered by reinforcement learning from historical adjustments.
- Integration with CAD pattern systems (beyond MVP) and automated garment fit simulation.

