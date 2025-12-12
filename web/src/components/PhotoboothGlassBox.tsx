"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface PhotoboothGlassBoxProps {
  className?: string;
}

export default function PhotoboothGlassBox({ className }: PhotoboothGlassBoxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<"idle" | "requesting" | "active" | "denied" | "error">("idle");

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    
    setCameraState("requesting");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
        audio: false,
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setCameraState("active");
          } catch (playErr) {
            console.error("Video play error:", playErr);
            setCameraState("error");
          }
        };
      }
    } catch (err: any) {
      console.error("Camera error details:", {
        name: err?.name,
        message: err?.message,
        constraint: err?.constraint,
      });
      
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setCameraState("denied");
      } else if (err?.name === "OverconstrainedError") {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
            setCameraState("active");
          }
        } catch {
          setCameraState("error");
        }
      } else {
        setCameraState("error");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopCamera();
        setCameraState("idle");
      } else if (cameraState === "idle") {
        startCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [startCamera, stopCamera, cameraState]);

  const isActive = cameraState === "active";

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className || ""}`}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[200px] h-[280px] rounded-[20px] overflow-hidden cursor-pointer"
        onClick={() => {
          if (cameraState !== "active") {
            startCamera();
          }
        }}
        style={{
          background: "linear-gradient(145deg, #f5f3f0, #e8e4df)",
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: "scaleX(-1)",
            filter: "blur(12px) brightness(1.1) saturate(0.9)",
            opacity: isActive ? 0.55 : 0,
            transition: "opacity 0.5s ease",
          }}
        />

        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isActive 
              ? "linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.03) 100%)"
              : "linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(240,236,230,0.8) 50%, rgba(220,216,210,0.9) 100%)",
            transition: "background 0.5s ease",
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.05) 100%)",
          }}
        />

        <div
          className="absolute inset-[1px] rounded-[19px] pointer-events-none"
          style={{
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.08)",
          }}
        />

        {cameraState === "requesting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#c4a77d]/30 border-t-[#c4a77d] rounded-full animate-spin" />
          </div>
        )}

        {(cameraState === "denied" || cameraState === "error" || cameraState === "idle") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[#78716c]/60 text-[10px] text-center px-4">
              {cameraState === "denied" ? "Tap to enable camera" : "Tap to activate"}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
