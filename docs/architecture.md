# TailorMode 3D Body Scanning Platform Architecture

## Overview
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

