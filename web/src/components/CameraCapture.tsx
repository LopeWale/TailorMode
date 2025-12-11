"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
      setError(null);
    } catch (err: any) {
      console.error("Camera error:", err);
      setError(err.message || "Could not access camera");
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const switchCamera = useCallback(() => {
    setIsReady(false);
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  const capturePhoto = useCallback(() => {
    setShowGuide(false);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          
          if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const imageData = canvas.toDataURL("image/jpeg", 0.9);
              onCapture(imageData);
            }
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onCapture]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0f0e0c]"
    >
      <div className="relative w-full h-full flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
          <div className="flex items-center justify-between p-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full surface-glass flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            <div className="surface-glass px-4 py-2 rounded-full">
              <span className="text-[#faf9f7] text-sm font-medium">Body Capture</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={switchCamera}
              className="w-10 h-10 rounded-full surface-glass flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </motion.button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1f1c18] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#78716c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-[#faf9f7] font-semibold text-lg mb-2">Camera Access Required</h3>
                <p className="text-[#78716c] text-sm mb-4">{error}</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startCamera}
                  className="px-6 py-3 btn-primary rounded-xl font-medium"
                >
                  Try Again
                </motion.button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              <AnimatePresence>
                {showGuide && isReady && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="relative w-64 h-[420px]">
                      <svg viewBox="0 0 200 320" className="w-full h-full">
                        <defs>
                          <linearGradient id="guideGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#c4a77d" />
                            <stop offset="100%" stopColor="#9c8f78" />
                          </linearGradient>
                        </defs>
                        <ellipse cx="100" cy="35" rx="25" ry="30" fill="none" stroke="url(#guideGradient)" strokeWidth="2" strokeDasharray="8 4" className="animate-pulse" />
                        <path d="M 60 70 L 60 180 L 55 280 M 140 70 L 140 180 L 145 280" fill="none" stroke="url(#guideGradient)" strokeWidth="2" strokeDasharray="8 4" className="animate-pulse" />
                        <path d="M 60 80 L 20 130 L 15 200 M 140 80 L 180 130 L 185 200" fill="none" stroke="url(#guideGradient)" strokeWidth="2" strokeDasharray="8 4" className="animate-pulse" />
                        <ellipse cx="100" cy="130" rx="45" ry="55" fill="none" stroke="url(#guideGradient)" strokeWidth="2" strokeDasharray="8 4" className="animate-pulse" />
                      </svg>
                      
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center"
                      >
                        <p className="text-[#faf9f7] text-sm font-medium surface-glass px-4 py-2 rounded-full">
                          Position yourself in the frame
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {countdown !== null && (
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-8xl font-bold text-[#c4a77d] drop-shadow-2xl">
                      {countdown}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 safe-area-bottom">
          <div className="flex flex-col items-center gap-4 p-6">
            {!error && (
              <>
                <div className="flex items-center gap-2 text-[#a8a29e] text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#9c8f78] animate-pulse" />
                  {isReady ? "Camera ready" : "Initializing..."}
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  disabled={!isReady || countdown !== null}
                  className="relative w-20 h-20 rounded-full bg-[#faf9f7] disabled:opacity-50"
                >
                  <div className="absolute inset-1 rounded-full border-4 border-[#0f0e0c]" />
                  <motion.div
                    animate={isReady ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-3 rounded-full bg-[#faf9f7] shadow-lg"
                  />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
