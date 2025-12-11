"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html, Line, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Measurement {
  name: string;
  value: number;
  unit: string;
  confidence: number;
  landmark_start: string;
  landmark_end: string;
}

interface HumanModelProps {
  measurements: Measurement[];
  activeMeasurement: number | null;
  onMeasurementComplete?: (index: number) => void;
  isInteractive?: boolean;
}

const LANDMARK_POSITIONS: Record<string, [number, number, number]> = {
  "top of head": [0, 1.85, 0],
  "head": [0, 1.75, 0],
  "neck": [0, 1.5, 0],
  "left shoulder": [-0.22, 1.45, 0],
  "right shoulder": [0.22, 1.45, 0],
  "shoulder": [0, 1.45, 0],
  "chest": [0, 1.25, 0.08],
  "left chest": [-0.12, 1.25, 0.08],
  "right chest": [0.12, 1.25, 0.08],
  "waist": [0, 1.0, 0],
  "left waist": [-0.14, 1.0, 0],
  "right waist": [0.14, 1.0, 0],
  "hip": [0, 0.9, 0],
  "left hip": [-0.15, 0.9, 0],
  "right hip": [0.15, 0.9, 0],
  "crotch": [0, 0.82, 0],
  "left knee": [-0.1, 0.48, 0],
  "right knee": [0.1, 0.48, 0],
  "left ankle": [-0.08, 0.08, 0],
  "right ankle": [0.08, 0.08, 0],
  "floor": [0, 0, 0],
  "left wrist": [-0.45, 0.95, 0],
  "right wrist": [0.45, 0.95, 0],
  "left elbow": [-0.35, 1.15, 0],
  "right elbow": [0.35, 1.15, 0],
  "back": [0, 1.25, -0.1],
  "nape": [0, 1.48, -0.08],
};

function getLandmarkPosition(landmark: string): [number, number, number] {
  const key = landmark.toLowerCase();
  for (const [k, v] of Object.entries(LANDMARK_POSITIONS)) {
    if (key.includes(k) || k.includes(key)) {
      return v;
    }
  }
  return [0, 1, 0];
}

function HumanFigure({ 
  activeMeasurement, 
  measurements,
  onAnimationComplete
}: { 
  activeMeasurement: number | null; 
  measurements: Measurement[];
  onAnimationComplete?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(timeRef.current * 0.15) * 0.05;
    }
  });

  const mainMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#8b7355"),
    roughness: 0.7,
    metalness: 0.1,
  }), []);

  const highlightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#c4a77d"),
    roughness: 0.5,
    metalness: 0.2,
    emissive: new THREE.Color("#c4a77d"),
    emissiveIntensity: activeMeasurement !== null ? 0.15 : 0,
  }), [activeMeasurement]);

  return (
    <group ref={groupRef} position={[0, -0.9, 0]}>
      <mesh position={[0, 1.72, 0]} material={mainMaterial} castShadow>
        <sphereGeometry args={[0.12, 48, 48]} />
      </mesh>

      <mesh position={[0, 1.55, 0]} material={mainMaterial} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.1, 24]} />
      </mesh>

      <mesh position={[0, 1.28, 0]} material={highlightMaterial} castShadow>
        <capsuleGeometry args={[0.14, 0.3, 12, 24]} />
      </mesh>

      <mesh position={[0, 0.95, 0]} material={mainMaterial} castShadow>
        <capsuleGeometry args={[0.13, 0.18, 12, 24]} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={`arm-${side}`}>
          <mesh position={[side * 0.2, 1.45, 0]} material={mainMaterial} castShadow>
            <sphereGeometry args={[0.045, 24, 24]} />
          </mesh>
          <mesh position={[side * 0.28, 1.3, 0]} rotation={[0, 0, side * 0.2]} material={mainMaterial} castShadow>
            <capsuleGeometry args={[0.032, 0.2, 8, 24]} />
          </mesh>
          <mesh position={[side * 0.35, 1.12, 0]} rotation={[0, 0, side * 0.15]} material={mainMaterial} castShadow>
            <capsuleGeometry args={[0.028, 0.2, 8, 24]} />
          </mesh>
          <mesh position={[side * 0.42, 0.95, 0]} material={mainMaterial} castShadow>
            <sphereGeometry args={[0.025, 24, 24]} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`leg-${side}`}>
          <mesh position={[side * 0.08, 0.82, 0]} material={mainMaterial} castShadow>
            <sphereGeometry args={[0.05, 24, 24]} />
          </mesh>
          <mesh position={[side * 0.08, 0.58, 0]} material={mainMaterial} castShadow>
            <capsuleGeometry args={[0.055, 0.38, 8, 24]} />
          </mesh>
          <mesh position={[side * 0.08, 0.35, 0]} material={mainMaterial} castShadow>
            <sphereGeometry args={[0.04, 24, 24]} />
          </mesh>
          <mesh position={[side * 0.08, 0.18, 0]} material={mainMaterial} castShadow>
            <capsuleGeometry args={[0.04, 0.28, 8, 24]} />
          </mesh>
          <mesh position={[side * 0.08, 0.02, 0.02]} material={mainMaterial} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.1]} />
          </mesh>
        </group>
      ))}

      {activeMeasurement !== null && measurements[activeMeasurement] && (
        <MeasurementLine 
          measurement={measurements[activeMeasurement]} 
          onComplete={onAnimationComplete}
        />
      )}
    </group>
  );
}

function MeasurementLine({ 
  measurement,
  onComplete 
}: { 
  measurement: Measurement;
  onComplete?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    setProgress(0);
    hasCompletedRef.current = false;
  }, [measurement]);

  const startPos = getLandmarkPosition(measurement.landmark_start);
  const endPos = getLandmarkPosition(measurement.landmark_end);

  useFrame((_, delta) => {
    if (progress < 1) {
      setProgress((p) => Math.min(p + delta * 1.8, 1));
    } else if (!hasCompletedRef.current && onComplete) {
      hasCompletedRef.current = true;
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  });

  const currentEnd: [number, number, number] = [
    startPos[0] + (endPos[0] - startPos[0]) * progress,
    startPos[1] + (endPos[1] - startPos[1]) * progress,
    startPos[2] + (endPos[2] - startPos[2]) * progress,
  ];

  const midPoint: [number, number, number] = [
    (startPos[0] + currentEnd[0]) / 2,
    (startPos[1] + currentEnd[1]) / 2 + 0.15,
    (startPos[2] + currentEnd[2]) / 2 + 0.25,
  ];

  const linePoints: [number, number, number][] = [startPos, currentEnd];

  return (
    <group>
      <mesh position={startPos}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color="#c4a77d" />
      </mesh>

      <mesh position={currentEnd}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color="#c4a77d" />
      </mesh>

      <Line
        points={linePoints}
        color="#c4a77d"
        lineWidth={1.5}
      />

      {progress > 0.7 && (
        <Html position={midPoint} center>
          <div 
            className="surface-glass px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
            style={{ animation: 'fade-up 0.3s ease-out' }}
          >
            <span className="text-[#c4a77d] font-semibold">{measurement.value}</span>
            <span className="text-white/50 ml-1">{measurement.unit}</span>
            <span className="text-white/30 ml-2 text-[10px]">{measurement.name}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function GridFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.91, 0]} receiveShadow>
        <circleGeometry args={[2, 64]} />
        <meshStandardMaterial
          color="#1a1816"
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      <gridHelper 
        args={[4, 20, "#2a2520", "#1f1c18"]} 
        position={[0, -0.9, 0]} 
      />
    </group>
  );
}

function Scene({ 
  measurements, 
  activeMeasurement,
  onAnimationComplete,
  isInteractive = true
}: { 
  measurements: Measurement[]; 
  activeMeasurement: number | null;
  onAnimationComplete?: () => void;
  isInteractive?: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.4} color="#faf9f7" />
      <directionalLight 
        position={[3, 8, 4]} 
        intensity={0.6} 
        color="#faf9f7" 
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 3, -3]} intensity={0.2} color="#c4a77d" />
      <pointLight position={[2, 2, 4]} intensity={0.15} color="#d4c4a8" />

      <HumanFigure 
        activeMeasurement={activeMeasurement} 
        measurements={measurements} 
        onAnimationComplete={onAnimationComplete}
      />

      <GridFloor />

      <OrbitControls
        enablePan={false}
        enableZoom={isInteractive}
        minDistance={2}
        maxDistance={4.5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={isInteractive && activeMeasurement === null}
        autoRotateSpeed={0.2}
        enableDamping
        dampingFactor={0.05}
      />

      <fog attach="fog" args={['#0f0e0c', 4, 12]} />
    </>
  );
}

export default function HumanModel({ measurements, activeMeasurement, onMeasurementComplete, isInteractive = true }: HumanModelProps) {
  const handleAnimationComplete = useCallback(() => {
    if (activeMeasurement !== null && onMeasurementComplete) {
      onMeasurementComplete(activeMeasurement);
    }
  }, [activeMeasurement, onMeasurementComplete]);

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 0.2, 3], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <Scene 
          measurements={measurements} 
          activeMeasurement={activeMeasurement}
          onAnimationComplete={handleAnimationComplete}
          isInteractive={isInteractive}
        />
      </Canvas>
    </div>
  );
}
