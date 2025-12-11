"use client";

import { motion } from "framer-motion";

interface Measurement {
  name: string;
  value: number;
  unit: string;
  confidence: number;
}

interface MeasurementProgressProps {
  measurements: Measurement[];
  activeMeasurement: number | null;
  completedMeasurements: number[];
}

export default function MeasurementProgress({
  measurements,
  activeMeasurement,
  completedMeasurements,
}: MeasurementProgressProps) {
  const progress = (completedMeasurements.length / measurements.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Measurements</h3>
        <span className="text-primary-400 text-sm font-medium">
          {completedMeasurements.length}/{measurements.length}
        </span>
      </div>

      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
        />
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {measurements.map((measurement, index) => {
          const isActive = activeMeasurement === index;
          const isCompleted = completedMeasurements.includes(index);

          return (
            <motion.div
              key={measurement.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                isActive
                  ? "bg-primary-500/20 border border-primary-500/50"
                  : isCompleted
                  ? "bg-green-500/10 border border-green-500/30"
                  : "bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? "bg-primary-500 text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    index + 1
                  )}
                </div>

                <div>
                  <p className={`font-medium ${isActive || isCompleted ? "text-white" : "text-white/60"}`}>
                    {measurement.name}
                  </p>
                  {isCompleted && (
                    <p className="text-green-400 text-sm">
                      {measurement.value} {measurement.unit}
                    </p>
                  )}
                </div>
              </div>

              {isCompleted && (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${measurement.confidence * 100}%` }}
                      className="h-full bg-green-400 rounded-full"
                    />
                  </div>
                  <span className="text-xs text-white/40">{Math.round(measurement.confidence * 100)}%</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
