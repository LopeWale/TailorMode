"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <main className="min-h-screen min-h-dvh flex flex-col bg-[#0f0e0c]">
      <header className="safe-area-top relative z-10 border-b border-[#c4a77d]/10">
        <div className="flex items-center justify-between px-4 py-4">
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </motion.button>
          </Link>

          <div className="text-center">
            <h1 className="text-base font-medium text-[#faf9f7]">
              Tailor<span className="text-[#c4a77d]">Mode</span> Assistant
            </h1>
            <p className="text-[#57534e] text-xs">AI Tailoring Advisor</p>
          </div>

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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
              />
            </svg>
          </motion.button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <ChatInterface
          placeholder="Ask about measurements, fit, or tailoring..."
        />
      </motion.div>
    </main>
  );
}
