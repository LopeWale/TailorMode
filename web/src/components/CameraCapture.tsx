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
      className="fixed inset-0 z-50 bg-black"
    >
      <div className="relative w-full h-full flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
          <div className="flex items-center justify-between p-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            <div className="glass px-4 py-2 rounded-full">
              <span className="text-white text-sm font-medium">Body Capture</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={switchCamera}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Camera Access Required</h3>
                <p className="text-gray-400 text-sm mb-4">{error}</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startCamera}
                  className="px-6 py-3 bg-primary-500 rounded-full text-white font-medium"
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
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#d946ef" />
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
                        <p className="text-white text-sm font-medium glass px-4 py-2 rounded-full">
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
                    <span className="text-8xl font-bold text-white drop-shadow-2xl">
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
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {isReady ? "Camera ready" : "Initializing..."}
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  disabled={!isReady || countdown !== null}
                  className="relative w-20 h-20 rounded-full bg-white disabled:opacity-50"
                >
                  <div className="absolute inset-1 rounded-full border-4 border-black/10" />
                  <motion.div
                    animate={isReady ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-3 rounded-full bg-white shadow-lg"
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
