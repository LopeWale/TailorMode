"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, ThreeElements } from "@react-three/fiber";
import { RoundedBox, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useCameraFeed, type CameraState } from "@/hooks/useCameraFeed";

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface GlassBoothProps {
  videoElement: HTMLVideoElement | null;
  cameraState: CameraState;
}

function GlassBooth({ videoElement, cameraState }: GlassBoothProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl, size } = useThree();
  
  const videoTexture = useMemo(() => {
    if (!videoElement) return null;
    const texture = new THREE.VideoTexture(videoElement);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    return texture;
  }, [videoElement]);

  useEffect(() => {
    return () => {
      if (videoTexture) {
        videoTexture.dispose();
      }
    };
  }, [videoTexture]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.04;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.015;
    }
    
    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }
  });

  const isActive = cameraState === "active" && videoTexture;

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -0.06]}>
        <RoundedBox args={[1.7, 2.3, 0.02]} radius={0.08} smoothness={4}>
          <meshBasicMaterial
            map={isActive ? videoTexture : null}
            color={isActive ? "#888888" : "#151312"}
            opacity={isActive ? 0.35 : 1}
            transparent={true}
          />
        </RoundedBox>
      </mesh>

      <mesh position={[0, 0, 0]}>
        <RoundedBox args={[1.8, 2.4, 0.1]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial
            color="#e8e4df"
            metalness={0.15}
            roughness={0.35}
            transmission={0.7}
            thickness={1.5}
            envMapIntensity={0.8}
            clearcoat={0.8}
            clearcoatRoughness={0.3}
            ior={1.5}
            transparent={true}
            opacity={0.85}
            side={THREE.FrontSide}
          />
        </RoundedBox>
      </mesh>

      <mesh position={[0, 0, 0.051]}>
        <RoundedBox args={[1.78, 2.38, 0.001]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial
            color="#ffffff"
            metalness={0.9}
            roughness={0.15}
            envMapIntensity={1.2}
            clearcoat={1}
            clearcoatRoughness={0.05}
            transparent={true}
            opacity={0.15}
          />
        </RoundedBox>
      </mesh>

      <pointLight position={[3, 3, 4]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-3, 2, 4]} intensity={0.4} color="#c4a77d" />
      <pointLight position={[0, -2, 3]} intensity={0.3} color="#e8e0d5" />
    </group>
  );
}

function FallbackBooth() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.04;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -0.06]}>
        <RoundedBox args={[1.7, 2.3, 0.02]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color="#1a1816"
            metalness={0.2}
            roughness={0.8}
          />
        </RoundedBox>
      </mesh>

      <mesh position={[0, 0, 0]}>
        <RoundedBox args={[1.8, 2.4, 0.1]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial
            color="#d4cfc8"
            metalness={0.1}
            roughness={0.4}
            transmission={0.75}
            thickness={1.2}
            clearcoat={0.6}
            clearcoatRoughness={0.35}
            ior={1.45}
            transparent={true}
            opacity={0.88}
            side={THREE.FrontSide}
          />
        </RoundedBox>
      </mesh>

      <pointLight position={[3, 3, 4]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-3, 2, 4]} intensity={0.3} color="#c4a77d" />
    </group>
  );
}

function Scene({ videoElement, cameraState }: GlassBoothProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
      
      {cameraState === "active" && videoElement ? (
        <GlassBooth videoElement={videoElement} cameraState={cameraState} />
      ) : (
        <FallbackBooth />
      )}
      
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.2}
        scale={4}
        blur={3}
        far={2}
        color="#1f1c18"
      />
      
      <Environment preset="apartment" />
    </>
  );
}

interface PhotoboothGlassBoxProps {
  className?: string;
}

export default function PhotoboothGlassBox({ className }: PhotoboothGlassBoxProps) {
  const { videoRef, state, error } = useCameraFeed();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && state === "active") {
      setVideoElement(videoRef.current);
    }
  }, [videoRef, state]);

  return (
    <div className={`relative w-full h-full ${className || ""}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 35 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Scene videoElement={videoElement} cameraState={state} />
      </Canvas>
      
      {state === "requesting" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-[#78716c] text-xs text-center px-4">
            <div className="w-6 h-6 border-2 border-[#c4a77d] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Accessing camera...
          </div>
        </div>
      )}
      
      {(state === "denied" || state === "error") && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <div className="text-[#57534e] text-[10px] text-center px-4 py-2 bg-[#1f1c18]/50 rounded-full backdrop-blur-sm">
            Ambient mode
          </div>
        </div>
      )}
    </div>
  );
}
