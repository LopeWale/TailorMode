"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Line, Float, Sparkles } from "@react-three/drei";
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

function createHumanBodyGeometry() {
  const shape = new THREE.Shape();
  
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.15, 0, 0.18, 0.1, 0.14, 0.25);
  shape.bezierCurveTo(0.12, 0.35, 0.13, 0.45, 0.14, 0.55);
  shape.bezierCurveTo(0.15, 0.65, 0.14, 0.75, 0.12, 0.85);
  shape.bezierCurveTo(0.11, 0.95, 0.09, 1.05, 0.08, 1.15);
  shape.lineTo(0, 1.15);
  
  const extrudeSettings = {
    steps: 32,
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 8
  };
  
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  
  return geometry;
}

function HolographicShell({ time }: { time: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScanLine: { value: 0 },
    uColor: { value: new THREE.Color("#c4a77d") },
  }), []);

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uScanLine;
    uniform vec3 uColor;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
      
      float scanLine = smoothstep(0.02, 0.0, abs(vPosition.y - uScanLine));
      scanLine *= 0.8;
      
      float grid = 0.0;
      float gridSize = 30.0;
      vec2 gridUv = fract(vUv * gridSize);
      grid = step(0.95, gridUv.x) + step(0.95, gridUv.y);
      grid = min(grid, 0.15);
      
      vec3 color = uColor;
      float alpha = fresnel * 0.4 + scanLine + grid * 0.3;
      
      gl_FragColor = vec4(color, alpha * 0.6);
    }
  `;

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uScanLine.value = (Math.sin(time * 0.5) * 0.5 + 0.5) * 2.0 - 0.5;
    }
  });

  return (
    <mesh ref={meshRef} scale={[1.02, 1.02, 1.02]}>
      <capsuleGeometry args={[0.18, 1.4, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function GlowingRing({ y, delay, color }: { y: number; delay: number; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = clock.getElapsedTime() + delay;
      const scale = 1 + Math.sin(t * 2) * 0.05;
      ringRef.current.scale.set(scale, scale, 1);
      ringRef.current.rotation.z = t * 0.2;
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(t * 3) * 0.1;
    }
  });

  return (
    <mesh ref={ringRef} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.25, 0.27, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PremiumBody({ 
  isActive,
}: { 
  isActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const glowIntensity = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(timeRef.current * 0.3) * 0.08;
    }
    
    const targetGlow = isActive ? 0.4 : 0.15;
    glowIntensity.current += (targetGlow - glowIntensity.current) * 0.1;
  });

  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#3d3630"),
    metalness: 0.3,
    roughness: 0.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.5,
  }), []);

  const glowMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#c4a77d"),
    metalness: 0.2,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    emissive: new THREE.Color("#c4a77d"),
    emissiveIntensity: 0.2,
    envMapIntensity: 0.6,
  }), []);

  const jointMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#2a2520"),
    metalness: 0.5,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  }), []);

  return (
    <group ref={groupRef}>
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.115, 64, 64]} />
        <meshPhysicalMaterial
          color="#3d3630"
          metalness={0.3}
          roughness={0.35}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      <mesh position={[0, 1.72, 0.06]}>
        <planeGeometry args={[0.08, 0.03]} />
        <meshBasicMaterial color="#c4a77d" transparent opacity={0.7} />
      </mesh>

      <mesh position={[0, 1.57, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.12, 32]} />
        <primitive object={jointMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 1.3, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.28, 16, 32]} />
        <primitive object={isActive ? glowMaterial : bodyMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 0.97, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.18, 16, 32]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 0.82, 0]} castShadow>
        <capsuleGeometry args={[0.155, 0.1, 16, 32]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={`arm-${side}`}>
          <mesh position={[side * 0.21, 1.44, 0]} castShadow>
            <sphereGeometry args={[0.055, 32, 32]} />
            <primitive object={jointMaterial} attach="material" />
          </mesh>
          
          <mesh position={[side * 0.3, 1.28, 0]} rotation={[0, 0, side * 0.25]} castShadow>
            <capsuleGeometry args={[0.04, 0.22, 12, 24]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
          
          <mesh position={[side * 0.36, 1.12, 0]} castShadow>
            <sphereGeometry args={[0.035, 24, 24]} />
            <primitive object={jointMaterial} attach="material" />
          </mesh>
          
          <mesh position={[side * 0.42, 0.98, 0]} rotation={[0, 0, side * 0.1]} castShadow>
            <capsuleGeometry args={[0.032, 0.2, 12, 24]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
          
          <mesh position={[side * 0.47, 0.82, 0]} castShadow>
            <sphereGeometry args={[0.028, 24, 24]} />
            <primitive object={jointMaterial} attach="material" />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`leg-${side}`}>
          <mesh position={[side * 0.085, 0.72, 0]} castShadow>
            <sphereGeometry args={[0.055, 32, 32]} />
            <primitive object={jointMaterial} attach="material" />
          </mesh>
          
          <mesh position={[side * 0.09, 0.52, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.32, 12, 24]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
          
          <mesh position={[side * 0.09, 0.32, 0]} castShadow>
            <sphereGeometry args={[0.045, 24, 24]} />
            <primitive object={jointMaterial} attach="material" />
          </mesh>
          
          <mesh position={[side * 0.09, 0.16, 0]} castShadow>
            <capsuleGeometry args={[0.048, 0.24, 12, 24]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
          
          <mesh position={[side * 0.09, 0.02, 0.025]} castShadow>
            <boxGeometry args={[0.065, 0.04, 0.11]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
        </group>
      ))}

      <HolographicShell time={timeRef.current} />
      
      <GlowingRing y={1.25} delay={0} color="#c4a77d" />
      <GlowingRing y={1.0} delay={1} color="#9c8f78" />
      <GlowingRing y={0.75} delay={2} color="#c4a77d" />
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
  const lineRef = useRef<THREE.Group>(null);

  useEffect(() => {
    setProgress(0);
    hasCompletedRef.current = false;
  }, [measurement]);

  const startPos = getLandmarkPosition(measurement.landmark_start);
  const endPos = getLandmarkPosition(measurement.landmark_end);

  useFrame((_, delta) => {
    if (progress < 1) {
      setProgress((p) => Math.min(p + delta * 1.5, 1));
    } else if (!hasCompletedRef.current && onComplete) {
      hasCompletedRef.current = true;
      setTimeout(() => {
        onComplete();
      }, 600);
    }
  });

  const currentEnd: [number, number, number] = [
    startPos[0] + (endPos[0] - startPos[0]) * progress,
    startPos[1] + (endPos[1] - startPos[1]) * progress,
    startPos[2] + (endPos[2] - startPos[2]) * progress,
  ];

  const midPoint: [number, number, number] = [
    (startPos[0] + currentEnd[0]) / 2,
    (startPos[1] + currentEnd[1]) / 2 + 0.12,
    (startPos[2] + currentEnd[2]) / 2 + 0.3,
  ];

  return (
    <group ref={lineRef}>
      <Float speed={3} rotationIntensity={0} floatIntensity={0.1}>
        <mesh position={startPos}>
          <sphereGeometry args={[0.02, 24, 24]} />
          <meshBasicMaterial color="#c4a77d" />
        </mesh>
        <mesh position={startPos}>
          <ringGeometry args={[0.025, 0.035, 32]} />
          <meshBasicMaterial color="#c4a77d" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </Float>

      <Float speed={3} rotationIntensity={0} floatIntensity={0.1}>
        <mesh position={currentEnd}>
          <sphereGeometry args={[0.02, 24, 24]} />
          <meshBasicMaterial color="#c4a77d" />
        </mesh>
        <mesh position={currentEnd}>
          <ringGeometry args={[0.025, 0.035, 32]} />
          <meshBasicMaterial color="#c4a77d" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </Float>

      <Line
        points={[startPos, currentEnd]}
        color="#c4a77d"
        lineWidth={2}
        dashed
        dashSize={0.02}
        gapSize={0.01}
      />

      {progress > 0.6 && (
        <Html position={midPoint} center>
          <div 
            className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap backdrop-blur-xl border border-[#c4a77d]/20"
            style={{ 
              background: 'linear-gradient(135deg, rgba(31, 28, 24, 0.95), rgba(15, 14, 12, 0.98))',
              animation: 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(196, 167, 125, 0.15)'
            }}
          >
            <span className="text-[#c4a77d] font-bold text-base">{measurement.value}</span>
            <span className="text-[#9c8f78] ml-1">{measurement.unit}</span>
            <div className="text-[#78716c] text-xs mt-0.5">{measurement.name}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function PremiumFloor() {
  const floorRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[2.5, 128]} />
        <meshPhysicalMaterial
          color="#0a0908"
          roughness={0.2}
          metalness={0.8}
          clearcoat={0.5}
          clearcoatRoughness={0.3}
        />
      </mesh>

      <gridHelper 
        args={[5, 40, "#2a2520", "#1a1816"]} 
        position={[0, 0.001, 0]} 
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.8, 0.82, 64]} />
        <meshBasicMaterial color="#c4a77d" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.2, 1.22, 64]} />
        <meshBasicMaterial color="#9c8f78" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AmbientParticles() {
  return (
    <Sparkles
      count={50}
      scale={4}
      size={1.5}
      speed={0.2}
      color="#c4a77d"
      opacity={0.3}
    />
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
      <ambientLight intensity={0.3} color="#faf9f7" />
      
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.8} 
        color="#faf9f7" 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      <pointLight position={[-3, 4, -2]} intensity={0.4} color="#c4a77d" distance={10} />
      <pointLight position={[3, 2, 4]} intensity={0.3} color="#d4c4a8" distance={8} />
      <pointLight position={[0, 0.5, 3]} intensity={0.2} color="#c4a77d" distance={6} />
      
      <spotLight
        position={[0, 5, 0]}
        angle={0.5}
        penumbra={0.8}
        intensity={0.6}
        color="#c4a77d"
        castShadow
      />

      <group position={[0, 0, 0]}>
        <PremiumBody isActive={activeMeasurement !== null} />
        
        {activeMeasurement !== null && measurements[activeMeasurement] && (
          <MeasurementLine 
            measurement={measurements[activeMeasurement]} 
            onComplete={onAnimationComplete}
          />
        )}
      </group>

      <PremiumFloor />
      <AmbientParticles />

      <OrbitControls
        enablePan={false}
        enableZoom={isInteractive}
        minDistance={2.2}
        maxDistance={5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={!isInteractive || activeMeasurement === null}
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />

      <fog attach="fog" args={['#0a0908', 5, 15]} />
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
    <div className="w-full h-full relative">
      <div className="absolute inset-0 bg-gradient-radial from-[#1a1816] via-[#0f0e0c] to-[#0a0908]" />
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 3.5], fov: 32 }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
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
