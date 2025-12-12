"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MeasurementSelector } from "./MeasurementSelector";
import MultiAngleCapture, { CaptureData } from "./MultiAngleCapture";
import { MeasurementDefinition, MeasurementResult } from "@/lib/measurement-types";

interface CaptureSelection {
  mode: "preset" | "custom";
  presetId?: string;
  customDescription?: string;
  requiredMeasurements: MeasurementDefinition[];
  optionalMeasurements: MeasurementDefinition[];
  captureViews: ("front" | "back" | "left" | "right")[];
  captureGuidance: string;
}

interface CaptureInstructions {
  viewInstructions: Record<string, string>;
  generalGuidance: string;
  poseRequirements: string[];
  clothingRequirements: string[];
}

interface ComputedMeasurementResult {
  measurementId: string;
  name: string;
  value: number;
  unit: "cm" | "in";
  confidence: number;
  computationMethod: string;
}

interface ValidationResult {
  isValid: boolean;
  shouldRecapture: boolean;
  shouldFlag: boolean;
  reason?: string;
  suggestedAction?: string;
}

interface MeasurementCaptureFlowProps {
  onComplete: (results: {
    selection: CaptureSelection;
    measurements: ComputedMeasurementResult[];
    results: MeasurementResult[];
    summary: { total: number; validated: number; needsRecapture: number; flagged: number };
  }) => void;
  onBack?: () => void;
  heightInCm?: number;
}

type FlowStep = "select" | "instructions" | "capture" | "processing" | "results" | "recapture";

export function MeasurementCaptureFlow({ onComplete, onBack, heightInCm }: MeasurementCaptureFlowProps) {
  const [step, setStep] = useState<FlowStep>("select");
  const [selection, setSelection] = useState<CaptureSelection | null>(null);
  const [instructions, setInstructions] = useState<CaptureInstructions | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<Record<string, string>>({});
  const [measurements, setMeasurements] = useState<ComputedMeasurementResult[]>([]);
  const [results, setResults] = useState<MeasurementResult[]>([]);
  const [validations, setValidations] = useState<Record<string, ValidationResult>>({});
  const [summary, setSummary] = useState({ total: 0, validated: 0, needsRecapture: 0, flagged: 0 });
  const [recaptureViews, setRecaptureViews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userHeight, setUserHeight] = useState<number>(heightInCm || 170);

  const handleSelectionComplete = useCallback(async (sel: CaptureSelection) => {
    setSelection(sel);
    setStep("instructions");
    
    try {
      const measurementIds = [
        ...sel.requiredMeasurements.map(m => m.id),
        ...sel.optionalMeasurements.map(m => m.id),
      ];
      
      const response = await fetch("/api/capture-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measurementIds,
          captureViews: sel.captureViews,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate capture instructions");
      }
      
      const data = await response.json();
      setInstructions({
        viewInstructions: data.instructions,
        generalGuidance: data.generalGuidance,
        poseRequirements: data.poseRequirements,
        clothingRequirements: data.clothingRequirements,
      });
    } catch (err) {
      console.error("Failed to fetch instructions:", err);
      setInstructions({
        viewInstructions: {
          front: "Stand facing the camera with arms slightly away from body",
          back: "Turn around, showing your back to the camera",
          left: "Turn to show your left side profile",
          right: "Turn to show your right side profile",
        },
        generalGuidance: sel.captureGuidance,
        poseRequirements: ["Stand straight with feet shoulder-width apart", "Keep arms slightly away from body"],
        clothingRequirements: ["Wear fitted clothing for best results"],
      });
    }
  }, []);

  const handleCaptureComplete = useCallback(async (captureData: CaptureData) => {
    const frames: Record<string, string> = {};
    captureData.frames.forEach(frame => {
      frames[frame.angle] = frame.image;
    });
    setCapturedFrames(frames);
    setUserHeight(captureData.height);
    setStep("processing");
    
    try {
      const measurementIds = selection ? [
        ...selection.requiredMeasurements.map(m => m.id),
        ...selection.optionalMeasurements.map(m => m.id),
      ] : [];
      
      const reconstructResponse = await fetch("/api/reconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames: captureData.frames,
          height: captureData.height,
          deviceInfo: captureData.deviceInfo,
        }),
      });
      
      let meshData = null;
      let landmarks = null;
      
      if (reconstructResponse.ok) {
        const reconstructResult = await reconstructResponse.json();
        if (reconstructResult.success) {
          meshData = reconstructResult.meshData || null;
          landmarks = reconstructResult.landmarks || null;
        }
      }
      
      const response = await fetch("/api/compute-measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measurementIds,
          heightInCm: captureData.height,
          meshData,
          landmarks,
          previousResults: results,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to compute measurements");
      }
      
      const data = await response.json();
      
      setMeasurements(data.measurements);
      setResults(data.results);
      setValidations(data.validations);
      setSummary(data.summary);
      
      if (data.summary.needsRecapture > 0) {
        const viewsToRecapture = new Set<string>();
        for (const [measurementId, validation] of Object.entries(data.validations as Record<string, ValidationResult>)) {
          if (validation.shouldRecapture) {
            const measurement = selection?.requiredMeasurements.find(m => m.id === measurementId) 
              || selection?.optionalMeasurements.find(m => m.id === measurementId);
            if (measurement) {
              measurement.captureRequirements.forEach(v => viewsToRecapture.add(v));
            }
          }
        }
        setRecaptureViews(Array.from(viewsToRecapture));
        setStep("results");
      } else {
        setStep("results");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("results");
    }
  }, [selection, results]);

  const handleRecapture = useCallback(() => {
    setStep("recapture");
  }, []);

  const handleRecaptureComplete = useCallback((captureData: CaptureData) => {
    const newFrames: Record<string, string> = {};
    captureData.frames.forEach(frame => {
      newFrames[frame.angle] = frame.image;
    });
    const mergedCaptureData: CaptureData = {
      frames: [
        ...Object.entries(capturedFrames).map(([angle, image]) => ({ angle, image, timestamp: Date.now() })),
        ...captureData.frames.filter(f => !capturedFrames[f.angle])
      ],
      height: captureData.height,
      deviceInfo: captureData.deviceInfo,
    };
    handleCaptureComplete(mergedCaptureData);
  }, [capturedFrames, handleCaptureComplete]);

  const handleFinish = useCallback(() => {
    if (selection) {
      onComplete({
        selection,
        measurements,
        results,
        summary,
      });
    }
  }, [selection, measurements, results, summary, onComplete]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <AnimatePresence mode="wait">
        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MeasurementSelector
              onSelectionComplete={handleSelectionComplete}
              onBack={onBack}
            />
          </motion.div>
        )}
        
        {step === "instructions" && selection && instructions && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto p-4 pt-8 text-[#e8e0d5]"
          >
            <h1 className="text-2xl font-light mb-2 text-center">Capture Instructions</h1>
            <p className="text-[#9c8f78] text-center mb-6">
              Read these before starting your scan
            </p>
            
            <div className="p-4 rounded-xl bg-[#1f1c18] border border-[#c4a77d]/30 mb-4">
              <div className="text-sm text-[#c4a77d] mb-2">What to Wear</div>
              <ul className="space-y-1">
                {instructions.clothingRequirements.map((req, i) => (
                  <li key={i} className="text-sm text-[#e8e0d5]/80 flex items-start gap-2">
                    <span className="text-[#c4a77d] mt-1">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                        <circle cx="8" cy="8" r="3"/>
                      </svg>
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 rounded-xl bg-[#1f1c18] border border-[#c4a77d]/30 mb-4">
              <div className="text-sm text-[#c4a77d] mb-2">Pose Requirements</div>
              <ul className="space-y-1">
                {instructions.poseRequirements.map((req, i) => (
                  <li key={i} className="text-sm text-[#e8e0d5]/80 flex items-start gap-2">
                    <span className="text-[#c4a77d] mt-1">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                        <circle cx="8" cy="8" r="3"/>
                      </svg>
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 rounded-xl bg-[#1f1c18] border border-[#c4a77d]/30 mb-6">
              <div className="text-sm text-[#c4a77d] mb-2">General Guidance</div>
              <p className="text-sm text-[#e8e0d5]/80">{instructions.generalGuidance}</p>
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-[#9c8f78] mb-3">You'll capture {selection.captureViews.length} views:</div>
              <div className="flex gap-2">
                {selection.captureViews.map((view) => (
                  <div
                    key={view}
                    className="flex-1 p-3 rounded-lg bg-[#1f1c18] border border-[#c4a77d]/20"
                  >
                    <div className="text-xs text-[#c4a77d] capitalize text-center">{view}</div>
                    <div className="text-xs text-[#9c8f78] text-center mt-1">
                      {instructions.viewInstructions[view]?.substring(0, 30)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setStep("capture")}
              className="w-full py-4 rounded-xl bg-[#c4a77d] text-[#0a0a0f] font-medium hover:bg-[#d4b78d] transition-colors"
            >
              Start Capture
            </button>
            
            <button
              onClick={() => setStep("select")}
              className="mt-4 w-full py-3 text-[#9c8f78] hover:text-[#e8e0d5] transition-colors"
            >
              Back
            </button>
          </motion.div>
        )}
        
        {step === "capture" && selection && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MultiAngleCapture
              onCaptureComplete={handleCaptureComplete}
              onClose={() => setStep("instructions")}
            />
          </motion.div>
        )}
        
        {step === "recapture" && selection && (
          <motion.div
            key="recapture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MultiAngleCapture
              onCaptureComplete={handleRecaptureComplete}
              onClose={() => setStep("results")}
            />
          </motion.div>
        )}
        
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-4"
          >
            <div className="w-20 h-20 border-2 border-[#c4a77d]/30 border-t-[#c4a77d] rounded-full animate-spin" />
            <p className="mt-6 text-[#e8e0d5] text-lg">Processing your scan...</p>
            <p className="mt-2 text-[#9c8f78] text-sm">Computing measurements from captured images</p>
          </motion.div>
        )}
        
        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto p-4 pt-8 pb-24 text-[#e8e0d5]"
          >
            <h1 className="text-2xl font-light mb-2 text-center">Measurement Results</h1>
            <p className="text-[#9c8f78] text-center mb-6">
              {summary.validated} of {summary.total} measurements validated
            </p>
            
            {error && (
              <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm mb-4">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#1f1c18] border border-green-500/30 text-center">
                <div className="text-2xl font-light text-green-400">{summary.validated}</div>
                <div className="text-xs text-[#9c8f78]">Validated</div>
              </div>
              <div className="p-3 rounded-lg bg-[#1f1c18] border border-yellow-500/30 text-center">
                <div className="text-2xl font-light text-yellow-400">{summary.needsRecapture}</div>
                <div className="text-xs text-[#9c8f78]">Needs Recapture</div>
              </div>
              {summary.flagged > 0 && (
                <div className="col-span-2 p-3 rounded-lg bg-[#1f1c18] border border-red-500/30 text-center">
                  <div className="text-2xl font-light text-red-400">{summary.flagged}</div>
                  <div className="text-xs text-[#9c8f78]">Flagged for Manual Review</div>
                </div>
              )}
            </div>
            
            <div className="space-y-2 mb-6">
              {measurements.map((m) => {
                const validation = validations[m.measurementId];
                const statusColor = validation?.isValid 
                  ? "border-green-500/30" 
                  : validation?.shouldFlag 
                    ? "border-red-500/30" 
                    : "border-yellow-500/30";
                
                return (
                  <div
                    key={m.measurementId}
                    className={`p-3 rounded-lg bg-[#1f1c18] border ${statusColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{m.name}</div>
                        <div className="text-xs text-[#9c8f78]">
                          Confidence: {(m.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-light">{m.value}</div>
                        <div className="text-xs text-[#9c8f78]">{m.unit}</div>
                      </div>
                    </div>
                    {validation?.suggestedAction && !validation.isValid && (
                      <div className="mt-2 text-xs text-yellow-400">
                        {validation.suggestedAction}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent">
              <div className="max-w-md mx-auto space-y-2">
                {summary.needsRecapture > 0 && (
                  <button
                    onClick={handleRecapture}
                    className="w-full py-3 rounded-xl bg-yellow-600 text-white font-medium hover:bg-yellow-500 transition-colors"
                  >
                    Recapture {recaptureViews.length} View{recaptureViews.length > 1 ? "s" : ""}
                  </button>
                )}
                <button
                  onClick={handleFinish}
                  className="w-full py-4 rounded-xl bg-[#c4a77d] text-[#0a0a0f] font-medium hover:bg-[#d4b78d] transition-colors"
                >
                  {summary.needsRecapture > 0 || summary.flagged > 0 
                    ? "Continue with Current Results" 
                    : "Complete"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
