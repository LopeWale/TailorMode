# TailorMode - 3D Body Measurement Platform

## Overview
TailorMode is a mobile-first web application that uses your phone's camera and AI to capture body measurements. It features a stunning 3D human model visualization built with Three.js that shows measurements being taken in real-time.

## Design System
- **Color Palette**: Monochrome earth-tones (browns, tans, warm neutrals)
  - Primary: #c4a77d (warm tan)
  - Secondary: #9c8f78 (muted brown)
  - Background: #1f1c18 / #0a0a0f (deep earth brown/charcoal)
  - Text: #e8e0d5 (warm off-white)
- **Icons**: SVG icons only (no emojis anywhere)
- **Style**: Premium, professional, glassmorphism effects

## Key Features
- **Camera Capture**: Uses phone camera via web APIs (getUserMedia) for body capture
- **AI Analysis**: Gemini AI analyzes captured images to extract body measurements
- **3D Visualization**: Three.js-powered 3D human body model shows measurements with animations
- **Mobile-First Design**: Beautiful UI optimized for mobile devices with glassmorphism effects
- **Progress Tracking**: Real-time measurement progress with animated visualization
- **Measurement History**: View past measurements with export and share capabilities
- **AI Assistant Chat**: Conversational interface for tailoring advice using Gemini
- **User Profiles**: Account management with connected tailors
- **Authentication**: Replit OAuth with PKCE, secure session management

## Tech Stack
- **Frontend**: Next.js 16 with React 19, TypeScript
- **3D Graphics**: Three.js with @react-three/fiber and @react-three/drei
- **Styling**: Tailwind CSS v4, Framer Motion for animations
- **AI**: Gemini AI via Replit AI Integrations (no API key needed)
- **Authentication**: Replit OAuth with openid-client library
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Replit Autoscale

## Project Structure
```
web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/          # Gemini AI analysis endpoint
│   │   │   ├── auth/user/        # Get current user endpoint
│   │   │   ├── callback/         # OAuth callback handler
│   │   │   ├── chat/             # AI chat endpoint
│   │   │   ├── login/            # OAuth login initiation
│   │   │   ├── logout/           # Session logout
│   │   │   └── measurements/     # Measurement data endpoint
│   │   ├── chat/                 # AI assistant chat page
│   │   ├── dashboard/            # Tailor dashboard page
│   │   ├── history/              # Measurement history page
│   │   ├── profile/              # User profile page
│   │   ├── globals.css           # Tailwind v4 styles with earth-tones
│   │   ├── layout.tsx            # Root layout with mobile viewport
│   │   └── page.tsx              # Main app with camera, 3D model, results
│   ├── components/
│   │   ├── CameraCapture.tsx     # Camera capture with countdown, pose guide
│   │   ├── HumanModel.tsx        # Three.js 3D human body model
│   │   ├── MeasurementProgress.tsx # Measurement list with progress
│   │   └── Navigation.tsx        # Bottom navigation component
│   ├── lib/
│   │   ├── auth.ts               # Replit OAuth authentication
│   │   ├── gemini.ts             # Gemini AI integration
│   │   └── prisma.ts             # Database client
│   └── types/
│       └── three.d.ts            # Three.js TypeScript types
├── prisma/
│   └── schema.prisma             # Database schema with User, Session models
└── public/
    └── manifest.json             # PWA manifest
```

## Running the App
The app runs on port 5000 with the Next.js development server.

## User Flow
1. **Home Screen**: User sees the 3D human model preview and "Begin Scan" button
2. **Camera Screen**: Phone camera opens with pose guide overlay and countdown
3. **Analysis Screen**: AI processes the captured image
4. **Results Screen**: 3D model displays with animated measurement lines and progress
5. **History**: View past measurements, export or share with tailors
6. **Chat**: Get AI-powered tailoring advice and recommendations
7. **Profile**: Manage account settings and connected tailors

## Authentication Flow
1. User clicks login button on profile/home page
2. Redirected to Replit OAuth with PKCE code challenge
3. After authorization, callback exchanges code for tokens
4. User upserted to database, session created with secure cookie
5. Session validated on each request, tokens refreshed as needed

## Environment Variables
- `AI_INTEGRATIONS_GEMINI_BASE_URL`: Set automatically by Replit AI Integrations
- `AI_INTEGRATIONS_GEMINI_API_KEY`: Set automatically by Replit AI Integrations
- `DATABASE_URL`: PostgreSQL connection string
- `REPL_ID`: Used as OAuth client ID (set by Replit)

## User Preferences
- Monochrome earth-tone design palette only (no blue/purple/pink)
- SVG icons only, absolutely NO emojis
- Mobile-first design with premium feel
- Glassmorphism effects for modern look

## Recent Changes
- December 2024: Initial implementation with camera capture, Gemini AI integration, Three.js 3D human model
- December 2024: Complete UI redesign with earth-tone color palette, removed all emojis
- December 2024: Added Replit OAuth authentication with session management
- December 2024: Implemented measurement history, AI chat, profile, and dashboard pages
- December 2024: Added bottom navigation component with Framer Motion animations
