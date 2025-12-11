"use client";

import { motion } from "framer-motion";

interface Measurement {
  name: string;
  value: number;
  unit: string;
  confidence: number;
}

interface MeasurementSession {
  id: string;
  date: string;
  bodyType: string;
  measurements: Measurement[];
  posture: string;
}

interface MeasurementCardProps {
  session: MeasurementSession;
  isExpanded: boolean;
  onToggle: () => void;
  onExport: () => void;
  onShare: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return "Just now";
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

function getAverageConfidence(measurements: Measurement[]): number {
  if (measurements.length === 0) return 0;
  const total = measurements.reduce((sum, m) => sum + m.confidence, 0);
  return total / measurements.length;
}

export default function MeasurementCard({
  session,
  isExpanded,
  onToggle,
  onExport,
  onShare,
}: MeasurementCardProps) {
  const avgConfidence = getAverageConfidence(session.measurements);
  const keyMeasurements = session.measurements.slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-elevated rounded-2xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-4 text-left focus:outline-none"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#faf9f7] font-medium">{session.bodyType} Build</span>
              <span className="text-[#57534e] text-sm">{formatDate(session.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {keyMeasurements.map((m, i) => (
                <span key={m.name} className="text-[#9c8f78]">
                  {m.name}: {m.value}{m.unit}
                  {i < keyMeasurements.length - 1 && (
                    <span className="text-[#57534e] ml-3">|</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-8 h-8 rounded-full surface-glass flex items-center justify-center ml-3"
          >
            <svg
              className="w-4 h-4 text-[#a8a29e]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </motion.div>
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 space-y-4">
          <div className="h-px bg-[#1f1c18]" />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#9c8f78]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <span className="text-[#78716c]">Posture:</span>
              <span className="text-[#faf9f7]">{session.posture}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#78716c]">Avg. Confidence:</span>
              <span className="text-[#c4a77d] font-medium">{Math.round(avgConfidence * 100)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {session.measurements.map((measurement) => (
              <div
                key={measurement.name}
                className="surface-glass rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#78716c] text-xs">{measurement.name}</span>
                  <span className="text-[#57534e] text-xs">{Math.round(measurement.confidence * 100)}%</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[#faf9f7] text-lg font-medium">{measurement.value}</span>
                  <span className="text-[#9c8f78] text-sm">{measurement.unit}</span>
                </div>
                <div className="mt-2 h-1 bg-[#1f1c18] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${measurement.confidence * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-[#c4a77d] to-[#9c8f78] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
              className="flex-1 py-3 btn-secondary rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="flex-1 py-3 btn-secondary rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                />
              </svg>
              Share
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
