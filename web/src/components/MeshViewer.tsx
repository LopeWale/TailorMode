"use client";

import { useRef, useState, Suspense, useEffect, Component, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

class MeshErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Mesh loading failed:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface Landmark {
  id: string;
  name: string;
  position: [number, number, number];
  type: "joint" | "circumference" | "point";
}

interface MeshViewerProps {
  meshUrl?: string;
  landmarks?: Landmark[];
  onLandmarkClick?: (landmark: Landmark) => void;
  activeMeasurement?: { start: string; end: string } | null;
  className?: string;
}

function LoadedMesh({ 
  url,
  landmarks = [], 
  onLandmarkClick,
  activeMeasurement,
}: { 
  url: string;
  landmarks: Landmark[];
  onLandmarkClick?: (landmark: Landmark) => void;
  activeMeasurement?: { start: string; end: string } | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#c4a77d"),
            roughness: 0.7,
            metalness: 0.1,
          });
        }
      });
    }
  }, [scene]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1} position={[0, 0, 0]} />
      
      {landmarks.map((landmark) => {
        const isActive = activeMeasurement && 
          (activeMeasurement.start === landmark.id || activeMeasurement.end === landmark.id);
        
        return (
          <group key={landmark.id} position={landmark.position}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onLandmarkClick?.(landmark);
              }}
            >
              <sphereGeometry args={[isActive ? 0.025 : 0.02, 16, 16]} />
              <meshStandardMaterial 
                color={isActive ? "#c4a77d" : "#78716c"} 
                emissive={isActive ? "#c4a77d" : "#000000"}
                emissiveIntensity={isActive ? 0.5 : 0}
              />
            </mesh>
            {isActive && (
              <Html distanceFactor={3} center>
                <div className="bg-[#1f1c18]/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-[#faf9f7] whitespace-nowrap border border-[#c4a77d]/30">
                  {landmark.name}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function PlaceholderBody({ 
  landmarks = [], 
  onLandmarkClick,
  activeMeasurement,
}: { 
  landmarks: Landmark[];
  onLandmarkClick?: (landmark: Landmark) => void;
  activeMeasurement?: { start: string; end: string } | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  const bodyColor = new THREE.Color("#c4a77d");

  return (
    <group ref={groupRef}>
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[0, 1.25, 0]}>
        <capsuleGeometry args={[0.08, 0.2, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0.95, 0]}>
        <capsuleGeometry args={[0.18, 0.4, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.14, 0.2, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[-0.25, 1.1, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.045, 0.25, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0.25, 1.1, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.045, 0.25, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[-0.35, 0.85, 0]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.035, 0.25, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0.35, 0.85, 0]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.035, 0.25, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[-0.08, 0.22, 0]}>
        <capsuleGeometry args={[0.07, 0.35, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0.08, 0.22, 0]}>
        <capsuleGeometry args={[0.07, 0.35, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[-0.08, -0.15, 0]}>
        <capsuleGeometry args={[0.055, 0.35, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0.08, -0.15, 0]}>
        <capsuleGeometry args={[0.055, 0.35, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {landmarks.map((landmark) => {
        const isActive = activeMeasurement && 
          (activeMeasurement.start === landmark.id || activeMeasurement.end === landmark.id);
        
        return (
          <group key={landmark.id} position={landmark.position}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onLandmarkClick?.(landmark);
              }}
            >
              <sphereGeometry args={[isActive ? 0.025 : 0.02, 16, 16]} />
              <meshStandardMaterial 
                color={isActive ? "#c4a77d" : "#78716c"} 
                emissive={isActive ? "#c4a77d" : "#000000"}
                emissiveIntensity={isActive ? 0.5 : 0}
              />
            </mesh>
            {isActive && (
              <Html distanceFactor={3} center>
                <div className="bg-[#1f1c18]/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-[#faf9f7] whitespace-nowrap border border-[#c4a77d]/30">
                  {landmark.name}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function MeshWithFallback({
  meshUrl,
  landmarks,
  onLandmarkClick,
  activeMeasurement,
}: {
  meshUrl?: string;
  landmarks: Landmark[];
  onLandmarkClick?: (landmark: Landmark) => void;
  activeMeasurement?: { start: string; end: string } | null;
}) {
  const placeholderFallback = (
    <PlaceholderBody
      landmarks={landmarks}
      onLandmarkClick={onLandmarkClick}
      activeMeasurement={activeMeasurement}
    />
  );

  if (!meshUrl) {
    return placeholderFallback;
  }

  return (
    <MeshErrorBoundary key={meshUrl} fallback={placeholderFallback}>
      <Suspense fallback={<LoadingIndicator />}>
        <LoadedMesh
          url={meshUrl}
          landmarks={landmarks}
          onLandmarkClick={onLandmarkClick}
          activeMeasurement={activeMeasurement}
        />
      </Suspense>
    </MeshErrorBoundary>
  );
}

function LoadingIndicator() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-[#c4a77d]/30 border-t-[#c4a77d] rounded-full animate-spin" />
        <span className="text-[#78716c] text-xs">Loading mesh...</span>
      </div>
    </Html>
  );
}

const DEFAULT_LANDMARKS: Landmark[] = [
  { id: "head_top", name: "Head Top", position: [0, 1.72, 0], type: "point" },
  { id: "shoulder_left", name: "Left Shoulder", position: [-0.22, 1.25, 0], type: "joint" },
  { id: "shoulder_right", name: "Right Shoulder", position: [0.22, 1.25, 0], type: "joint" },
  { id: "chest", name: "Chest", position: [0, 1.1, 0.1], type: "circumference" },
  { id: "waist", name: "Waist", position: [0, 0.85, 0.08], type: "circumference" },
  { id: "hip", name: "Hip", position: [0, 0.6, 0.06], type: "circumference" },
  { id: "knee_left", name: "Left Knee", position: [-0.08, 0.05, 0.02], type: "joint" },
  { id: "knee_right", name: "Right Knee", position: [0.08, 0.05, 0.02], type: "joint" },
  { id: "ankle_left", name: "Left Ankle", position: [-0.08, -0.32, 0], type: "joint" },
  { id: "ankle_right", name: "Right Ankle", position: [0.08, -0.32, 0], type: "joint" },
];

export default function MeshViewer({
  meshUrl,
  landmarks = DEFAULT_LANDMARKS,
  onLandmarkClick,
  activeMeasurement,
  className,
}: MeshViewerProps) {
  const [viewMode, setViewMode] = useState<"3d" | "front" | "side" | "back">("3d");
  const [showLandmarks, setShowLandmarks] = useState(true);
  
  const cameraPositions = {
    "3d": [2, 1, 2] as [number, number, number],
    "front": [0, 0.8, 2.5] as [number, number, number],
    "side": [2.5, 0.8, 0] as [number, number, number],
    "back": [0, 0.8, -2.5] as [number, number, number],
  };

  return (
    <div className={`relative bg-[#0a0908] rounded-2xl overflow-hidden ${className || ""}`}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        shadows
      >
        <PerspectiveCamera 
          makeDefault 
          position={cameraPositions[viewMode]} 
          fov={45}
        />
        
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />
        
        <Suspense fallback={<LoadingIndicator />}>
          <MeshWithFallback
            meshUrl={meshUrl}
            landmarks={showLandmarks ? landmarks : []}
            onLandmarkClick={onLandmarkClick}
            activeMeasurement={activeMeasurement}
          />
          <ContactShadows
            position={[0, -0.35, 0]}
            opacity={0.4}
            scale={3}
            blur={2}
            far={4}
          />
          <Environment preset="studio" />
        </Suspense>
        
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />
      </Canvas>

      <div className="absolute top-4 left-4 flex gap-2">
        {(["3d", "front", "side", "back"] as const).map((mode) => (
          <motion.button
            key={mode}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === mode
                ? "bg-[#c4a77d] text-[#1f1c18]"
                : "bg-[#1f1c18]/80 text-[#78716c] hover:text-[#a8a29e]"
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </motion.button>
        ))}
      </div>

      <div className="absolute top-4 right-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLandmarks(!showLandmarks)}
          className={`p-2 rounded-lg transition-all ${
            showLandmarks
              ? "bg-[#c4a77d] text-[#1f1c18]"
              : "bg-[#1f1c18]/80 text-[#78716c]"
          }`}
          title={showLandmarks ? "Hide landmarks" : "Show landmarks"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </motion.button>
      </div>

      {!meshUrl && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <div className="bg-[#1f1c18]/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#c4a77d]/30">
            <span className="text-[#c4a77d] text-xs">Demo Model</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center justify-center gap-2">
          <div className="bg-[#1f1c18]/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#78716c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
            </svg>
            <span className="text-[#78716c] text-[10px]">Drag to rotate</span>
          </div>
          <div className="bg-[#1f1c18]/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#78716c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <span className="text-[#78716c] text-[10px]">Pinch to zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
