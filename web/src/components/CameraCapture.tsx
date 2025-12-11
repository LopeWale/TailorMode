"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

function PremiumPoseGuide({ isAligned }: { isAligned: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative" style={{ width: '280px', height: '480px' }}>
        <svg viewBox="0 0 280 480" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isAligned ? "#c4a77d" : "#78716c"} stopOpacity="0.8" />
              <stop offset="50%" stopColor={isAligned ? "#9c8f78" : "#57534e"} stopOpacity="0.6" />
              <stop offset="100%" stopColor={isAligned ? "#c4a77d" : "#78716c"} stopOpacity="0.8" />
            </linearGradient>
            
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isAligned ? "#c4a77d" : "#78716c"} stopOpacity="0.4" />
              <stop offset="100%" stopColor={isAligned ? "#c4a77d" : "#78716c"} stopOpacity="0.1" />
            </linearGradient>

            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <clipPath id="bodyClip">
              <path d="M 140 30
                       C 160 30, 175 45, 175 70
                       C 175 90, 165 100, 155 105
                       L 160 108
                       C 185 112, 210 130, 215 145
                       L 240 200
                       C 245 215, 242 225, 235 230
                       L 215 290
                       C 210 305, 205 310, 200 315
                       L 192 320
                       L 190 330
                       C 188 345, 186 360, 185 380
                       L 182 420
                       C 180 440, 178 455, 180 460
                       L 185 465
                       C 190 470, 188 478, 180 480
                       L 150 480
                       C 148 478, 148 472, 150 468
                       L 155 460
                       C 155 455, 150 440, 148 420
                       L 145 380
                       C 143 360, 142 345, 140 330
                       C 138 345, 137 360, 135 380
                       L 132 420
                       C 130 440, 125 455, 125 460
                       L 130 468
                       C 132 472, 132 478, 130 480
                       L 100 480
                       C 92 478, 90 470, 95 465
                       L 100 460
                       C 102 455, 100 440, 98 420
                       L 95 380
                       C 94 360, 92 345, 90 330
                       L 88 320
                       L 80 315
                       C 75 310, 70 305, 65 290
                       L 45 230
                       C 38 225, 35 215, 40 200
                       L 65 145
                       C 70 130, 95 112, 120 108
                       L 125 105
                       C 115 100, 105 90, 105 70
                       C 105 45, 120 30, 140 30 Z" />
            </clipPath>
          </defs>

          <g filter="url(#glow)">
            <path
              d="M 140 30
                 C 160 30, 175 45, 175 70
                 C 175 90, 165 100, 155 105
                 L 160 108
                 C 185 112, 210 130, 215 145
                 L 240 200
                 C 245 215, 242 225, 235 230
                 L 215 290
                 C 210 305, 205 310, 200 315
                 L 192 320
                 L 190 330
                 C 188 345, 186 360, 185 380
                 L 182 420
                 C 180 440, 178 455, 180 460
                 L 185 465
                 C 190 470, 188 478, 180 480
                 L 150 480
                 C 148 478, 148 472, 150 468
                 L 155 460
                 C 155 455, 150 440, 148 420
                 L 145 380
                 C 143 360, 142 345, 140 330
                 C 138 345, 137 360, 135 380
                 L 132 420
                 C 130 440, 125 455, 125 460
                 L 130 468
                 C 132 472, 132 478, 130 480
                 L 100 480
                 C 92 478, 90 470, 95 465
                 L 100 460
                 C 102 455, 100 440, 98 420
                 L 95 380
                 C 94 360, 92 345, 90 330
                 L 88 320
                 L 80 315
                 C 75 310, 70 305, 65 290
                 L 45 230
                 C 38 225, 35 215, 40 200
                 L 65 145
                 C 70 130, 95 112, 120 108
                 L 125 105
                 C 115 100, 105 90, 105 70
                 C 105 45, 120 30, 140 30 Z"
              fill="none"
              stroke="url(#bodyGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </g>

          <g opacity="0.15">
            <path
              d="M 140 30
                 C 160 30, 175 45, 175 70
                 C 175 90, 165 100, 155 105
                 L 160 108
                 C 185 112, 210 130, 215 145
                 L 240 200
                 C 245 215, 242 225, 235 230
                 L 215 290
                 C 210 305, 205 310, 200 315
                 L 192 320
                 L 190 330
                 C 188 345, 186 360, 185 380
                 L 182 420
                 C 180 440, 178 455, 180 460
                 L 185 465
                 C 190 470, 188 478, 180 480
                 L 150 480
                 C 148 478, 148 472, 150 468
                 L 155 460
                 C 155 455, 150 440, 148 420
                 L 145 380
                 C 143 360, 142 345, 140 330
                 C 138 345, 137 360, 135 380
                 L 132 420
                 C 130 440, 125 455, 125 460
                 L 130 468
                 C 132 472, 132 478, 130 480
                 L 100 480
                 C 92 478, 90 470, 95 465
                 L 100 460
                 C 102 455, 100 440, 98 420
                 L 95 380
                 C 94 360, 92 345, 90 330
                 L 88 320
                 L 80 315
                 C 75 310, 70 305, 65 290
                 L 45 230
                 C 38 225, 35 215, 40 200
                 L 65 145
                 C 70 130, 95 112, 120 108
                 L 125 105
                 C 115 100, 105 90, 105 70
                 C 105 45, 120 30, 140 30 Z"
              fill="url(#glowGradient)"
            />
          </g>

          <g stroke={isAligned ? "#c4a77d" : "#57534e"} strokeWidth="1" strokeDasharray="4 8" opacity="0.5">
            <line x1="140" y1="108" x2="140" y2="130" />
            <line x1="105" y1="160" x2="175" y2="160" />
            <line x1="100" y1="210" x2="180" y2="210" />
            <line x1="95" y1="260" x2="185" y2="260" />
          </g>

          <g fill={isAligned ? "#c4a77d" : "#78716c"} opacity="0.6">
            <circle cx="140" cy="120" r="3" />
            <circle cx="115" cy="160" r="3" />
            <circle cx="165" cy="160" r="3" />
            <circle cx="140" cy="210" r="3" />
            <circle cx="140" cy="260" r="3" />
          </g>
        </svg>

        <motion.div
          animate={{ 
            boxShadow: isAligned 
              ? ['0 0 30px rgba(196, 167, 125, 0.2)', '0 0 50px rgba(196, 167, 125, 0.4)', '0 0 30px rgba(196, 167, 125, 0.2)']
              : ['0 0 20px rgba(120, 113, 108, 0.1)', '0 0 30px rgba(120, 113, 108, 0.2)', '0 0 20px rgba(120, 113, 108, 0.1)']
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-[50%] pointer-events-none"
          style={{ borderRadius: '40% 40% 45% 45%' }}
        />
      </div>
    </div>
  );
}

function DistanceIndicator({ distance }: { distance: 'too_close' | 'optimal' | 'too_far' }) {
  const messages = {
    too_close: { text: 'Step back', icon: 'M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75' },
    optimal: { text: 'Perfect distance', icon: 'M4.5 12.75l6 6 9-13.5' },
    too_far: { text: 'Move closer', icon: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3' },
  };

  const { text, icon } = messages[distance];
  const isOptimal = distance === 'optimal';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl ${
        isOptimal 
          ? 'bg-[#c4a77d]/20 border border-[#c4a77d]/30' 
          : 'bg-[#1f1c18]/80 border border-[#78716c]/20'
      }`}
    >
      <svg 
        className={`w-4 h-4 ${isOptimal ? 'text-[#c4a77d]' : 'text-[#a8a29e]'}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      <span className={`text-sm font-medium ${isOptimal ? 'text-[#c4a77d]' : 'text-[#a8a29e]'}`}>
        {text}
      </span>
    </motion.div>
  );
}

function ScanningOverlay({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        initial={{ top: '0%' }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        className="absolute left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(196, 167, 125, 0.6), transparent)',
          boxShadow: '0 0 30px 10px rgba(196, 167, 125, 0.3)',
        }}
      />
      
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-48">
        <div className="relative h-1 bg-[#1f1c18]/50 rounded-full overflow-hidden backdrop-blur">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#c4a77d] to-[#9c8f78] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-center text-[#c4a77d] text-xs mt-2 font-medium">
          Scanning... {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

function CaptureInstructions({ step }: { step: number }) {
  const instructions = [
    { title: 'Stand in frame', subtitle: 'Align your body with the silhouette' },
    { title: 'Arms slightly out', subtitle: 'Keep arms away from your body' },
    { title: 'Hold still', subtitle: 'Remain steady during capture' },
  ];

  const instruction = instructions[step] || instructions[0];

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="text-center"
    >
      <h3 className="text-[#faf9f7] font-semibold text-lg mb-1">{instruction.title}</h3>
      <p className="text-[#a8a29e] text-sm">{instruction.subtitle}</p>
    </motion.div>
  );
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [instructionStep, setInstructionStep] = useState(0);
  const [isAligned, setIsAligned] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setInstructionStep((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAligned(true);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

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
    setIsScanning(true);
    
    const scanDuration = 2500;
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / scanDuration) * 100, 100);
      setScanProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressInterval);
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
      }
    }, 50);
  }, [onCapture]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0908]"
    >
      <div className="relative w-full h-full flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
          <div className="flex items-center justify-between p-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-[#1f1c18]/80 backdrop-blur-xl border border-[#3d3630]/50 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-[#e8e0d5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            <div className="bg-[#1f1c18]/80 backdrop-blur-xl border border-[#3d3630]/50 px-5 py-2.5 rounded-full">
              <span className="text-[#e8e0d5] text-sm font-semibold tracking-wide">Body Capture</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={switchCamera}
              className="w-11 h-11 rounded-full bg-[#1f1c18]/80 backdrop-blur-xl border border-[#3d3630]/50 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-[#e8e0d5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </motion.button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0908]">
              <div className="text-center p-8 max-w-sm">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1f1c18] to-[#2a2520] border border-[#3d3630]/50 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#78716c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <h3 className="text-[#e8e0d5] font-semibold text-xl mb-3">Camera Access Required</h3>
                <p className="text-[#78716c] text-sm mb-6 leading-relaxed">{error}</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startCamera}
                  className="w-full py-4 btn-primary rounded-2xl font-semibold text-base"
                >
                  Enable Camera
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

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-transparent to-[#0a0908]/60" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0908]/30 via-transparent to-[#0a0908]/30" />
              </div>

              <AnimatePresence>
                {showGuide && isReady && !isScanning && (
                  <PremiumPoseGuide isAligned={isAligned} />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isScanning && countdown === null && (
                  <ScanningOverlay progress={scanProgress} />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {countdown !== null && (
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 rounded-full bg-[#c4a77d]/20 blur-3xl"
                        style={{ width: '200px', height: '200px', marginLeft: '-100px', marginTop: '-100px' }}
                      />
                      <span className="relative text-9xl font-bold text-[#c4a77d] drop-shadow-2xl" style={{ fontFamily: 'system-ui' }}>
                        {countdown}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 safe-area-bottom">
          <div className="flex flex-col items-center gap-5 p-6 pb-8">
            {!error && isReady && !isScanning && (
              <>
                <DistanceIndicator distance={isAligned ? 'optimal' : 'too_far'} />
                
                <AnimatePresence mode="wait">
                  <CaptureInstructions step={instructionStep} />
                </AnimatePresence>
              </>
            )}

            {!error && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={capturePhoto}
                disabled={!isReady || countdown !== null || isScanning}
                className="relative w-20 h-20 disabled:opacity-50"
              >
                <motion.div
                  animate={isReady && !isScanning ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-[#c4a77d] to-[#9c8f78]"
                  style={{ boxShadow: '0 4px 30px rgba(196, 167, 125, 0.4)' }}
                />
                <div className="absolute inset-1.5 rounded-full bg-[#0a0908]" />
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#e8e0d5] to-[#c4a77d]" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1f1c18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  </svg>
                </div>
              </motion.button>
            )}

            {!error && !isScanning && (
              <p className="text-[#57534e] text-xs">
                Tap to begin body scan
              </p>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
