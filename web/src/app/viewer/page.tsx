"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";

const MeshViewer = dynamic(() => import("@/components/MeshViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0908]">
      <div className="w-10 h-10 border-2 border-[#c4a77d] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const MeasurementChat = dynamic(() => import("@/components/MeasurementChat"), {
  ssr: false,
});

interface Measurement {
  id: string;
  name: string;
  value: number;
  unit: string;
  confidence?: number;
}

const SAMPLE_MEASUREMENTS: Measurement[] = [
  { id: "1", name: "Chest", value: 102, unit: "cm", confidence: 95 },
  { id: "2", name: "Waist", value: 84, unit: "cm", confidence: 94 },
  { id: "3", name: "Hip", value: 98, unit: "cm", confidence: 93 },
  { id: "4", name: "Shoulder Width", value: 46, unit: "cm", confidence: 92 },
  { id: "5", name: "Arm Length", value: 64, unit: "cm", confidence: 91 },
  { id: "6", name: "Inseam", value: 81, unit: "cm", confidence: 90 },
];

export default function ViewerPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>(SAMPLE_MEASUREMENTS);
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [activeLandmarks, setActiveLandmarks] = useState<{ start: string; end: string } | null>(null);

  const handleMeasurementRequest = useCallback((measurement: { name: string; value: number; unit: string }) => {
    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      name: measurement.name,
      value: measurement.value,
      unit: measurement.unit,
      confidence: 88,
    };
    setMeasurements((prev) => [...prev, newMeasurement]);
  }, []);

  const handleLandmarkClick = useCallback((landmark: { id: string; name: string }) => {
    if (!activeLandmarks) {
      setActiveLandmarks({ start: landmark.id, end: "" });
    } else if (!activeLandmarks.end) {
      setActiveLandmarks({ ...activeLandmarks, end: landmark.id });
    } else {
      setActiveLandmarks({ start: landmark.id, end: "" });
    }
  }, [activeLandmarks]);

  const handleExport = useCallback(() => {
    const exportData = {
      exportDate: new Date().toISOString(),
      measurements: measurements.map((m) => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
        confidence: m.confidence,
      })),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `measurements-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [measurements]);

  return (
    <div className="min-h-screen min-h-dvh bg-[#0f0e0c] flex flex-col">
      <header className="safe-area-top border-b border-[#3d3630]/30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 rounded-full liquid-glass flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </motion.button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[#faf9f7]">3D Mesh Viewer</h1>
              <p className="text-xs text-[#78716c]">Client Scan - Dec 12, 2024</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-[14px] liquid-glass-secondary rounded-[16px] text-sm text-[#c4a77d] transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-[14px] liquid-glass-primary rounded-[16px] text-sm text-[#0a0908] font-semibold transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              Share
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex-1 lg:flex-[2]">
          <MeshViewer 
            className="w-full h-[400px] lg:h-full"
            onLandmarkClick={handleLandmarkClick}
            activeMeasurement={activeLandmarks}
          />
        </div>

        <div className="lg:w-[380px] flex flex-col gap-4">
          <div className="bg-[#1f1c18] border border-[#3d3630]/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#faf9f7] font-medium">Measurements</h2>
              <span className="text-xs text-[#78716c]">{measurements.length} total</span>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {measurements.map((m) => (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMeasurement(m.id === selectedMeasurement ? null : m.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedMeasurement === m.id
                      ? "bg-[#c4a77d]/20 border border-[#c4a77d]/30"
                      : "bg-[#2a2520] hover:bg-[#3d3630]/50"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-[#faf9f7] text-sm font-medium">{m.name}</p>
                    {m.confidence && (
                      <p className="text-[#78716c] text-xs">{m.confidence}% confidence</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[#c4a77d] font-semibold">
                      {m.value} <span className="text-sm font-normal">{m.unit}</span>
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <MeasurementChat onMeasurementRequest={handleMeasurementRequest} />

          <div className="bg-[#1f1c18] border border-[#3d3630]/50 rounded-2xl p-4">
            <h3 className="text-[#faf9f7] font-medium text-sm mb-3">Scan Quality</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#2a2520] rounded-xl p-3">
                <p className="text-[#78716c] text-xs mb-1">Coverage</p>
                <p className="text-[#c4a77d] font-semibold">98%</p>
              </div>
              <div className="bg-[#2a2520] rounded-xl p-3">
                <p className="text-[#78716c] text-xs mb-1">Resolution</p>
                <p className="text-[#c4a77d] font-semibold">High</p>
              </div>
              <div className="bg-[#2a2520] rounded-xl p-3">
                <p className="text-[#78716c] text-xs mb-1">QC Score</p>
                <p className="text-[#c4a77d] font-semibold">94%</p>
              </div>
              <div className="bg-[#2a2520] rounded-xl p-3">
                <p className="text-[#78716c] text-xs mb-1">Landmarks</p>
                <p className="text-[#c4a77d] font-semibold">24/24</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
