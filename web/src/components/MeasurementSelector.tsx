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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
    </svg>
  ),
  pants: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M5 2h14v4l-2 16h-3l-2-12-2 12H7L5 6V2z"/>
    </svg>
  ),
  dress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M6 2l2 4v4l-4 12h16l-4-12V6l2-4H6z"/>
      <path d="M9 2a3 3 0 006 0"/>
    </svg>
  ),
  jacket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M3 6l3-4h12l3 4v14a2 2 0 01-2 2h-2l-1-6h-2l1 6H9l1-6H8l-1 6H5a2 2 0 01-2-2V6z"/>
      <path d="M9 2a3 3 0 006 0"/>
    </svg>
  ),
  skirt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M6 4h12l2 18H4L6 4z"/>
      <path d="M6 4c0-1.1.9-2 2-2h8a2 2 0 012 2"/>
    </svg>
  ),
  vest: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
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
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e0d5] p-4">
      <AnimatePresence mode="wait">
        {mode === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto pt-8"
          >
            <h1 className="text-2xl font-light mb-2 text-center">What are you measuring for?</h1>
            <p className="text-[#9c8f78] text-center mb-8">
              Choose a preset or describe your garment
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => setMode("preset")}
                className="w-full p-[20px] rounded-[20px] liquid-glass-secondary flex items-center gap-4 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[#c4a77d]/20 flex items-center justify-center text-[#c4a77d]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Choose from presets</div>
                  <div className="text-sm text-[#9c8f78]">Shirt, Pants, Dress, Jacket, Skirt</div>
                </div>
              </button>
              
              <button
                onClick={() => setMode("custom")}
                className="w-full p-[20px] rounded-[20px] liquid-glass-secondary flex items-center gap-4 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[#c4a77d]/20 flex items-center justify-center text-[#c4a77d]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1a7 7 0 01-7 7H9a7 7 0 01-7-7H1a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73A2 2 0 0112 2z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Describe your garment</div>
                  <div className="text-sm text-[#9c8f78]">AI will determine required measurements</div>
                </div>
              </button>
            </div>
            
            {onBack && (
              <button
                onClick={onBack}
                className="mt-8 w-full py-3 text-[#9c8f78] hover:text-[#e8e0d5] transition-colors"
              >
                Back
              </button>
            )}
          </motion.div>
        )}
        
        {mode === "preset" && (
          <motion.div
            key="preset"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto pt-8"
          >
            <h1 className="text-2xl font-light mb-2 text-center">Select garment type</h1>
            <p className="text-[#9c8f78] text-center mb-8">
              Each preset includes standard measurements for that garment
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {Object.values(CLOTHING_PRESETS).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-4 rounded-xl bg-[#1f1c18] border border-[#c4a77d]/30 hover:border-[#c4a77d] transition-colors flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-lg bg-[#c4a77d]/20 flex items-center justify-center text-[#c4a77d]">
                    {presetIcons[preset.icon] || presetIcons.shirt}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{preset.displayName}</div>
                    <div className="text-xs text-[#9c8f78] mt-1">
                      {preset.requiredMeasurements.length} measurements
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setMode("choose")}
              className="mt-8 w-full py-3 text-[#9c8f78] hover:text-[#e8e0d5] transition-colors"
            >
              Back
            </button>
          </motion.div>
        )}
        
        {mode === "custom" && (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto pt-8"
          >
            <h1 className="text-2xl font-light mb-2 text-center">Describe your garment</h1>
            <p className="text-[#9c8f78] text-center mb-8">
              Be specific about style, fit, and any special requirements
            </p>
            
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="e.g., A fitted double-breasted blazer with peak lapels for formal occasions..."
              className="w-full h-32 p-4 rounded-xl bg-[#1f1c18] border border-[#c4a77d]/30 focus:border-[#c4a77d] focus:outline-none resize-none text-[#e8e0d5] placeholder-[#9c8f78]/50"
            />
            
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}
            
            <div className="mt-4 text-sm text-[#9c8f78]">
              <div className="font-medium mb-2">Tips for better results:</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Mention the garment type (shirt, dress, etc.)</li>
                <li>Describe the fit (fitted, relaxed, tailored)</li>
                <li>Note any special features (wide sleeves, high waist)</li>
              </ul>
            </div>
            
            <button
              onClick={handleCustomSubmit}
              disabled={!customDescription.trim()}
              className="mt-6 w-full py-[18px] rounded-[20px] liquid-glass-primary text-[#0a0a0f] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Analyze Requirements
            </button>
            
            <button
              onClick={() => setMode("choose")}
              className="mt-4 w-full py-3 text-[#9c8f78] hover:text-[#e8e0d5] transition-colors"
            >
              Back
            </button>
          </motion.div>
        )}
        
        {mode === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md mx-auto pt-8 flex flex-col items-center justify-center min-h-[60vh]"
          >
            <div className="w-16 h-16 border-2 border-[#c4a77d]/30 border-t-[#c4a77d] rounded-full animate-spin" />
            <p className="mt-6 text-[#9c8f78]">Analyzing garment requirements...</p>
          </motion.div>
        )}
        
        {mode === "review" && aiAnalysis && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto pt-8 pb-24"
          >
            <h1 className="text-2xl font-light mb-2 text-center">
              {aiAnalysis.garmentType}
            </h1>
            <p className="text-[#9c8f78] text-center mb-6">
              Review the measurements we'll capture
            </p>
            
            <div className="p-4 rounded-xl bg-[#1f1c18] border border-[#c4a77d]/30 mb-6">
              <div className="text-sm text-[#c4a77d] mb-2">Capture Guidance</div>
              <p className="text-sm text-[#e8e0d5]/80">{aiAnalysis.captureGuidance}</p>
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-[#c4a77d] mb-3">Required Measurements</div>
              <div className="space-y-2">
                {aiAnalysis.requiredMeasurements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-[#1f1c18] border border-[#c4a77d]/20 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#c4a77d]/20 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#c4a77d]">
                        <path d="M5 12l5 5L20 7"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{m.displayName}</div>
                      <div className="text-xs text-[#9c8f78]">{m.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {aiAnalysis.optionalMeasurements.length > 0 && (
              <div className="mb-6">
                <div className="text-sm text-[#9c8f78] mb-3">Optional Measurements</div>
                <div className="space-y-2">
                  {aiAnalysis.optionalMeasurements.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleOptional(m.id)}
                      className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                        includedOptional.has(m.id)
                          ? "bg-[#c4a77d]/20 border-[#c4a77d]/50"
                          : "bg-[#1f1c18] border-[#c4a77d]/10 hover:border-[#c4a77d]/30"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        includedOptional.has(m.id) ? "bg-[#c4a77d]/30" : "bg-[#c4a77d]/10"
                      }`}>
                        {includedOptional.has(m.id) ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#c4a77d]">
                            <path d="M5 12l5 5L20 7"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#9c8f78]">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{m.displayName}</div>
                        <div className="text-xs text-[#9c8f78]">{m.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <div className="text-sm text-[#9c8f78] mb-3">Capture Views Required</div>
              <div className="flex gap-2">
                {aiAnalysis.captureViews.map((view) => (
                  <div
                    key={view}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#1f1c18] border border-[#c4a77d]/20 text-center"
                  >
                    <div className="text-xs text-[#c4a77d] capitalize">{view}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent">
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleConfirmSelection}
                  className="w-full py-[18px] rounded-[20px] liquid-glass-primary text-[#0a0a0f] font-semibold transition-all duration-300"
                >
                  Start Capture ({aiAnalysis.requiredMeasurements.length + includedOptional.size} measurements)
                </button>
                <button
                  onClick={() => {
                    setMode(selectedPreset ? "preset" : "custom");
                    setAiAnalysis(null);
                    setIncludedOptional(new Set());
                  }}
                  className="mt-2 w-full py-3 text-[#9c8f78] hover:text-[#e8e0d5] transition-colors"
                >
                  Change Selection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
