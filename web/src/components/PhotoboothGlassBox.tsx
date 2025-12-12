"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
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
  const [textureReady, setTextureReady] = useState(false);
  
  const videoTexture = useMemo(() => {
    if (!videoElement) return null;
    const texture = new THREE.VideoTexture(videoElement);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    return texture;
  }, [videoElement]);

  useEffect(() => {
    if (videoElement && videoTexture) {
      const checkReady = () => {
        if (videoElement.readyState >= 2) {
          setTextureReady(true);
        }
      };
      videoElement.addEventListener("loadeddata", checkReady);
      checkReady();
      return () => videoElement.removeEventListener("loadeddata", checkReady);
    }
  }, [videoElement, videoTexture]);

  useEffect(() => {
    return () => {
      if (videoTexture) {
        videoTexture.dispose();
      }
    };
  }, [videoTexture]);

  useFrame(() => {
    if (groupRef.current) {
      const time = Date.now() * 0.001;
      groupRef.current.rotation.y = Math.sin(time * 0.25) * 0.04;
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.015;
    }
    
    if (videoTexture && textureReady) {
      videoTexture.needsUpdate = true;
    }
  });

  const showVideo = cameraState === "active" && videoTexture && textureReady;

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -0.055]}>
        <RoundedBox args={[1.68, 2.28, 0.01]} radius={0.08} smoothness={4}>
          <meshBasicMaterial
            map={showVideo ? videoTexture : null}
            color={showVideo ? "#aaaaaa" : "#1a1816"}
            transparent={true}
            opacity={showVideo ? 0.5 : 1}
            toneMapped={false}
          />
        </RoundedBox>
      </mesh>

      <mesh position={[0, 0, 0]}>
        <RoundedBox args={[1.8, 2.4, 0.1]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial
            color="#f0ede8"
            metalness={0.1}
            roughness={0.25}
            transmission={0.8}
            thickness={0.8}
            envMapIntensity={0.6}
            clearcoat={0.9}
            clearcoatRoughness={0.2}
            ior={1.5}
            transparent={true}
            opacity={0.9}
            side={THREE.FrontSide}
          />
        </RoundedBox>
      </mesh>

      <mesh position={[0, 0, 0.052]}>
        <RoundedBox args={[1.78, 2.38, 0.001]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial
            color="#ffffff"
            metalness={0.95}
            roughness={0.1}
            envMapIntensity={1.0}
            clearcoat={1}
            clearcoatRoughness={0.02}
            transparent={true}
            opacity={0.12}
          />
        </RoundedBox>
      </mesh>

      <pointLight position={[3, 3, 4]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-3, 2, 4]} intensity={0.35} color="#c4a77d" />
      <pointLight position={[0, -2, 3]} intensity={0.25} color="#e8e0d5" />
    </group>
  );
}

function FallbackBooth() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      const time = Date.now() * 0.001;
      groupRef.current.rotation.y = Math.sin(time * 0.25) * 0.04;
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -0.055]}>
        <RoundedBox args={[1.68, 2.28, 0.01]} radius={0.08} smoothness={4}>
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
            color="#e8e4df"
            metalness={0.08}
            roughness={0.3}
            transmission={0.82}
            thickness={0.8}
            clearcoat={0.8}
            clearcoatRoughness={0.25}
            ior={1.45}
            transparent={true}
            opacity={0.92}
            side={THREE.FrontSide}
          />
        </RoundedBox>
      </mesh>

      <pointLight position={[3, 3, 4]} intensity={0.45} color="#ffffff" />
      <pointLight position={[-3, 2, 4]} intensity={0.3} color="#c4a77d" />
    </group>
  );
}

function Scene({ videoElement, cameraState }: GlassBoothProps) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={0.45} color="#ffffff" />
      
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
  const { videoRef, state } = useCameraFeed();
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
