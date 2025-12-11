"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface MeasurementInput {
  name: string;
  key: string;
  placeholder: string;
  icon: string;
}

const MEASUREMENTS: MeasurementInput[] = [
  { name: "Chest", key: "chest", placeholder: "e.g., 96", icon: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" },
  { name: "Waist", key: "waist", placeholder: "e.g., 82", icon: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" },
  { name: "Hips", key: "hips", placeholder: "e.g., 100", icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" },
  { name: "Inseam", key: "inseam", placeholder: "e.g., 78", icon: "M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" },
  { name: "Shoulder Width", key: "shoulder", placeholder: "e.g., 45", icon: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" },
  { name: "Sleeve Length", key: "sleeve", placeholder: "e.g., 64", icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" },
];

interface ManualMeasurementProps {
  onComplete: (measurements: Record<string, number>) => void;
  onClose: () => void;
}

export default function ManualMeasurement({ onComplete, onClose }: ManualMeasurementProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const handleChange = (key: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setValues(prev => ({ ...prev, [key]: numericValue }));
  };

  const handleNext = () => {
    if (currentStep < MEASUREMENTS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const numericValues: Record<string, number> = {};
    Object.entries(values).forEach(([key, val]) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        numericValues[key] = num;
      }
    });
    
    if (Object.keys(numericValues).length >= 3) {
      onComplete(numericValues);
    }
  };

  const completedCount = Object.values(values).filter(v => v && parseFloat(v) > 0).length;
  const canSubmit = completedCount >= 3;
  const current = MEASUREMENTS[currentStep];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0f0e0c] flex flex-col"
    >
      <header className="safe-area-top">
        <div className="flex items-center justify-between p-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1f1c18] border border-[#3d3630]/50 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>

          <div className="text-center">
            <h1 className="text-[#faf9f7] font-semibold">Manual Entry</h1>
            <p className="text-[#78716c] text-xs">{completedCount} of {MEASUREMENTS.length} completed</p>
          </div>

          <div className="w-10" />
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-1">
            {MEASUREMENTS.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  idx < currentStep ? 'bg-[#c4a77d]' :
                  idx === currentStep ? 'bg-[#9c8f78]' : 'bg-[#2a2520]'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#1f1c18] to-[#2a2520] border border-[#3d3630]/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={current.icon} />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold text-[#faf9f7] text-center mb-2">
            {current.name}
          </h2>
          <p className="text-[#78716c] text-sm text-center mb-8">
            Enter your {current.name.toLowerCase()} measurement in centimeters
          </p>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={values[current.key] || ''}
              onChange={(e) => handleChange(current.key, e.target.value)}
              placeholder={current.placeholder}
              className="w-full text-center text-4xl font-bold py-6 bg-[#1f1c18] border-2 border-[#3d3630] rounded-2xl text-[#faf9f7] placeholder:text-[#3d3630] focus:border-[#c4a77d] focus:outline-none transition-colors"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#78716c] text-xl font-medium">
              cm
            </span>
          </div>

          <p className="text-[#57534e] text-xs text-center mt-4">
            Use a measuring tape for best accuracy
          </p>
        </motion.div>
      </div>

      <div className="safe-area-bottom p-6 space-y-4">
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1 py-4 rounded-xl bg-[#1f1c18] border border-[#3d3630] text-[#a8a29e] font-medium disabled:opacity-30"
          >
            Previous
          </motion.button>
          
          {currentStep < MEASUREMENTS.length - 1 ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="flex-1 py-4 rounded-xl btn-primary font-medium"
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 py-4 rounded-xl btn-primary font-medium disabled:opacity-50"
            >
              Complete
            </motion.button>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full text-center text-[#78716c] text-sm disabled:opacity-30"
        >
          Skip remaining and finish with {completedCount} measurements
        </button>
      </div>
    </motion.div>
  );
}
