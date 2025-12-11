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

const MEASUREMENT_POSITIONS: Record<string, { y: number; width: number }> = {
  "chest": { y: 28, width: 65 },
  "waist": { y: 42, width: 52 },
  "hips": { y: 52, width: 60 },
  "inseam": { y: 75, width: 20 },
  "shoulder": { y: 22, width: 70 },
  "sleeve": { y: 32, width: 45 },
  "neck": { y: 15, width: 25 },
  "thigh": { y: 58, width: 35 },
};

function getMeasurementPosition(name: string): { y: number; width: number } {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(MEASUREMENT_POSITIONS)) {
    if (key.includes(k)) return v;
  }
  return { y: 35, width: 50 };
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
      const duration = 1200;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);
        
        if (newProgress < 1) {
          requestAnimationFrame(animate);
        } else if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setTimeout(() => onComplete?.(), 400);
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
      animate={{ opacity: isActive || isCompleted ? 1 : 0.3 }}
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: `${position.y}%` }}
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          className="h-[2px] bg-gradient-to-r from-transparent via-[#c4a77d] to-transparent"
          style={{ 
            width: `${position.width * currentProgress}%`,
            minWidth: currentProgress > 0 ? '20px' : '0px',
          }}
          animate={{
            boxShadow: isActive ? '0 0 10px rgba(196, 167, 125, 0.5)' : 'none'
          }}
        />
        
        {currentProgress > 0 && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute left-0 w-2 h-2 rounded-full bg-[#c4a77d]"
              style={{ left: `${50 - (position.width * currentProgress) / 2}%` }}
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: currentProgress }}
              className="absolute right-0 w-2 h-2 rounded-full bg-[#c4a77d]"
              style={{ right: `${50 - (position.width * currentProgress) / 2}%` }}
            />
          </>
        )}

        {showFull && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <div className="bg-[#1f1c18]/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#c4a77d]/30 shadow-lg">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[#c4a77d] font-bold text-sm">{measurement.value}</span>
                <span className="text-[#9c8f78] text-xs">{measurement.unit}</span>
              </div>
              <div className="text-[#78716c] text-[10px] text-center">{measurement.name}</div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function BodySilhouette({ isAnalyzing }: { isAnalyzing: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.svg
        viewBox="0 0 200 400"
        className="w-full h-full max-w-[200px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c4a77d" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#9c8f78" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#c4a77d" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c4a77d" />
            <stop offset="100%" stopColor="#9c8f78" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d="M 100 30
             C 115 30, 125 40, 125 55
             C 125 70, 115 80, 100 82
             C 85 80, 75 70, 75 55
             C 75 40, 85 30, 100 30
             Z"
          fill="url(#bodyGradient)"
          stroke="url(#strokeGradient)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />

        <motion.path
          d="M 100 82
             L 100 95
             C 100 98, 85 100, 75 105
             L 50 150
             C 45 160, 48 175, 55 180
             L 30 240
             C 28 250, 30 260, 35 262
             L 45 265
             C 50 265, 52 260, 50 255
             L 65 200
             L 75 170
             L 72 180
             L 70 240
             C 68 260, 65 280, 63 300
             L 60 350
             C 58 365, 60 375, 65 378
             L 80 380
             C 85 378, 85 370, 83 360
             L 88 300
             C 90 280, 95 260, 100 250
             C 105 260, 110 280, 112 300
             L 117 360
             C 115 370, 115 378, 120 380
             L 135 378
             C 140 375, 142 365, 140 350
             L 137 300
             C 135 280, 132 260, 130 240
             L 128 180
             L 125 170
             L 135 200
             L 150 255
             C 148 260, 150 265, 155 265
             L 165 262
             C 170 260, 172 250, 170 240
             L 145 180
             C 152 175, 155 160, 150 150
             L 125 105
             C 115 100, 100 98, 100 95
             Z"
          fill="url(#bodyGradient)"
          stroke="url(#strokeGradient)"
          strokeWidth="1.5"
          filter="url(#glow)"
          animate={isAnalyzing ? {
            opacity: [0.6, 1, 0.6],
          } : {}}
          transition={isAnalyzing ? {
            repeat: Infinity,
            duration: 2,
          } : {}}
        />

        {isAnalyzing && (
          <motion.line
            x1="50"
            y1="0"
            x2="150"
            y2="0"
            stroke="#c4a77d"
            strokeWidth="2"
            opacity="0.6"
            animate={{ y1: [0, 400, 0], y2: [0, 400, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            style={{ filter: 'blur(1px)' }}
          />
        )}
      </motion.svg>
    </div>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(196, 167, 125, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196, 167, 125, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#0f0e0c]" />
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
    <div className="w-full h-full relative bg-gradient-to-b from-[#1a1816] to-[#0f0e0c] rounded-2xl overflow-hidden">
      <GridBackground />
      
      <BodySilhouette isAnalyzing={isAnalyzing} />
      
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-[#78716c] text-sm">Ready for measurement</p>
        </motion.div>
      )}

      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
        >
          <div className="bg-[#1f1c18]/90 backdrop-blur-sm px-4 py-2 rounded-full border border-[#c4a77d]/30">
            <p className="text-[#c4a77d] text-sm font-medium flex items-center gap-2">
              <motion.span 
                className="w-2 h-2 bg-[#c4a77d] rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              Measuring {measurements[activeMeasurement!]?.name}...
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
