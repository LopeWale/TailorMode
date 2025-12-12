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
        className="relative cursor-pointer"
        onClick={() => {
          if (cameraState !== "active") {
            startCamera();
          }
        }}
      >
        <div 
          className="relative w-[180px] h-[260px] rounded-[16px] overflow-hidden"
          style={{
            background: "#1a1816",
            boxShadow: `
              0 30px 60px -15px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(196, 167, 125, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.05)
            `,
          }}
        >
          <div 
            className="absolute inset-[6px] rounded-[12px] overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #2a2520, #1f1c18)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
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
                filter: "blur(6px) brightness(0.9) contrast(1.1) saturate(0.85)",
                opacity: isActive ? 0.7 : 0,
                transition: "opacity 0.5s ease",
              }}
            />

            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: isActive 
                  ? "linear-gradient(145deg, rgba(196,167,125,0.08) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)"
                  : "linear-gradient(145deg, rgba(42,37,32,0.9) 0%, rgba(31,28,24,1) 100%)",
                transition: "background 0.5s ease",
              }}
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.15) 100%)",
              }}
            />
          </div>

          <div
            className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full"
            style={{
              background: isActive 
                ? "radial-gradient(circle, #c4a77d 0%, #9c8f78 100%)"
                : "radial-gradient(circle, #3d3630 0%, #2a2520 100%)",
              boxShadow: isActive ? "0 0 8px rgba(196, 167, 125, 0.5)" : "none",
              transition: "all 0.3s ease",
            }}
          />

          <div
            className="absolute bottom-[10px] left-1/2 -translate-x-1/2 flex gap-1"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-[4px] h-[4px] rounded-full"
                style={{
                  background: i === 1 && isActive ? "#c4a77d" : "#3d3630",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="absolute -inset-[3px] rounded-[19px] pointer-events-none"
          style={{
            background: "linear-gradient(145deg, rgba(196,167,125,0.2) 0%, transparent 50%, rgba(196,167,125,0.1) 100%)",
            opacity: 0.5,
          }}
        />

        {cameraState === "requesting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#c4a77d]/30 border-t-[#c4a77d] rounded-full animate-spin" />
          </div>
        )}

        {(cameraState === "denied" || cameraState === "error" || cameraState === "idle") && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[#c4a77d]/40 text-[10px] text-center px-4">
              Tap to activate
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
