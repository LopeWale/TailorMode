"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MeasurementCard from "@/components/MeasurementCard";

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

export default function HistoryPage() {
  const [sessions, setSessions] = useState<MeasurementSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeasurements() {
      try {
        const response = await fetch("/api/measurements");
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch measurements");
        }

        setSessions(result.data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchMeasurements();
  }, []);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleExport = useCallback((session: MeasurementSession) => {
    const data = {
      date: new Date(session.date).toLocaleString(),
      bodyType: session.bodyType,
      posture: session.posture,
      measurements: session.measurements.map((m) => ({
        name: m.name,
        value: `${m.value} ${m.unit}`,
        confidence: `${Math.round(m.confidence * 100)}%`,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `measurements-${session.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleShare = useCallback(async (session: MeasurementSession) => {
    const text = `My Measurements (${session.bodyType} build)\n\n${session.measurements
      .map((m) => `${m.name}: ${m.value}${m.unit}`)
      .join("\n")}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "TailorMode Measurements",
          text,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Measurements copied to clipboard");
    }
  }, []);

  return (
    <main className="min-h-screen min-h-dvh flex flex-col bg-[#0f0e0c]">
      <header className="safe-area-top relative z-10">
        <div className="flex items-center justify-between px-6 py-5">
          <Link href="/">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full surface-glass flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 text-[#a8a29e]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </motion.button>
          </Link>

          <div className="text-center">
            <h1 className="text-lg font-semibold text-[#faf9f7]">History</h1>
            <p className="text-xs text-[#78716c]">Past measurements</p>
          </div>

          <div className="w-10" />
        </div>
      </header>

      <div className="flex-1 px-6 pb-6">
        {loading && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#c4a77d] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-glass rounded-xl p-4 border border-red-500/20"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full surface-glass flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-[#78716c]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-[#faf9f7] font-medium mb-2">No measurements yet</h3>
            <p className="text-[#78716c] text-sm mb-6 max-w-xs">
              Start a new scan to capture your first measurement session
            </p>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2"
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
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                </svg>
                Start Scan
              </motion.button>
            </Link>
          </motion.div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#78716c] text-sm">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const allData = sessions.map((s) => ({
                    date: new Date(s.date).toLocaleString(),
                    bodyType: s.bodyType,
                    posture: s.posture,
                    measurements: s.measurements,
                  }));
                  const blob = new Blob([JSON.stringify(allData, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "all-measurements.json";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="text-[#c4a77d] text-sm font-medium flex items-center gap-1"
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
                Export All
              </motion.button>
            </div>

            <AnimatePresence>
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MeasurementCard
                    session={session}
                    isExpanded={expandedId === session.id}
                    onToggle={() => handleToggle(session.id)}
                    onExport={() => handleExport(session)}
                    onShare={() => handleShare(session)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="safe-area-bottom px-6 pb-4">
        <Link href="/" className="block">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 btn-primary rounded-xl font-medium text-sm flex items-center justify-center gap-2"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New Measurement
          </motion.button>
        </Link>
      </div>
    </main>
  );
}
