"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

interface MultiAngleCaptureProps {
  onCaptureComplete: (captures: CaptureData) => void;
  onClose: () => void;
}

interface CaptureFrame {
  image: string;
  angle: string;
  timestamp: number;
}

export interface CaptureData {
  frames: CaptureFrame[];
  height: number;
  deviceInfo: {
    hasDepth: boolean;
    resolution: { width: number; height: number };
  };
}

const CAPTURE_ANGLES = [
  { id: "front", label: "Front View", instruction: "Face the camera directly", angle: 0 },
  { id: "left", label: "Left Side", instruction: "Turn 90° to your left", angle: 90 },
  { id: "back", label: "Back View", instruction: "Turn to face away from camera", angle: 180 },
  { id: "right", label: "Right Side", instruction: "Turn 90° to your right", angle: 270 },
];

type CaptureStep = "height" | "instructions" | "capture" | "processing";

function ScrollWheel({ 
  values, 
  selectedValue, 
  onChange,
  suffix,
}: { 
  values: number[];
  selectedValue: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 56;
  const visibleItems = 5;
  const centerOffset = Math.floor(visibleItems / 2);
  
  const selectedIndex = values.indexOf(selectedValue);
  const scrollY = useMotionValue(-selectedIndex * itemHeight);

  useEffect(() => {
    const newIndex = values.indexOf(selectedValue);
    animate(scrollY, -newIndex * itemHeight, { type: "spring", stiffness: 300, damping: 30 });
  }, [selectedValue, values, scrollY, itemHeight]);

  const handleDrag = useCallback((_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    const currentY = scrollY.get();
    const newY = currentY + info.velocity.y * 0.1;
    const newIndex = Math.round(-newY / itemHeight);
    const clampedIndex = Math.max(0, Math.min(values.length - 1, newIndex));
    onChange(values[clampedIndex]);
  }, [scrollY, itemHeight, values, onChange]);

  return (
    <div className="relative h-[280px] overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `linear-gradient(to bottom, 
            #0a0908 0%, 
            transparent 35%, 
            transparent 65%, 
            #0a0908 100%
          )`,
        }}
      />
      
      <div 
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[56px] pointer-events-none z-5"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(196,167,125,0.1), transparent)",
          borderTop: "1px solid rgba(196,167,125,0.2)",
          borderBottom: "1px solid rgba(196,167,125,0.2)",
        }}
      />

      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ 
          top: -(values.length - 1) * itemHeight, 
          bottom: 0 
        }}
        dragElastic={0.1}
        onDragEnd={handleDrag}
        style={{ y: scrollY }}
        className="absolute left-0 right-0"
        initial={false}
      >
        <div style={{ height: centerOffset * itemHeight }} />
        {values.map((value, index) => {
          const isSelected = value === selectedValue;
          return (
            <motion.div
              key={value}
              onClick={() => onChange(value)}
              className="h-[56px] flex items-center justify-center cursor-pointer"
            >
              <span 
                className={`text-3xl font-light transition-all duration-200 ${
                  isSelected 
                    ? "text-[#faf9f7] scale-110" 
                    : "text-[#78716c]/60 scale-90"
                }`}
              >
                {value}{suffix && <span className="text-lg ml-1 text-[#c4a77d]/60">{suffix}</span>}
              </span>
            </motion.div>
          );
        })}
        <div style={{ height: centerOffset * itemHeight }} />
      </motion.div>
    </div>
  );
}

function HeightInput({ 
  onSubmit, 
  onBack 
}: { 
  onSubmit: (height: number) => void;
  onBack: () => void;
}) {
  const [unit, setUnit] = useState<"cm" | "ft">("cm");
  const [heightCm, setHeightCm] = useState(170);
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(7);
  const lastChangedBy = useRef<"cm" | "ft" | null>(null);

  const cmValues = Array.from({ length: 121 }, (_, i) => 120 + i);
  const feetValues = Array.from({ length: 5 }, (_, i) => 4 + i);
  const inchValues = Array.from({ length: 12 }, (_, i) => i);

  const handleCmChange = useCallback((value: number) => {
    lastChangedBy.current = "cm";
    setHeightCm(value);
    const totalInches = Math.round(value / 2.54);
    setFeet(Math.floor(totalInches / 12));
    setInches(totalInches % 12);
  }, []);

  const handleFeetChange = useCallback((value: number) => {
    lastChangedBy.current = "ft";
    setFeet(value);
    setHeightCm(Math.round((value * 12 + inches) * 2.54));
  }, [inches]);

  const handleInchesChange = useCallback((value: number) => {
    lastChangedBy.current = "ft";
    setInches(value);
    setHeightCm(Math.round((feet * 12 + value) * 2.54));
  }, [feet]);

  useEffect(() => {
    if (unit === "ft" && lastChangedBy.current !== "ft") {
      const totalInches = Math.round(heightCm / 2.54);
      setFeet(Math.floor(totalInches / 12));
      setInches(totalInches % 12);
    }
    lastChangedBy.current = null;
  }, [unit]);

  const handleSubmit = () => {
    if (heightCm >= 100 && heightCm <= 250) {
      onSubmit(heightCm);
    }
  };

  const displayHeight = unit === "cm" 
    ? `${heightCm} cm` 
    : `${feet}'${inches}"`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0908] flex flex-col"
    >
      <header className="safe-area-top">
        <div className="flex items-center justify-between p-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-[#1f1c18]/80 backdrop-blur-xl border border-[#3d3630]/50 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-[#e8e0d5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </motion.button>
          <span className="text-[#e8e0d5] text-sm font-semibold">Scale Calibration</span>
          <div className="w-11" />
        </div>
      </header>

      <div className="flex-1 flex flex-col px-6 pt-4 pb-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c4a77d]/20 to-[#9c8f78]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-[#faf9f7] mb-2">Your Height</h2>
          <p className="text-[#78716c] text-sm max-w-xs mx-auto">
            Scroll to select your height for accurate measurements
          </p>
        </div>

        <div className="flex gap-2 p-1 bg-[#1f1c18] rounded-xl mb-4 max-w-xs mx-auto w-full">
          <button
            onClick={() => setUnit("cm")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              unit === "cm" 
                ? "bg-[#c4a77d] text-[#1f1c18] shadow-lg" 
                : "text-[#78716c] hover:text-[#a8a29e]"
            }`}
          >
            Centimeters
          </button>
          <button
            onClick={() => setUnit("ft")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              unit === "ft" 
                ? "bg-[#c4a77d] text-[#1f1c18] shadow-lg" 
                : "text-[#78716c] hover:text-[#a8a29e]"
            }`}
          >
            Feet & Inches
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {unit === "cm" ? (
              <motion.div
                key="cm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full max-w-[200px]"
              >
                <ScrollWheel
                  values={cmValues}
                  selectedValue={heightCm}
                  onChange={handleCmChange}
                  suffix="cm"
                />
              </motion.div>
            ) : (
              <motion.div
                key="ft"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-4 items-center"
              >
                <div className="w-[100px]">
                  <ScrollWheel
                    values={feetValues}
                    selectedValue={feet}
                    onChange={handleFeetChange}
                    suffix="ft"
                  />
                </div>
                <div className="text-[#c4a77d]/40 text-2xl font-light">:</div>
                <div className="w-[100px]">
                  <ScrollWheel
                    values={inchValues}
                    selectedValue={inches}
                    onChange={handleInchesChange}
                    suffix="in"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-auto space-y-4">
          <div className="text-center">
            <motion.div 
              key={displayHeight}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1f1c18] rounded-full border border-[#3d3630]/50"
            >
              <svg className="w-4 h-4 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[#faf9f7] font-medium">{displayHeight}</span>
            </motion.div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="w-full py-4 btn-primary rounded-xl font-medium text-base"
          >
            Continue
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function CaptureInstructions({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0908] flex flex-col"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#c4a77d]/20 to-[#9c8f78]/10 flex items-center justify-center mb-8">
          <svg className="w-12 h-12 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-[#faf9f7] mb-3 text-center">Multi-Angle Capture</h2>
        <p className="text-[#78716c] text-sm text-center mb-8 max-w-xs">
          We will guide you through 4 angles for accurate 3D reconstruction
        </p>

        <div className="w-full max-w-sm space-y-3 mb-8">
          {[
            { icon: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z", title: "Wear form-fitting clothes", desc: "Avoid loose or baggy clothing" },
            { icon: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z", title: "Good lighting", desc: "Ensure even lighting without shadows" },
            { icon: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z", title: "2 meters distance", desc: "Stand back for full body capture" },
            { icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99", title: "Rotate as guided", desc: "Follow on-screen rotation prompts" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 bg-[#1f1c18]/50 border border-[#3d3630]/30 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-[#c4a77d]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <div>
                <h4 className="text-[#faf9f7] font-medium text-sm">{item.title}</h4>
                <p className="text-[#78716c] text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="w-full max-w-sm py-4 btn-primary rounded-xl font-medium text-base"
        >
          Start Capture
        </motion.button>
      </div>
    </motion.div>
  );
}

function AngleCapture({
  currentAngle,
  totalAngles,
  angle,
  onCapture,
  onClose,
}: {
  currentAngle: number;
  totalAngles: number;
  angle: typeof CAPTURE_ANGLES[0];
  onCapture: (image: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => setIsReady(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capture = useCallback(() => {
    setCountdown(3);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          
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
    <div className="fixed inset-0 z-50 bg-[#0a0908]">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-transparent to-[#0a0908]/60" />
        </div>

        <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
          <div className="flex items-center justify-between p-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-[#1f1c18]/80 backdrop-blur-xl border border-[#3d3630]/50 flex items-center justify-center pointer-events-auto"
            >
              <svg className="w-5 h-5 text-[#e8e0d5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            <div className="bg-[#1f1c18]/80 backdrop-blur-xl border border-[#3d3630]/50 px-5 py-2.5 rounded-full">
              <span className="text-[#e8e0d5] text-sm font-semibold">{currentAngle + 1} / {totalAngles}</span>
            </div>

            <div className="w-11" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 safe-area-bottom">
          <div className="px-6 pb-8">
            <div className="text-center mb-8">
              <h3 className="text-[#faf9f7] font-semibold text-xl mb-2">{angle.label}</h3>
              <p className="text-[#a8a29e] text-sm">{angle.instruction}</p>
            </div>

            <div className="flex items-center gap-2 justify-center mb-6">
              {CAPTURE_ANGLES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i < currentAngle
                      ? "w-8 bg-[#c4a77d]"
                      : i === currentAngle
                      ? "w-12 bg-[#c4a77d]"
                      : "w-8 bg-[#3d3630]"
                  }`}
                />
              ))}
            </div>

            {countdown !== null ? (
              <div className="flex justify-center">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-bold text-[#c4a77d]"
                >
                  {countdown}
                </motion.div>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={capture}
                disabled={!isReady}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#c4a77d] to-[#9c8f78] flex items-center justify-center shadow-lg disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full border-4 border-[#1f1c18]/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#1f1c18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  </svg>
                </div>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingView({ frameCount }: { frameCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#0a0908] flex flex-col items-center justify-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-16 h-16 border-3 border-[#3d3630] border-t-[#c4a77d] rounded-full mb-8"
      />
      
      <h2 className="text-xl font-semibold text-[#faf9f7] mb-2">Processing Capture</h2>
      <p className="text-[#78716c] text-sm text-center max-w-xs">
        Uploading {frameCount} frames for 3D reconstruction...
      </p>
    </motion.div>
  );
}

export default function MultiAngleCapture({ onCaptureComplete, onClose }: MultiAngleCaptureProps) {
  const [step, setStep] = useState<CaptureStep>("height");
  const [height, setHeight] = useState<number>(0);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [frames, setFrames] = useState<CaptureFrame[]>([]);

  const handleHeightSubmit = (h: number) => {
    setHeight(h);
    setStep("instructions");
  };

  const handleStartCapture = () => {
    setStep("capture");
  };

  const handleAngleCapture = (image: string) => {
    const newFrame: CaptureFrame = {
      image,
      angle: CAPTURE_ANGLES[currentAngle].id,
      timestamp: Date.now(),
    };
    
    const updatedFrames = [...frames, newFrame];
    setFrames(updatedFrames);

    if (currentAngle < CAPTURE_ANGLES.length - 1) {
      setCurrentAngle(currentAngle + 1);
    } else {
      setStep("processing");
      
      setTimeout(() => {
        onCaptureComplete({
          frames: updatedFrames,
          height,
          deviceInfo: {
            hasDepth: false,
            resolution: { width: 1920, height: 1080 },
          },
        });
      }, 2000);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {step === "height" && (
        <HeightInput key="height" onSubmit={handleHeightSubmit} onBack={onClose} />
      )}
      {step === "instructions" && (
        <CaptureInstructions key="instructions" onStart={handleStartCapture} />
      )}
      {step === "capture" && (
        <AngleCapture
          key={`capture-${currentAngle}`}
          currentAngle={currentAngle}
          totalAngles={CAPTURE_ANGLES.length}
          angle={CAPTURE_ANGLES[currentAngle]}
          onCapture={handleAngleCapture}
          onClose={onClose}
        />
      )}
      {step === "processing" && (
        <ProcessingView key="processing" frameCount={frames.length} />
      )}
    </AnimatePresence>
  );
}
