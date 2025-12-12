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
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const pmremRef = useRef<THREE.PMREMGenerator | null>(null);
  const envMapRef = useRef<THREE.Texture | null>(null);
  const { gl } = useThree();
  
  const videoTexture = useMemo(() => {
    if (!videoElement) return null;
    const texture = new THREE.VideoTexture(videoElement);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }, [videoElement]);

  useEffect(() => {
    if (!videoTexture || !gl) return;

    pmremRef.current = new THREE.PMREMGenerator(gl);
    pmremRef.current.compileEquirectangularShader();

    return () => {
      if (pmremRef.current) {
        pmremRef.current.dispose();
        pmremRef.current = null;
      }
      if (envMapRef.current) {
        envMapRef.current.dispose();
        envMapRef.current = null;
      }
      if (videoTexture) {
        videoTexture.dispose();
      }
    };
  }, [videoTexture, gl]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
    
    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }
  });

  const isActive = cameraState === "active" && videoTexture;

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <RoundedBox args={[1.8, 2.4, 0.15]} radius={0.12} smoothness={4}>
          <meshPhysicalMaterial
            ref={materialRef}
            color={isActive ? "#1a1816" : "#2a2520"}
            metalness={0.1}
            roughness={0.05}
            transmission={0.92}
            thickness={0.5}
            envMapIntensity={isActive ? 2.0 : 0.3}
            envMap={videoTexture}
            clearcoat={1}
            clearcoatRoughness={0.1}
            ior={1.5}
            transparent={true}
            opacity={0.95}
          />
        </RoundedBox>
      </mesh>

      <mesh position={[0, 0, -0.1]}>
        <RoundedBox args={[1.6, 2.2, 0.02]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color="#0a0908"
            metalness={0.8}
            roughness={0.3}
          />
        </RoundedBox>
      </mesh>

      <pointLight position={[2, 2, 2]} intensity={0.3} color="#c4a77d" />
      <pointLight position={[-2, 1, 2]} intensity={0.2} color="#9c8f78" />
    </group>
  );
}

function FallbackBooth() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <RoundedBox args={[1.8, 2.4, 0.15]} radius={0.12} smoothness={4}>
          <meshPhysicalMaterial
            color="#2a2520"
            metalness={0.1}
            roughness={0.15}
            transmission={0.85}
            thickness={0.5}
            clearcoat={1}
            clearcoatRoughness={0.2}
            ior={1.4}
            transparent={true}
            opacity={0.9}
          />
        </RoundedBox>
      </mesh>

      <mesh position={[0, 0, -0.1]}>
        <RoundedBox args={[1.6, 2.2, 0.02]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color="#0a0908"
            metalness={0.8}
            roughness={0.3}
          />
        </RoundedBox>
      </mesh>

      <pointLight position={[2, 2, 2]} intensity={0.3} color="#c4a77d" />
      <pointLight position={[-2, 1, 2]} intensity={0.2} color="#9c8f78" />
    </group>
  );
}

function Scene({ videoElement, cameraState }: GlassBoothProps) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} color="#e8e0d5" />
      
      {cameraState === "active" && videoElement ? (
        <GlassBooth videoElement={videoElement} cameraState={cameraState} />
      ) : (
        <FallbackBooth />
      )}
      
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.3}
        scale={4}
        blur={2}
        far={2}
        color="#1f1c18"
      />
      
      <Environment preset="night" />
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
