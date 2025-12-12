"use client";

import { useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CLOTHING_PRESETS, 
  getMeasurementsForPreset,
  getOptionalMeasurementsForPreset,
  ClothingPreset,
  MeasurementDefinition 
} from "@/lib/measurement-types";

interface MeasurementSelectorProps {
  onSelectionComplete: (selection: {
    mode: "preset" | "custom";
    presetId?: string;
    customDescription?: string;
    requiredMeasurements: MeasurementDefinition[];
    optionalMeasurements: MeasurementDefinition[];
    captureViews: ("front" | "back" | "left" | "right")[];
    captureGuidance: string;
  }) => void;
  onBack?: () => void;
}

type SelectionMode = "choose" | "preset" | "custom" | "loading" | "review";

const presetIcons: Record<string, ReactNode> = {
  shirt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
    </svg>
  ),
  pants: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M5 2h14v4l-2 16h-3l-2-12-2 12H7L5 6V2z"/>
    </svg>
  ),
  dress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M6 2l2 4v4l-4 12h16l-4-12V6l2-4H6z"/>
      <path d="M9 2a3 3 0 006 0"/>
    </svg>
  ),
  jacket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M3 6l3-4h12l3 4v14a2 2 0 01-2 2h-2l-1-6h-2l1 6H9l1-6H8l-1 6H5a2 2 0 01-2-2V6z"/>
      <path d="M9 2a3 3 0 006 0"/>
    </svg>
  ),
  skirt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M6 4h12l2 18H4L6 4z"/>
      <path d="M6 4c0-1.1.9-2 2-2h8a2 2 0 012 2"/>
    </svg>
  ),
  vest: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M16 2a4 4 0 01-8 0"/>
      <path d="M6 4v16a2 2 0 002 2h8a2 2 0 002-2V4l-2-2H8L6 4z"/>
    </svg>
  ),
};

export function MeasurementSelector({ onSelectionComplete, onBack }: MeasurementSelectorProps) {
  const [mode, setMode] = useState<SelectionMode>("choose");
  const [selectedPreset, setSelectedPreset] = useState<ClothingPreset | null>(null);
  const [customDescription, setCustomDescription] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<{
    requiredMeasurements: MeasurementDefinition[];
    optionalMeasurements: MeasurementDefinition[];
    captureViews: ("front" | "back" | "left" | "right")[];
    captureGuidance: string;
    garmentType: string;
  } | null>(null);
  const [includedOptional, setIncludedOptional] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handlePresetSelect = useCallback((preset: ClothingPreset) => {
    setSelectedPreset(preset);
    setAiAnalysis({
      requiredMeasurements: getMeasurementsForPreset(preset.id),
      optionalMeasurements: getOptionalMeasurementsForPreset(preset.id),
      captureViews: preset.captureViews,
      captureGuidance: preset.fitGuidance,
      garmentType: preset.displayName,
    });
    setMode("review");
  }, []);

  const handleCustomSubmit = useCallback(async () => {
    if (!customDescription.trim()) return;
    
    setMode("loading");
    setError(null);
    
    try {
      const response = await fetch("/api/analyze-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: customDescription }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze garment description");
      }
      
      const analysis = await response.json();
      
      setAiAnalysis({
        requiredMeasurements: analysis.requiredMeasurements,
        optionalMeasurements: analysis.optionalMeasurements,
        captureViews: analysis.captureViews,
        captureGuidance: analysis.captureGuidance,
        garmentType: analysis.garmentType,
      });
      setMode("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setMode("custom");
    }
  }, [customDescription]);

  const handleConfirmSelection = useCallback(() => {
    if (!aiAnalysis) return;
    
    const allRequired = [...aiAnalysis.requiredMeasurements];
    const selectedOptional = aiAnalysis.optionalMeasurements.filter(m => includedOptional.has(m.id));
    
    onSelectionComplete({
      mode: selectedPreset ? "preset" : "custom",
      presetId: selectedPreset?.id,
      customDescription: selectedPreset ? undefined : customDescription,
      requiredMeasurements: allRequired,
      optionalMeasurements: selectedOptional,
      captureViews: aiAnalysis.captureViews,
      captureGuidance: aiAnalysis.captureGuidance,
    });
  }, [aiAnalysis, selectedPreset, customDescription, includedOptional, onSelectionComplete]);

  const toggleOptional = (measurementId: string) => {
    setIncludedOptional(prev => {
      const next = new Set(prev);
      if (next.has(measurementId)) {
        next.delete(measurementId);
      } else {
        next.add(measurementId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen min-h-dvh bg-[#0f0e0c] text-[#faf9f7]">
      <AnimatePresence mode="wait">
        {mode === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col min-h-screen min-h-dvh"
          >
            <header className="safe-area-top px-6 py-5">
              {onBack && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="w-10 h-10 rounded-full liquid-glass-secondary flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </motion.button>
              )}
            </header>

            <div className="flex-1 flex flex-col px-6 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-10"
              >
                <h1 className="text-2xl font-semibold tracking-tight mb-2">What are you measuring for?</h1>
                <p className="text-[#78716c] text-sm">Choose a preset or describe your garment</p>
              </motion.div>
              
              <div className="space-y-4 max-w-md mx-auto w-full">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode("preset")}
                  className="w-full p-5 rounded-2xl liquid-glass-secondary flex items-center gap-4 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#c4a77d]/15 flex items-center justify-center text-[#c4a77d]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-[15px] text-[#faf9f7]">Choose from presets</div>
                    <div className="text-sm text-[#78716c] mt-0.5">Shirt, Pants, Dress, Jacket, Skirt</div>
                  </div>
                  <svg className="w-5 h-5 text-[#78716c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode("custom")}
                  className="w-full p-5 rounded-2xl liquid-glass-secondary flex items-center gap-4 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#c4a77d]/15 flex items-center justify-center text-[#c4a77d]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                      <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-[15px] text-[#faf9f7]">Describe your garment</div>
                    <div className="text-sm text-[#78716c] mt-0.5">AI will determine measurements</div>
                  </div>
                  <svg className="w-5 h-5 text-[#78716c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        
        {mode === "preset" && (
          <motion.div
            key="preset"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col min-h-screen min-h-dvh"
          >
            <header className="safe-area-top px-6 py-5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode("choose")}
                className="w-10 h-10 rounded-full liquid-glass-secondary flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </motion.button>
            </header>

            <div className="flex-1 px-6 pt-4 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <h1 className="text-2xl font-semibold tracking-tight mb-2">Select garment type</h1>
                <p className="text-[#78716c] text-sm">Each preset includes standard measurements</p>
              </motion.div>
              
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {Object.values(CLOTHING_PRESETS).map((preset, index) => (
                  <motion.button
                    key={preset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePresetSelect(preset)}
                    className="p-5 rounded-2xl liquid-glass-secondary flex flex-col items-center gap-3 transition-all duration-200"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#c4a77d]/15 flex items-center justify-center text-[#c4a77d]">
                      {presetIcons[preset.icon] || presetIcons.shirt}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-[15px] text-[#faf9f7]">{preset.displayName}</div>
                      <div className="text-xs text-[#78716c] mt-1">
                        {preset.requiredMeasurements.length} measurements
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {mode === "custom" && (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col min-h-screen min-h-dvh"
          >
            <header className="safe-area-top px-6 py-5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode("choose")}
                className="w-10 h-10 rounded-full liquid-glass-secondary flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </motion.button>
            </header>

            <div className="flex-1 px-6 pt-4 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <h1 className="text-2xl font-semibold tracking-tight mb-2">Describe your garment</h1>
                <p className="text-[#78716c] text-sm">Be specific about style, fit, and requirements</p>
              </motion.div>
              
              <div className="max-w-md mx-auto space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="e.g., A fitted double-breasted blazer with peak lapels for formal occasions..."
                    className="w-full h-36 p-4 rounded-2xl liquid-glass text-[#faf9f7] placeholder-[#78716c]/60 focus:outline-none focus:ring-2 focus:ring-[#c4a77d]/30 resize-none text-[15px] leading-relaxed"
                  />
                </motion.div>
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-2xl liquid-glass-secondary"
                >
                  <div className="text-sm text-[#c4a77d] font-medium mb-3">Tips for better results</div>
                  <ul className="space-y-2 text-sm text-[#a8a29e]">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c4a77d]/60 mt-1.5 flex-shrink-0" />
                      <span>Mention the garment type (shirt, dress, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c4a77d]/60 mt-1.5 flex-shrink-0" />
                      <span>Describe the fit (fitted, relaxed, tailored)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c4a77d]/60 mt-1.5 flex-shrink-0" />
                      <span>Note any special features (wide sleeves, high waist)</span>
                    </li>
                  </ul>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center pt-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCustomSubmit}
                    disabled={!customDescription.trim()}
                    className="liquid-glass-primary h-14 px-8 rounded-full font-semibold text-[15px] inline-flex items-center gap-2.5 text-[#1a1816] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                    </svg>
                    Analyze Requirements
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
        
        {mode === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen min-h-dvh px-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-14 h-14 border-2 border-[#3d3630] border-t-[#c4a77d] rounded-full"
            />
            <p className="mt-6 text-[#78716c] text-sm">Analyzing garment requirements...</p>
          </motion.div>
        )}
        
        {mode === "review" && aiAnalysis && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col min-h-screen min-h-dvh"
          >
            <header className="safe-area-top px-6 py-5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setMode(selectedPreset ? "preset" : "custom");
                  setAiAnalysis(null);
                  setIncludedOptional(new Set());
                }}
                className="w-10 h-10 rounded-full liquid-glass-secondary flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </motion.button>
            </header>

            <div className="flex-1 px-6 pt-4 pb-32 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <h1 className="text-2xl font-semibold tracking-tight mb-2">{aiAnalysis.garmentType}</h1>
                <p className="text-[#78716c] text-sm">Review measurements to capture</p>
              </motion.div>
              
              <div className="max-w-md mx-auto space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-4 rounded-2xl liquid-glass-secondary"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#c4a77d]/15 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#c4a77d]">Capture Guidance</span>
                  </div>
                  <p className="text-sm text-[#a8a29e] leading-relaxed">{aiAnalysis.captureGuidance}</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-sm text-[#c4a77d] font-medium mb-3">Required Measurements</div>
                  <div className="space-y-2">
                    {aiAnalysis.requiredMeasurements.map((m, index) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + index * 0.03 }}
                        className="p-4 rounded-xl liquid-glass-secondary flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#c4a77d]/20 flex items-center justify-center flex-shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-[#c4a77d]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[15px] text-[#faf9f7]">{m.displayName}</div>
                          <div className="text-xs text-[#78716c] mt-0.5">{m.type}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                
                {aiAnalysis.optionalMeasurements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <div className="text-sm text-[#78716c] font-medium mb-3">Optional Measurements</div>
                    <div className="space-y-2">
                      {aiAnalysis.optionalMeasurements.map((m, index) => (
                        <motion.button
                          key={m.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleOptional(m.id)}
                          className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                            includedOptional.has(m.id)
                              ? "liquid-glass-secondary ring-1 ring-[#c4a77d]/40"
                              : "liquid-glass-secondary opacity-70"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            includedOptional.has(m.id) ? "bg-[#c4a77d]/25" : "bg-[#3d3630]/50"
                          }`}>
                            {includedOptional.has(m.id) ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-[#c4a77d]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#78716c]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className={`font-medium text-[15px] ${includedOptional.has(m.id) ? "text-[#faf9f7]" : "text-[#a8a29e]"}`}>{m.displayName}</div>
                            <div className="text-xs text-[#78716c] mt-0.5">{m.type}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-sm text-[#78716c] font-medium mb-3">Capture Views Required</div>
                  <div className="flex gap-2">
                    {aiAnalysis.captureViews.map((view) => (
                      <div
                        key={view}
                        className="flex-1 py-3 px-4 rounded-xl liquid-glass-secondary text-center"
                      >
                        <div className="text-sm text-[#c4a77d] font-medium capitalize">{view}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0f0e0c] via-[#0f0e0c]/95 to-transparent safe-area-bottom">
              <div className="max-w-md mx-auto">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmSelection}
                  className="liquid-glass-primary h-14 w-full rounded-full font-semibold text-[15px] flex items-center justify-center gap-2.5 text-[#1a1816] transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  Start Capture ({aiAnalysis.requiredMeasurements.length + includedOptional.size} measurements)
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
