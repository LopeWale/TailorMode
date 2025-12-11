# TailorMode - 3D Body Measurement Platform

## Overview
TailorMode is a mobile-first web application that uses your phone's camera and AI to capture body measurements. It features a stunning 3D human model visualization built with Three.js that shows measurements being taken in real-time.

## Key Features
- **Camera Capture**: Uses phone camera via web APIs (getUserMedia) for body capture
- **AI Analysis**: Gemini AI analyzes captured images to extract body measurements
- **3D Visualization**: Three.js-powered 3D human body model shows measurements with animations
- **Mobile-First Design**: Beautiful UI optimized for mobile devices with glassmorphism effects
- **Progress Tracking**: Real-time measurement progress with animated visualization

## Tech Stack
- **Frontend**: Next.js 16 with React 19, TypeScript
- **3D Graphics**: Three.js with @react-three/fiber and @react-three/drei
- **Styling**: Tailwind CSS v4, Framer Motion for animations
- **AI**: Gemini AI via Replit AI Integrations (no API key needed)
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Replit Autoscale

## Project Structure
```
web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/          # Gemini AI analysis endpoint
│   │   ├── globals.css           # Tailwind v4 styles
│   │   ├── layout.tsx            # Root layout with mobile viewport
│   │   └── page.tsx              # Main app with camera, 3D model, results
│   ├── components/
│   │   ├── CameraCapture.tsx     # Camera capture with countdown, pose guide
│   │   ├── HumanModel.tsx        # Three.js 3D human body model
│   │   └── MeasurementProgress.tsx # Measurement list with progress
│   ├── lib/
│   │   ├── gemini.ts             # Gemini AI integration
│   │   └── prisma.ts             # Database client
│   └── types/
│       └── three.d.ts            # Three.js TypeScript types
├── prisma/
│   └── schema.prisma             # Database schema
└── public/
    └── manifest.json             # PWA manifest
```

## Running the App
The app runs on port 5000 with the Next.js development server.

## User Flow
1. **Home Screen**: User sees the 3D human model preview and "Start Capture" button
2. **Camera Screen**: Phone camera opens with pose guide overlay and countdown
3. **Analysis Screen**: AI processes the captured image
4. **Results Screen**: 3D model displays with animated measurement lines and progress

## Environment Variables
- `AI_INTEGRATIONS_GEMINI_BASE_URL`: Set automatically by Replit AI Integrations
- `AI_INTEGRATIONS_GEMINI_API_KEY`: Set automatically by Replit AI Integrations
- `DATABASE_URL`: PostgreSQL connection string

## User Preferences
- Mobile-first design with beautiful animations
- Uses Gemini AI for measurement analysis
- Three.js for 3D body model visualization
- Camera-based body capture for measurements

## Recent Changes
- December 2024: Initial implementation with camera capture, Gemini AI integration, Three.js 3D human model, and animated measurement visualization
