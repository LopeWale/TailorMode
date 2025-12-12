"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

const MEASUREMENT_POSITIONS: Record<string, { y: number; width: number; side?: "left" | "right" }> = {
  "chest": { y: 32, width: 72 },
  "waist": { y: 44, width: 58 },
  "hips": { y: 54, width: 68 },
  "inseam": { y: 72, width: 18, side: "right" },
  "shoulder": { y: 24, width: 82 },
  "sleeve": { y: 36, width: 40, side: "left" },
  "arm": { y: 36, width: 40, side: "left" },
  "neck": { y: 17, width: 22 },
  "thigh": { y: 62, width: 32 },
};

function getMeasurementPosition(name: string): { y: number; width: number; side?: "left" | "right" } {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(MEASUREMENT_POSITIONS)) {
    if (key.includes(k)) return v;
  }
  return { y: 40, width: 50 };
}

function MeasurementLine({ 
  measurement, 
  index, 
  isActive, 
  isCompleted,
  onComplete 
}: { 
  measurement: Measurement;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onComplete?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const hasCompletedRef = useRef(false);
  const position = getMeasurementPosition(measurement.name);

  useEffect(() => {
    if (isActive && !hasCompletedRef.current) {
      const duration = 800;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);
        
        if (newProgress < 1) {
          requestAnimationFrame(animate);
        } else if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setTimeout(() => onComplete?.(), 300);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isActive, onComplete]);

  useEffect(() => {
    if (!isActive && !isCompleted) {
      setProgress(0);
      hasCompletedRef.current = false;
    }
  }, [isActive, isCompleted]);

  const showFull = isCompleted || (isActive && progress === 1);
  const currentProgress = isCompleted ? 1 : progress;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive || isCompleted ? 1 : 0.2 }}
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ top: `${position.y}%` }}
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          className="h-[3px] rounded-full"
          style={{ 
            width: `${position.width * currentProgress * 1.8}px`,
            background: isActive 
              ? 'linear-gradient(90deg, rgba(196,167,125,0) 0%, #c4a77d 50%, rgba(196,167,125,0) 100%)'
              : 'linear-gradient(90deg, rgba(196,167,125,0) 0%, rgba(196,167,125,0.6) 50%, rgba(196,167,125,0) 100%)',
            boxShadow: isActive ? '0 0 20px rgba(196,167,125,0.6), 0 0 40px rgba(196,167,125,0.3)' : 'none'
          }}
        />
        
        {currentProgress > 0.1 && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute w-2.5 h-2.5 rounded-full border-2 border-[#c4a77d] bg-[#0f0e0c]"
              style={{ 
                left: `calc(50% - ${position.width * currentProgress * 0.9}px)`,
                boxShadow: isActive ? '0 0 10px rgba(196,167,125,0.8)' : 'none'
              }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: currentProgress, opacity: 1 }}
              className="absolute w-2.5 h-2.5 rounded-full border-2 border-[#c4a77d] bg-[#0f0e0c]"
              style={{ 
                right: `calc(50% - ${position.width * currentProgress * 0.9}px)`,
                boxShadow: isActive ? '0 0 10px rgba(196,167,125,0.8)' : 'none'
              }}
            />
          </>
        )}

        <AnimatePresence>
          {showFull && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
            >
              <div 
                className="px-3 py-1.5 rounded-xl backdrop-blur-md"
                style={{
                  background: 'linear-gradient(135deg, rgba(31,28,24,0.95) 0%, rgba(15,14,12,0.98) 100%)',
                  border: '1px solid rgba(196,167,125,0.3)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-[#c4a77d] font-semibold text-base">{measurement.value}</span>
                  <span className="text-[#9c8f78] text-xs">{measurement.unit}</span>
                </div>
                <div className="text-[#78716c] text-[10px] text-center font-medium">{measurement.name}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PremiumBodyModel({ isAnalyzing }: { isAnalyzing: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.svg
        viewBox="0 0 280 520"
        className="w-full h-full max-w-[240px] max-h-[420px]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <defs>
          <linearGradient id="bodyFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4c4a8" stopOpacity="0.15" />
            <stop offset="30%" stopColor="#c4a77d" stopOpacity="0.12" />
            <stop offset="70%" stopColor="#9c8f78" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#8b7355" stopOpacity="0.08" />
          </linearGradient>
          
          <linearGradient id="bodyStroke" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4c4a8" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#c4a77d" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#9c8f78" stopOpacity="0.5" />
            <stop offset="75%" stopColor="#c4a77d" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#d4c4a8" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="innerGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#c4a77d" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#c4a77d" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#c4a77d" stopOpacity="0.2" />
          </linearGradient>
          
          <radialGradient id="headGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#d4c4a8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#9c8f78" stopOpacity="0.05" />
          </radialGradient>

          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feOffset dx="0" dy="2"/>
            <feGaussianBlur stdDeviation="3"/>
            <feComposite operator="out" in="SourceGraphic"/>
            <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0.5 0"/>
            <feBlend in="SourceGraphic"/>
          </filter>

          <clipPath id="bodyClip">
            <path d="M140 45 C165 45, 182 65, 182 92 C182 119, 165 136, 140 140 C115 136, 98 119, 98 92 C98 65, 115 45, 140 45 Z
                     M140 140 L140 155 C165 160, 195 175, 210 200 L235 270 C242 290, 238 310, 228 320 L205 380 C200 395, 205 405, 215 410
                     L225 412 C232 412, 235 405, 232 395 L245 340 C248 325, 255 305, 252 285 L230 220 
                     M140 140 L140 155 C115 160, 85 175, 70 200 L45 270 C38 290, 42 310, 52 320 L75 380 C80 395, 75 405, 65 410
                     L55 412 C48 412, 45 405, 48 395 L35 340 C32 325, 25 305, 28 285 L50 220
                     M120 250 L115 330 C112 370, 108 410, 105 450 L100 490 C98 505, 102 515, 112 518 L132 515 C140 512, 142 502, 140 490
                     L145 430 C148 400, 140 350, 140 320
                     M160 250 L165 330 C168 370, 172 410, 175 450 L180 490 C182 505, 178 515, 168 518 L148 515 C140 512, 138 502, 140 490
                     L135 430 C132 400, 140 350, 140 320" />
          </clipPath>
        </defs>

        <motion.ellipse
          cx="140"
          cy="92"
          rx="42"
          ry="48"
          fill="url(#headGlow)"
          stroke="url(#bodyStroke)"
          strokeWidth="2"
          filter="url(#softGlow)"
          animate={isAnalyzing ? { opacity: [0.8, 1, 0.8] } : {}}
          transition={isAnalyzing ? { repeat: Infinity, duration: 2 } : {}}
        />

        <motion.path
          d="M140 140 
             Q140 148, 140 155
             C105 162, 75 185, 55 225
             L32 295
             C26 318, 32 342, 45 352
             L52 360
             C58 365, 65 360, 62 350
             L78 300
             L95 255
             L88 285
             L82 360
             C78 400, 75 445, 72 485
             L68 510
             C65 528, 72 542, 88 545
             L118 540
             C130 536, 132 522, 128 505
             L135 430
             L140 350
             L145 430
             L152 505
             C148 522, 150 536, 162 540
             L192 545
             C208 542, 215 528, 212 510
             L208 485
             C205 445, 202 400, 198 360
             L192 285
             L185 255
             L202 300
             L218 350
             C215 360, 222 365, 228 360
             L235 352
             C248 342, 254 318, 248 295
             L225 225
             C205 185, 175 162, 140 155
             Q140 148, 140 140
             Z"
          fill="url(#bodyFill)"
          stroke="url(#bodyStroke)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter="url(#softGlow)"
          animate={isAnalyzing ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={isAnalyzing ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } : {}}
        />

        <motion.path
          d="M100 178 Q140 195, 180 178"
          fill="none"
          stroke="url(#bodyStroke)"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        <motion.path
          d="M95 230 Q140 250, 185 230"
          fill="none"
          stroke="url(#bodyStroke)"
          strokeWidth="1"
          strokeOpacity="0.25"
        />
        <motion.path
          d="M108 290 Q140 305, 172 290"
          fill="none"
          stroke="url(#bodyStroke)"
          strokeWidth="1"
          strokeOpacity="0.2"
        />

        {isAnalyzing && (
          <motion.rect
            x="40"
            y="0"
            width="200"
            height="6"
            fill="url(#bodyStroke)"
            opacity="0.4"
            rx="3"
            animate={{ y: [0, 520, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            style={{ filter: 'blur(2px)' }}
          />
        )}

        <motion.circle
          cx="100"
          cy="178"
          r="3"
          fill="#c4a77d"
          opacity="0.6"
        />
        <motion.circle
          cx="180"
          cy="178"
          r="3"
          fill="#c4a77d"
          opacity="0.6"
        />
        <motion.circle
          cx="95"
          cy="232"
          r="2.5"
          fill="#c4a77d"
          opacity="0.5"
        />
        <motion.circle
          cx="185"
          cy="232"
          r="2.5"
          fill="#c4a77d"
          opacity="0.5"
        />
        <motion.circle
          cx="108"
          cy="292"
          r="2.5"
          fill="#c4a77d"
          opacity="0.4"
        />
        <motion.circle
          cx="172"
          cy="292"
          r="2.5"
          fill="#c4a77d"
          opacity="0.4"
        />
      </motion.svg>
    </div>
  );
}

function PremiumBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 50%, rgba(196,167,125,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 50% 30%, rgba(156,143,120,0.04) 0%, transparent 50%),
            linear-gradient(180deg, rgba(31,28,24,1) 0%, rgba(15,14,12,1) 50%, rgba(10,10,15,1) 100%)
          `
        }}
      />
      
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(196,167,125,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196,167,125,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(10,10,15,0.8) 100%)'
        }}
      />
    </div>
  );
}

export default function HumanModel({ 
  measurements, 
  activeMeasurement, 
  onMeasurementComplete, 
  isInteractive = true 
}: HumanModelProps) {
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set());
  const isAnalyzing = activeMeasurement !== null && !completedIndices.has(measurements.length - 1);

  const handleComplete = (index: number) => {
    setCompletedIndices(prev => new Set([...prev, index]));
    onMeasurementComplete?.(index);
  };

  useEffect(() => {
    if (measurements.length === 0) {
      setCompletedIndices(new Set());
    }
  }, [measurements]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl">
      <PremiumBackground />
      
      <PremiumBodyModel isAnalyzing={isAnalyzing} />
      
      <div className="absolute inset-0">
        <AnimatePresence>
          {measurements.map((measurement, index) => (
            <MeasurementLine
              key={`${measurement.name}-${index}`}
              measurement={measurement}
              index={index}
              isActive={activeMeasurement === index}
              isCompleted={completedIndices.has(index)}
              onComplete={() => handleComplete(index)}
            />
          ))}
        </AnimatePresence>
      </div>

      {measurements.length === 0 && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-[#78716c] text-sm font-light tracking-wide">Ready for measurement</p>
        </motion.div>
      )}

      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <div 
            className="px-5 py-2.5 rounded-full backdrop-blur-md"
            style={{
              background: 'linear-gradient(135deg, rgba(31,28,24,0.9) 0%, rgba(15,14,12,0.95) 100%)',
              border: '1px solid rgba(196,167,125,0.25)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
            }}
          >
            <p className="text-[#c4a77d] text-sm font-medium flex items-center gap-2.5">
              <motion.span 
                className="w-1.5 h-1.5 bg-[#c4a77d] rounded-full"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
              <span className="tracking-wide">Measuring {measurements[activeMeasurement!]?.name}</span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
