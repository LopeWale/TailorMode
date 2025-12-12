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
- **NEW: Tailor Measurements Flow** (/measure page):
  - MeasurementSelector: Preset clothing picker OR AI-generated custom measurements
  - MeasurementCaptureFlow: Full orchestration of selection → instructions → capture → processing → results
  - Clothing presets: Shirt, Pants, Dress, Jacket, Skirt, Vest with required/optional measurements
  - AI measurement interpreter: Gemini interprets natural language garment descriptions
  - Geometry service: Geodesic distance, planar slice circumference, SMPL landmarks
  - Confidence scoring with re-capture triggers and auto-flag after 3 attempts

### API Endpoints
- `/api/reconstruct` - 3D reconstruction from captured frames, returns mesh + landmarks
- `/api/compute-measurements` - Computes measurements from mesh/landmarks with validation
- `/api/capture-instructions` - Generates capture guidance for selected measurements
- `/api/interpret-measurements` - AI-powered garment description to measurement mapping
- `/api/chat` - Gemini measurement assistant for tailor queries

### Backend Infrastructure Needed (for Production)
- **Real photogrammetry service**: COLMAP, Meshroom, or cloud API (Polycam, etc.)
- **SMPL fitting service**: Python with PyTorch for body model fitting
- **Mesh storage**: Regional S3/GCS with client-side encryption
- **Production measurement computation**: trimesh/Open3D/libigl for true geodesics

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
│   │   │   ├── chat/                    # Gemini measurement assistant
│   │   │   ├── reconstruct/             # 3D reconstruction with mesh/landmarks
│   │   │   ├── compute-measurements/    # Measurement computation with validation
│   │   │   ├── capture-instructions/    # Generates capture guidance
│   │   │   ├── interpret-measurements/  # AI garment → measurements mapping
│   │   │   └── auth/, login/, etc.
│   │   ├── measure/                     # Tailor measurement flow page
│   │   ├── viewer/                      # 3D mesh viewer page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                     # Main app with multi-angle capture flow
│   ├── components/
│   │   ├── MultiAngleCapture.tsx        # 4-angle guided capture with height picker
│   │   ├── MeasurementCaptureFlow.tsx   # Complete measurement flow orchestration
│   │   ├── MeasurementSelector.tsx      # Preset/custom measurement selection UI
│   │   ├── PhotoboothGlassBox.tsx       # Glass photobooth (home screen)
│   │   ├── MeshViewer.tsx               # Three.js 3D body model viewer
│   │   ├── MeasurementChat.tsx          # AI measurement assistant chat
│   │   └── MeasurementProgress.tsx
│   ├── hooks/
│   │   └── useCameraFeed.ts             # Camera stream management hook
│   └── lib/
│       ├── measurement-types.ts         # Clothing presets and measurement definitions
│       ├── geometry-service.ts          # Geodesic/circumference algorithms
│       ├── ai-measurement-interpreter.ts # Gemini garment interpretation
│       ├── measurement-service.ts       # Gemini NLP → Measurement DSL
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
- **Apple 2025 Liquid Glass Design** - Implemented authentic iOS 26 liquid glass styling
  - 60px blur with 200% saturation for true glass effect
  - Lower alpha (0.72/0.62) for better backdrop visibility
  - Inset specular highlights and subtle depth shadows
  - Pill-shaped buttons with rounded-full
- Fixed button width - buttons now auto-size to content (inline-flex)
- Fixed button height - consistent heights (h-14 primary, h-12 secondary)
- Applied liquid glass styling to ALL buttons across the app:
  - Home page (page.tsx)
  - MultiAngleCapture (Continue, Start Capture, Go Back)
  - MeasurementSelector (Preset/Custom selection, Analyze, Start Capture)
  - Viewer page (Export, Share buttons)
- Added liquid-glass, liquid-glass-primary, liquid-glass-secondary CSS utility classes


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
- Created Three.js MeshViewer component with 3D body model and GLTF loading
- Created MeasurementChat component with Gemini integration and response validation
- Added /viewer page with full tailor dashboard (mesh + measurements + chat)
- Fixed camera to use front-facing (selfie) mode with mirrored preview
- Improved height picker layout centering and spacing
- Added "View 3D Model" link on results screen to navigate to /viewer
- Fixed camera stream cleanup using ref to prevent memory leaks

### December 2024 - Tailor Measurement Flow
- Created clothing presets data model (measurement-types.ts) with 6 garment types
- Built AI measurement interpreter using Gemini to map natural language garment descriptions
- Created MeasurementSelector UI for preset selection or custom AI-generated measurements
- Implemented geometry-service.ts with geodesic distance, planar slice circumference algorithms
- Added confidence scoring, validation logic, and auto-flag after 3 recapture attempts
- Built MeasurementCaptureFlow component for complete measurement workflow orchestration
- Created /measure page with "Tailor Measurements" button on home screen
- Updated reconstruct API to generate mesh data and SMPL landmarks from captures
- Fixed critical data flow: captured imagery now flows through reconstruct -> compute-measurements pipeline
- Added capture-instructions API for view-specific guidance
- Added interpret-measurements API for AI garment-to-measurement mapping

### December 2024 - UI Polish
- Fixed home page button spacing - added margin between buttons and footer section
- Complete MeasurementSelector redesign with Apple 2025 Liquid Glass styling:
  - Glass-styled back button with proper visual hierarchy
  - Liquid glass cards for preset/custom selection options
  - Icon boxes with warm tan accent color
  - Navigation chevrons for visual guidance
  - Glass-styled textarea for custom garment input
  - Tips section with styled bullet points
  - Smooth Framer Motion animations throughout
  - Proper safe-area handling for mobile devices
