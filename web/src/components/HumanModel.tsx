"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, Environment, Float, Html, Line } from "@react-three/drei";
import * as THREE from "three";

extend(THREE);

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
}

const LANDMARK_POSITIONS: Record<string, [number, number, number]> = {
  "top of head": [0, 2.1, 0],
  "head": [0, 2.0, 0],
  "neck": [0, 1.7, 0],
  "left shoulder": [-0.45, 1.55, 0],
  "right shoulder": [0.45, 1.55, 0],
  "shoulder": [0, 1.55, 0],
  "chest": [0, 1.35, 0.1],
  "left chest": [-0.2, 1.35, 0.1],
  "right chest": [0.2, 1.35, 0.1],
  "waist": [0, 1.1, 0],
  "left waist": [-0.18, 1.1, 0],
  "right waist": [0.18, 1.1, 0],
  "hip": [0, 0.95, 0],
  "left hip": [-0.22, 0.95, 0],
  "right hip": [0.22, 0.95, 0],
  "crotch": [0, 0.85, 0],
  "left knee": [-0.15, 0.5, 0],
  "right knee": [0.15, 0.5, 0],
  "left ankle": [-0.12, 0.08, 0],
  "right ankle": [0.12, 0.08, 0],
  "floor": [0, 0, 0],
  "left wrist": [-0.7, 1.1, 0],
  "right wrist": [0.7, 1.1, 0],
  "left elbow": [-0.55, 1.3, 0],
  "right elbow": [0.55, 1.3, 0],
  "back": [0, 1.35, -0.12],
  "nape": [0, 1.65, -0.1],
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

function HumanBody({ activeMeasurement, measurements }: { activeMeasurement: number | null; measurements: Measurement[] }) {
  const bodyRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const bodyColor = useMemo(() => new THREE.Color("#4a9eff"), []);
  const glowColor = useMemo(() => new THREE.Color("#00d4ff"), []);

  return (
    <group ref={bodyRef}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
        <group>
          <mesh position={[0, 1.95, 0]} castShadow>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshStandardMaterial
              color={bodyColor}
              roughness={0.3}
              metalness={0.7}
              emissive={glowColor}
              emissiveIntensity={0.1}
            />
          </mesh>

          <mesh position={[0, 1.7, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 0.15, 16]} />
            <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
          </mesh>

          <mesh position={[0, 1.35, 0]} castShadow>
            <capsuleGeometry args={[0.22, 0.5, 8, 16]} />
            <meshStandardMaterial
              color={bodyColor}
              roughness={0.3}
              metalness={0.7}
              emissive={glowColor}
              emissiveIntensity={activeMeasurement !== null ? 0.2 : 0.05}
            />
          </mesh>

          <mesh position={[0, 0.95, 0]} castShadow>
            <capsuleGeometry args={[0.2, 0.25, 8, 16]} />
            <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
          </mesh>

          {[-1, 1].map((side) => (
            <group key={`arm-${side}`}>
              <mesh position={[side * 0.38, 1.55, 0]} rotation={[0, 0, side * 0.2]} castShadow>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
              </mesh>
              <mesh position={[side * 0.5, 1.35, 0]} rotation={[0, 0, side * 0.3]} castShadow>
                <capsuleGeometry args={[0.05, 0.3, 8, 16]} />
                <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
              </mesh>
              <mesh position={[side * 0.6, 1.1, 0]} rotation={[0, 0, side * 0.2]} castShadow>
                <capsuleGeometry args={[0.045, 0.28, 8, 16]} />
                <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
              </mesh>
            </group>
          ))}

          {[-1, 1].map((side) => (
            <group key={`leg-${side}`}>
              <mesh position={[side * 0.12, 0.6, 0]} castShadow>
                <capsuleGeometry args={[0.08, 0.45, 8, 16]} />
                <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
              </mesh>
              <mesh position={[side * 0.12, 0.18, 0]} castShadow>
                <capsuleGeometry args={[0.06, 0.35, 8, 16]} />
                <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      </Float>

      {activeMeasurement !== null && measurements[activeMeasurement] && (
        <MeasurementLine measurement={measurements[activeMeasurement]} />
      )}
    </group>
  );
}

function MeasurementLine({ measurement }: { measurement: Measurement }) {
  const [progress, setProgress] = useState(0);

  const startPos = getLandmarkPosition(measurement.landmark_start);
  const endPos = getLandmarkPosition(measurement.landmark_end);

  useFrame((_, delta) => {
    if (progress < 1) {
      setProgress((p) => Math.min(p + delta * 2, 1));
    }
  });

  const currentEnd: [number, number, number] = [
    startPos[0] + (endPos[0] - startPos[0]) * progress,
    startPos[1] + (endPos[1] - startPos[1]) * progress,
    startPos[2] + (endPos[2] - startPos[2]) * progress,
  ];

  const midPoint: [number, number, number] = [
    (startPos[0] + currentEnd[0]) / 2,
    (startPos[1] + currentEnd[1]) / 2,
    (startPos[2] + currentEnd[2]) / 2 + 0.3,
  ];

  const linePoints: [number, number, number][] = [startPos, currentEnd];

  return (
    <group>
      <mesh position={startPos}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>

      <mesh position={currentEnd}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>

      <Line
        points={linePoints}
        color="#00ff88"
        lineWidth={3}
      />

      {progress > 0.5 && (
        <Html position={midPoint} center>
          <div className="glass px-3 py-1.5 rounded-full text-sm font-semibold text-white whitespace-nowrap animate-fade-in">
            {measurement.name}: {measurement.value} {measurement.unit}
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({ measurements, activeMeasurement }: { measurements: Measurement[]; activeMeasurement: number | null }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#4a9eff" />
      <spotLight
        position={[0, 5, 5]}
        angle={0.4}
        penumbra={0.5}
        intensity={1}
        color="#00d4ff"
        castShadow
      />

      <HumanBody activeMeasurement={activeMeasurement} measurements={measurements} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[2, 64]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.8}
          metalness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>

      <gridHelper args={[4, 20, "#2a2a4a", "#1a1a3a"]} position={[0, 0, 0]} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={6}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        autoRotate={activeMeasurement === null}
        autoRotateSpeed={0.5}
      />

      <Environment preset="city" />
    </>
  );
}

export default function HumanModel({ measurements, activeMeasurement, onMeasurementComplete }: HumanModelProps) {
  useEffect(() => {
    if (activeMeasurement !== null && onMeasurementComplete) {
      const timer = setTimeout(() => {
        onMeasurementComplete(activeMeasurement);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeMeasurement, onMeasurementComplete]);

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene measurements={measurements} activeMeasurement={activeMeasurement} />
      </Canvas>
    </div>
  );
}
