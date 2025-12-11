"use client";

import { useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const HumanModel = dynamic(() => import("@/components/HumanModel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const result = await response.json();
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
      }, 500);
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
    <main className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        {appState === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <header className="safe-area-top">
              <div className="flex items-center justify-between p-6">
                <div>
                  <h1 className="text-2xl font-bold gradient-text">TailorMode</h1>
                  <p className="text-white/60 text-sm">3D Body Measurement</p>
                </div>
                <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-16">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative w-64 h-80 mb-8"
              >
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                }>
                  <HumanModel measurements={[]} activeMeasurement={null} />
                </Suspense>
                
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute inset-0 rounded-full bg-primary-500/10 blur-3xl -z-10"
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold text-white mb-3">
                  Precision Measurements
                </h2>
                <p className="text-white/60 max-w-xs mx-auto">
                  Use your camera to capture body measurements with AI-powered accuracy
                </p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAppState("camera")}
                className="relative group w-full max-w-xs"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl text-white font-semibold text-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Start Capture
                </div>
              </motion.button>
            </div>

            <div className="safe-area-bottom p-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: "📸", label: "Capture", desc: "Take a photo" },
                  { icon: "🤖", label: "AI Analysis", desc: "Gemini powered" },
                  { icon: "📐", label: "3D Preview", desc: "Visual results" },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="glass rounded-xl p-3 text-center"
                  >
                    <div className="text-2xl mb-1">{feature.icon}</div>
                    <div className="text-white text-xs font-medium">{feature.label}</div>
                    <div className="text-white/40 text-[10px]">{feature.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
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
            className="flex-1 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-20 h-20 mb-8"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#spinnerGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="200"
                  strokeDashoffset="50"
                />
              </svg>
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Image</h2>
            <p className="text-white/60 text-center">
              AI is processing your body measurements...
            </p>

            <div className="mt-8 space-y-2">
              {["Detecting body landmarks", "Calculating proportions", "Generating measurements"].map(
                (step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.5 }}
                    className="flex items-center gap-3 text-white/70"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: index * 0.3 }}
                      className="w-2 h-2 rounded-full bg-primary-500"
                    />
                    {step}
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
            className="flex-1 flex flex-col"
          >
            <header className="safe-area-top">
              <div className="flex items-center justify-between p-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={resetApp}
                  className="w-10 h-10 rounded-full glass flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </motion.button>

                <h1 className="text-lg font-semibold text-white">Measurement Results</h1>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAppState("camera")}
                  className="w-10 h-10 rounded-full glass flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </motion.button>
              </div>
            </header>

            <div className="flex-1 relative">
              <div className="h-[45vh] min-h-[300px]">
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent pt-8 pb-6 px-4 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="glass rounded-xl px-4 py-2">
                    <span className="text-white/60 text-xs">Body Type</span>
                    <p className="text-white font-semibold">{analysisResult.bodyType}</p>
                  </div>
                  <div className="glass rounded-xl px-4 py-2 flex-1">
                    <span className="text-white/60 text-xs">Posture</span>
                    <p className="text-white font-semibold text-sm">{analysisResult.posture}</p>
                  </div>
                </div>

                <MeasurementProgress
                  measurements={analysisResult.measurements}
                  activeMeasurement={activeMeasurement}
                  completedMeasurements={completedMeasurements}
                />

                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass rounded-2xl p-4"
                  >
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <span className="text-lg">💡</span> Recommendations
                    </h3>
                    <ul className="space-y-1">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index} className="text-white/70 text-sm flex items-start gap-2">
                          <span className="text-primary-400 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="safe-area-bottom p-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Measurements
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
