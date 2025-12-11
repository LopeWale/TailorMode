"use client";

import { useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const HumanModel = dynamic(() => import("@/components/HumanModel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#c4a77d] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const CameraCapture = dynamic(() => import("@/components/CameraCapture"), {
  ssr: false,
});

const MeasurementProgress = dynamic(() => import("@/components/MeasurementProgress"), {
  ssr: false,
});

interface Measurement {
  name: string;
  value: number;
  unit: string;
  confidence: number;
  landmark_start: string;
  landmark_end: string;
}

interface AnalysisResult {
  measurements: Measurement[];
  bodyType: string;
  posture: string;
  recommendations: string[];
}

type AppState = "home" | "camera" | "analyzing" | "results";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("home");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeMeasurement, setActiveMeasurement] = useState<number | null>(null);
  const [completedMeasurements, setCompletedMeasurements] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async (imageData: string) => {
    setCapturedImage(imageData);
    setAppState("analyzing");
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Analysis failed");
      }

      setAnalysisResult(result);
      setAppState("results");
      
      if (result.measurements && result.measurements.length > 0) {
        setActiveMeasurement(0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze image");
      setAppState("home");
    }
  }, []);

  const handleMeasurementComplete = useCallback((index: number) => {
    setCompletedMeasurements((prev) => [...prev, index]);
    
    if (analysisResult && index < analysisResult.measurements.length - 1) {
      setTimeout(() => {
        setActiveMeasurement(index + 1);
      }, 300);
    } else {
      setActiveMeasurement(null);
    }
  }, [analysisResult]);

  const resetApp = useCallback(() => {
    setAppState("home");
    setCapturedImage(null);
    setAnalysisResult(null);
    setActiveMeasurement(null);
    setCompletedMeasurements([]);
    setError(null);
  }, []);

  return (
    <main className="min-h-screen min-h-dvh flex flex-col bg-[#0f0e0c]">
      <AnimatePresence mode="wait">
        {appState === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <header className="safe-area-top relative z-10">
              <div className="flex items-center justify-between px-6 py-5">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-[#faf9f7]">
                    Tailor<span className="text-[#c4a77d]">Mode</span>
                  </h1>
                  <p className="text-xs text-[#78716c] mt-0.5">Body Measurement</p>
                </div>
                <button className="w-10 h-10 rounded-full surface-glass flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </button>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[280px] aspect-[3/4] mb-6"
              >
                <div className="absolute inset-0 bg-gradient-radial from-[#c4a77d]/5 via-transparent to-transparent rounded-full blur-3xl" />
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-[#c4a77d] border-t-transparent rounded-full animate-spin" />
                  </div>
                }>
                  <HumanModel measurements={[]} activeMeasurement={null} isInteractive={true} />
                </Suspense>
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center mb-8 max-w-sm"
              >
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#faf9f7] mb-3 tracking-tight">
                  Precision Measurements
                </h2>
                <p className="text-[#78716c] text-sm leading-relaxed">
                  AI-powered body scanning with your camera. Accurate results in seconds.
                </p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 px-4 py-3 surface-glass rounded-xl border border-red-500/20 max-w-sm w-full"
                >
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </motion.div>
              )}

              <motion.button
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAppState("camera")}
                className="btn-primary w-full max-w-sm py-4 rounded-xl font-medium text-base flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                Begin Scan
              </motion.button>
            </div>

            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="safe-area-bottom px-6 pb-4"
            >
              <div className="surface-elevated rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  {[
                    { label: "Capture", desc: "Quick scan", icon: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" },
                    { label: "Analyze", desc: "AI powered", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" },
                    { label: "Results", desc: "3D preview", icon: "M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" },
                  ].map((feature) => (
                    <div key={feature.label} className="flex-1 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[#1f1c18] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                        </svg>
                      </div>
                      <p className="text-[#faf9f7] text-xs font-medium">{feature.label}</p>
                      <p className="text-[#57534e] text-[10px]">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {appState === "camera" && (
          <CameraCapture
            onCapture={handleCapture}
            onClose={() => setAppState("home")}
          />
        )}

        {appState === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0f0e0c]"
          >
            <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 rounded-full border border-[#c4a77d]/20" />
              <div className="absolute inset-2 rounded-full border border-[#c4a77d]/30" />
              <div className="absolute inset-4 rounded-full border border-[#c4a77d]/40" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#c4a77d]" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                className="absolute inset-4"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#d4c4a8]" />
              </motion.div>
            </div>

            <h2 className="text-xl font-semibold text-[#faf9f7] mb-2">Processing Scan</h2>
            <p className="text-[#78716c] text-sm text-center max-w-xs">
              Analyzing body structure and calculating measurements
            </p>

            <div className="mt-10 space-y-3 w-full max-w-xs">
              {["Detecting landmarks", "Computing proportions", "Generating results"].map(
                (step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.4 }}
                    className="flex items-center gap-3 surface-glass rounded-xl px-4 py-3"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.2 }}
                      className="w-2 h-2 rounded-full bg-[#c4a77d]"
                    />
                    <span className="text-[#a8a29e] text-sm">{step}</span>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}

        {appState === "results" && analysisResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col bg-[#0f0e0c]"
          >
            <header className="safe-area-top relative z-10">
              <div className="flex items-center justify-between px-4 py-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={resetApp}
                  className="w-10 h-10 rounded-full surface-glass flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </motion.button>

                <div className="text-center">
                  <h1 className="text-base font-medium text-[#faf9f7]">Scan Results</h1>
                  <p className="text-[#57534e] text-xs">{analysisResult.bodyType} build</p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAppState("camera")}
                  className="w-10 h-10 rounded-full surface-glass flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </motion.button>
              </div>
            </header>

            <div className="flex-1 flex flex-col">
              <div className="h-[40vh] min-h-[280px] relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f0e0c] pointer-events-none z-10" />
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-[#c4a77d] border-t-transparent rounded-full animate-spin" />
                  </div>
                }>
                  <HumanModel
                    measurements={analysisResult.measurements}
                    activeMeasurement={activeMeasurement}
                    onMeasurementComplete={handleMeasurementComplete}
                  />
                </Suspense>
              </div>

              <motion.div
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 px-4 pb-4 space-y-4 -mt-8 relative z-20"
              >
                <MeasurementProgress
                  measurements={analysisResult.measurements}
                  activeMeasurement={activeMeasurement}
                  completedMeasurements={completedMeasurements}
                />

                {completedMeasurements.length === analysisResult.measurements.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="surface-elevated rounded-2xl p-4"
                  >
                    <h3 className="text-[#faf9f7] font-medium mb-3 text-sm">Analysis Summary</h3>
                    <div className="space-y-2">
                      {analysisResult.recommendations.slice(0, 2).map((rec, index) => (
                        <p key={index} className="text-[#78716c] text-xs leading-relaxed flex items-start gap-2">
                          <span className="text-[#c4a77d] mt-0.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          {rec}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="safe-area-bottom px-4 pb-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 btn-primary rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export Measurements
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
