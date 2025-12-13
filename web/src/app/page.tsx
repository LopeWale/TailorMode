"use client";

import { useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const PhotoboothGlassBox = dynamic(() => import("@/components/PhotoboothGlassBox"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#c4a77d] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const MultiAngleCapture = dynamic(() => import("@/components/MultiAngleCapture"), {
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
  type?: string;
}

interface ReconstructionResult {
  success: boolean;
  meshId?: string;
  measurements: Measurement[];
  qcScore: number;
  processingTime: number;
  warnings: string[];
}

type AppState = "home" | "capture" | "processing" | "results";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("home");
  const [analysisResult, setAnalysisResult] = useState<ReconstructionResult | null>(null);
  const [activeMeasurement, setActiveMeasurement] = useState<number | null>(null);
  const [completedMeasurements, setCompletedMeasurements] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCaptureComplete = useCallback(async (captureData: {
    frames: { image: string; angle: string; timestamp: number }[];
    height: number;
    deviceInfo: { hasDepth: boolean; resolution: { width: number; height: number } };
  }) => {
    setAppState("processing");
    setError(null);

    try {
      const response = await fetch("/api/reconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(captureData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Reconstruction failed");
      }

      setAnalysisResult(result);
      setAppState("results");
      
      if (result.measurements && result.measurements.length > 0) {
        setActiveMeasurement(0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process capture");
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
    setAnalysisResult(null);
    setActiveMeasurement(null);
    setCompletedMeasurements([]);
    setError(null);
  }, []);

  const formattedMeasurements = analysisResult?.measurements.map(m => ({
    ...m,
    landmark_start: m.type || "",
    landmark_end: m.type || "",
  })) || [];

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
                  <p className="text-xs text-[#78716c] mt-0.5">3D Body Scanning</p>
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
                  <PhotoboothGlassBox />
                </Suspense>
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center mb-8 max-w-sm"
              >
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#faf9f7] mb-3 tracking-tight">
                  3D Body Scanning
                </h2>
                <p className="text-[#78716c] text-sm leading-relaxed">
                  Multi-angle capture with AI reconstruction for precise tailoring measurements
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

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-3 mb-16 px-6 w-full max-w-sm"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAppState("capture")}
                  className="liquid-glass-primary h-14 px-7 rounded-full font-semibold text-[15px] inline-flex items-center gap-2.5 text-[#1a1816] transition-all duration-200"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  Start 3D Scan
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => window.location.href = '/measure'}
                  className="liquid-glass-secondary h-12 px-6 rounded-full font-medium text-[14px] inline-flex items-center gap-2 text-[#c4a77d] transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                  Tailor Measurements
                </motion.button>
              </motion.div>
            </div>

            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="safe-area-bottom px-6 pb-4"
            >
              <div className="surface-elevated rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  {[
                    { label: "Multi-Angle", desc: "4 views", icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" },
                    { label: "AI Reconstruct", desc: "3D mesh", icon: "M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" },
                    { label: "Measurements", desc: "Precise", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                  ].map((item, index) => (
                    <div key={index} className="flex-1 text-center">
                      <div className="w-8 h-8 mx-auto rounded-full bg-[#c4a77d]/10 flex items-center justify-center mb-1.5">
                        <svg className="w-4 h-4 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                      </div>
                      <p className="text-[#faf9f7] text-[11px] font-medium">{item.label}</p>
                      <p className="text-[#57534e] text-[9px]">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {appState === "capture" && (
          <MultiAngleCapture
            key="capture"
            onCaptureComplete={handleCaptureComplete}
            onClose={resetApp}
          />
        )}

        {appState === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 border-3 border-[#3d3630] border-t-[#c4a77d] rounded-full mb-8"
            />

            <h2 className="text-xl font-semibold text-[#faf9f7] mb-2">AI Reconstruction</h2>
            <p className="text-[#78716c] text-sm text-center max-w-xs mb-8">
              Building 3D mesh and computing measurements...
            </p>

            <div className="space-y-3 w-full max-w-xs">
              {["Photogrammetry processing", "SMPL body fitting", "Computing measurements"].map(
                (step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.5 }}
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
                  <h1 className="text-base font-medium text-[#faf9f7]">Your Measurements</h1>
                  <p className="text-[#57534e] text-xs">
                    QC Score: {analysisResult.qcScore}%
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAppState("capture")}
                  className="w-10 h-10 rounded-full surface-glass flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </motion.button>
              </div>
            </header>

            <div className="flex-1 flex flex-col">
              <div className="px-4 pt-4">
                <div className="surface-elevated rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#c4a77d]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#faf9f7] font-medium text-sm">Scan Complete</p>
                        <p className="text-[#78716c] text-xs">{analysisResult.measurements.length} measurements captured</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#c4a77d] font-semibold">{analysisResult.qcScore}%</p>
                      <p className="text-[#57534e] text-[10px]">accuracy</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {analysisResult.measurements.slice(0, 4).map((m, i) => (
                      <div key={i} className="bg-[#1f1c18]/50 rounded-lg p-3">
                        <p className="text-[#78716c] text-[10px] uppercase tracking-wider">{m.name}</p>
                        <p className="text-[#faf9f7] font-semibold text-lg">{m.value}<span className="text-[#78716c] text-xs ml-1">{m.unit}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 px-4 pb-4 space-y-4 pt-4"
              >
                {analysisResult.warnings.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#c4a77d]/10 border border-[#c4a77d]/30 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#c4a77d] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <div>
                        <p className="text-[#c4a77d] text-sm font-medium">Notes</p>
                        <p className="text-[#a8a29e] text-xs mt-0.5">
                          {analysisResult.warnings.join(". ")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <MeasurementProgress
                  measurements={formattedMeasurements}
                  activeMeasurement={activeMeasurement}
                  completedMeasurements={completedMeasurements}
                />

                <Link 
                  href="/viewer"
                  className="flex items-center justify-between surface-elevated rounded-2xl p-4 group cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c4a77d]/20 to-[#9c8f78]/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#faf9f7] font-medium text-sm">View 3D Model</p>
                      <p className="text-[#78716c] text-xs">Inspect mesh and request measurements</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-[#78716c] group-hover:text-[#c4a77d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>

                {completedMeasurements.length === analysisResult.measurements.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="surface-elevated rounded-2xl p-4"
                  >
                    <h3 className="text-[#faf9f7] font-medium mb-3 text-sm">Summary</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#1f1c18]/50 rounded-xl p-3">
                        <p className="text-[#78716c] text-xs mb-1">Processing Time</p>
                        <p className="text-[#c4a77d] font-semibold">{(analysisResult.processingTime / 1000).toFixed(1)}s</p>
                      </div>
                      <div className="bg-[#1f1c18]/50 rounded-xl p-3">
                        <p className="text-[#78716c] text-xs mb-1">Confidence</p>
                        <p className="text-[#c4a77d] font-semibold">{analysisResult.qcScore}%</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
