# TailorMode - 3D Body Measurement Platform

## Overview
TailorMode is a mobile-first web application for capturing body measurements using multi-angle camera capture and AI-powered 3D reconstruction. The web app serves as a companion/fallback to the native iOS app which uses LiDAR for higher accuracy.

## Architecture Understanding (from ARCHITECTURE.md)

### Gemini AI Role
Gemini is used ONLY as a **measurement assistant for tailors** - NOT for analyzing photos to extract measurements:
- Interprets natural language measurement requests ("take the hollow-to-hem")
- Maps requests to the Measurement DSL
- Calls the Measurement Service with structured definitions
- Returns conversational feedback and results

### RGB/Web Capture Flow
1. **Height calibration** - User enters height for scale reference
2. **Multi-angle guided capture** - Front, Left, Back, Right views (4 angles)
3. **Encrypted upload** - Frames sent to regional backend
4. **Server-side photogrammetry** - 3D mesh reconstruction
5. **SMPL/SMPL-X fitting** - Body model alignment
6. **Measurement computation** - Extract circumferences, lengths, distances from mesh

### LiDAR/iOS Flow (Native App)
- On-device TSDF fusion with ARKit
- Object Capture photogrammetry
- On-device SMPL fitting with Metal acceleration
- Direct measurement from 3D mesh

### Tailor Dashboard
- Three.js 3D mesh viewer (actual reconstructed mesh)
- Measurement overlays and landmark annotations
- AI measurement assistant chat panel
- Export and share capabilities

## Current Implementation Status

### Completed (Frontend)
- Multi-angle capture UI with 4-view guidance (MultiAngleCapture.tsx)
- Interactive scroll wheel height picker with cm/ft-in toggle
- Camera capture using WebRTC
- Gemini measurement assistant integration (measurement-service.ts)
- Updated chat API for NLP measurement requests
- Removed manual entry as primary flow
- Three.js 3D mesh viewer with orbit controls and landmarks (MeshViewer.tsx)
- Measurement assistant chat panel (MeasurementChat.tsx)
- 3D viewer page at /viewer with mesh visualization and chat

### Backend Infrastructure Needed
- **Photogrammetry service**: COLMAP, Meshroom, or cloud API (Polycam, etc.)
- **SMPL fitting service**: Python with PyTorch for body model fitting
- **Mesh storage**: Regional S3/GCS with client-side encryption
- **Measurement computation**: trimesh/Open3D/libigl for geodesics, circumferences

### UI/UX Status
- Home screen: PhotoboothGlassBox with camera reflections (glass material + ambient light)
- Capture flow: Height → Instructions → 4-angle capture → Processing
- Results: Measurement grid with scan summary and accuracy score

## Design System
- **Color Palette**: Monochrome earth-tones (browns, tans, warm neutrals)
  - Primary: #c4a77d (warm tan)
  - Secondary: #9c8f78 (muted brown)
  - Background: #1f1c18 / #0a0a0f (deep earth brown/charcoal)
  - Text: #e8e0d5 (warm off-white)
- **Icons**: SVG icons only (NO emojis anywhere)
- **Style**: Premium, professional, glassmorphism effects

## Project Structure
```
web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/              # Gemini measurement assistant
│   │   │   ├── reconstruct/       # 3D reconstruction endpoint (needs backend integration)
│   │   │   └── auth/, login/, etc.
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main app with multi-angle capture flow
│   ├── components/
│   │   ├── MultiAngleCapture.tsx  # 4-angle guided capture with interactive height picker
│   │   ├── PhotoboothGlassBox.tsx # Glass photobooth with camera reflections (home screen)
│   │   ├── MeshViewer.tsx         # Three.js 3D body model viewer with landmarks
│   │   ├── MeasurementChat.tsx    # AI measurement assistant chat panel
│   │   └── MeasurementProgress.tsx
│   ├── hooks/
│   │   └── useCameraFeed.ts       # Camera stream management hook
│   └── lib/
│       ├── measurement-service.ts # Gemini NLP → Measurement DSL
│       └── prisma.ts
├── prisma/
│   └── schema.prisma
└── public/
```

## Tech Stack
- **Frontend**: Next.js 16 with React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion
- **AI**: Gemini AI for measurement assistant (NLP only, NOT image analysis)
- **Auth**: Replit OAuth with PKCE
- **Database**: PostgreSQL with Prisma ORM

## Next Steps for Production
1. Integrate photogrammetry service (cloud API or self-hosted)
2. Deploy SMPL fitting microservice
3. Build Three.js 3D mesh viewer for dashboard
4. Implement secure mesh storage with regional compliance
5. Add QC checks during capture (coverage, blur, exposure)

## User Preferences
- Monochrome earth-tone design palette only
- SVG icons only, absolutely NO emojis
- Mobile-first design with premium feel
- No manual measurement entry as primary flow

## Recent Changes (December 2024)
- Restructured app based on architecture document requirements
- Gemini now used correctly as measurement assistant (not image analyzer)
- Added multi-angle capture flow with height calibration
- Created reconstruction API endpoint structure
- Removed manual entry as primary flow
- Updated home screen to "3D Body Scanning"
- Replaced HumanModel with PhotoboothGlassBox (glass photobooth with camera reflections)
- Added useCameraFeed hook for camera stream management
- Results screen now shows measurement grid with scan summary
- Added interactive scroll wheel height picker (like iOS picker wheel)
- Created Three.js MeshViewer component with 3D body model
- Created MeasurementChat component with Gemini integration
- Added /viewer page with full tailor dashboard (mesh + measurements + chat)
