"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";

const mockUser = {
  name: "Alex Thompson",
  email: "alex.thompson@email.com",
  avatar: null,
  memberSince: "January 2024",
};

const mockPreferences = {
  units: "Imperial",
  defaultView: "3D Model",
  autoSave: true,
};

const mockTailors = [
  { id: 1, name: "Elite Tailors", location: "New York, NY", connected: "2 weeks ago" },
  { id: 2, name: "Precision Fit Studio", location: "Los Angeles, CA", connected: "1 month ago" },
];

export default function ProfilePage() {
  return (
    <main className="min-h-screen min-h-dvh flex flex-col bg-[#0f0e0c] pb-24">
      <header className="safe-area-top relative z-10">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#faf9f7]">
              Profile
            </h1>
            <p className="text-xs text-[#78716c] mt-0.5">Manage your account</p>
          </div>
          <button className="w-10 h-10 rounded-full surface-glass flex items-center justify-center">
            <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 px-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="surface-elevated rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c4a77d] to-[#9c8f78] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#1f1c18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#faf9f7]">{mockUser.name}</h2>
              <p className="text-sm text-[#78716c]">{mockUser.email}</p>
              <p className="text-xs text-[#57534e] mt-1">Member since {mockUser.memberSince}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="surface-elevated rounded-2xl p-5"
        >
          <h3 className="text-sm font-medium text-[#faf9f7] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Measurement Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a8a29e]">Units</span>
              <span className="text-sm text-[#faf9f7] surface-glass px-3 py-1.5 rounded-lg">{mockPreferences.units}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a8a29e]">Default View</span>
              <span className="text-sm text-[#faf9f7] surface-glass px-3 py-1.5 rounded-lg">{mockPreferences.defaultView}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a8a29e]">Auto-save Scans</span>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${mockPreferences.autoSave ? 'bg-[#c4a77d]' : 'bg-[#3d372e]'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#faf9f7] transition-transform ${mockPreferences.autoSave ? 'left-5' : 'left-1'}`} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="surface-elevated rounded-2xl p-5"
        >
          <h3 className="text-sm font-medium text-[#faf9f7] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Connected Tailors
          </h3>
          <div className="space-y-3">
            {mockTailors.map((tailor) => (
              <div key={tailor.id} className="surface-glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#faf9f7]">{tailor.name}</p>
                  <p className="text-xs text-[#78716c]">{tailor.location}</p>
                  <p className="text-xs text-[#57534e] mt-0.5">Connected {tailor.connected}</p>
                </div>
                <button className="w-8 h-8 rounded-lg surface-glass flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            ))}
            <button className="w-full py-3 surface-glass rounded-xl text-sm text-[#c4a77d] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Tailor
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          <button className="w-full py-4 surface-glass rounded-xl text-sm text-[#faf9f7] flex items-center justify-center gap-3">
            <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            Help & Support
          </button>
          <button className="w-full py-4 surface-elevated rounded-xl text-sm text-red-400 flex items-center justify-center gap-3 border border-red-500/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Log Out
          </button>
        </motion.div>
      </div>

      <Navigation />
    </main>
  );
}
