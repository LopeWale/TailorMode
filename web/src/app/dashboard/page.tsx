"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";

const mockClients = [
  { id: 1, name: "Michael Chen", lastMeasurement: "2 hours ago", measurements: 5, status: "active" },
  { id: 2, name: "Sarah Johnson", lastMeasurement: "1 day ago", measurements: 3, status: "active" },
  { id: 3, name: "David Williams", lastMeasurement: "3 days ago", measurements: 8, status: "pending" },
  { id: 4, name: "Emma Davis", lastMeasurement: "1 week ago", measurements: 2, status: "active" },
];

const mockRecentMeasurements = [
  { id: 1, clientName: "Michael Chen", type: "Full Body Scan", date: "Today, 2:30 PM", status: "new" },
  { id: 2, clientName: "Sarah Johnson", type: "Upper Body", date: "Yesterday, 11:15 AM", status: "viewed" },
  { id: 3, clientName: "David Williams", type: "Full Body Scan", date: "Dec 8, 4:45 PM", status: "viewed" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "measurements">("overview");

  return (
    <main className="min-h-screen min-h-dvh flex flex-col bg-[#0f0e0c] pb-24">
      <header className="safe-area-top relative z-10">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#faf9f7]">
              Tailor<span className="text-[#c4a77d]">Dashboard</span>
            </h1>
            <p className="text-xs text-[#78716c] mt-0.5">Manage your clients</p>
          </div>
          <button className="w-10 h-10 rounded-full surface-glass flex items-center justify-center">
            <svg className="w-5 h-5 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
        </div>
      </header>

      <div className="px-6 mb-4">
        <div className="surface-glass rounded-xl p-1 flex">
          {[
            { id: "overview", label: "Overview" },
            { id: "clients", label: "Clients" },
            { id: "measurements", label: "Measurements" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#c4a77d] text-[#1f1c18]"
                  : "text-[#78716c]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 space-y-6 overflow-y-auto">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="surface-elevated rounded-2xl p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1f1c18] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-semibold text-[#faf9f7]">{mockClients.length}</p>
                <p className="text-xs text-[#78716c]">Total Clients</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="surface-elevated rounded-2xl p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1f1c18] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                  </svg>
                </div>
                <p className="text-2xl font-semibold text-[#faf9f7]">18</p>
                <p className="text-xs text-[#78716c]">Total Measurements</p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="surface-elevated rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#faf9f7]">Recent Measurements</h3>
                <button className="text-xs text-[#c4a77d]">View All</button>
              </div>
              <div className="space-y-3">
                {mockRecentMeasurements.map((measurement) => (
                  <div key={measurement.id} className="surface-glass rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c4a77d]/20 to-[#9c8f78]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#faf9f7]">{measurement.clientName}</p>
                        <p className="text-xs text-[#78716c]">{measurement.type}</p>
                        <p className="text-xs text-[#57534e]">{measurement.date}</p>
                      </div>
                    </div>
                    {measurement.status === "new" && (
                      <span className="px-2 py-1 rounded-full bg-[#c4a77d]/20 text-[#c4a77d] text-xs">New</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="surface-elevated rounded-2xl p-5"
            >
              <h3 className="text-sm font-medium text-[#faf9f7] mb-4">Share Measurement Link</h3>
              <p className="text-xs text-[#78716c] mb-4">Generate a link for clients to submit their measurements</p>
              <button className="w-full py-3 btn-primary rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                Generate Link
              </button>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "clients" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="surface-glass rounded-xl p-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-[#78716c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search clients..."
                className="flex-1 bg-transparent text-sm text-[#faf9f7] placeholder-[#57534e] outline-none"
              />
            </div>

            {mockClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="surface-elevated rounded-2xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c4a77d] to-[#9c8f78] flex items-center justify-center">
                      <span className="text-[#1f1c18] font-semibold text-sm">
                        {client.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#faf9f7]">{client.name}</p>
                      <p className="text-xs text-[#78716c]">{client.measurements} measurements</p>
                      <p className="text-xs text-[#57534e]">Last: {client.lastMeasurement}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.status === "pending" && (
                      <span className="px-2 py-1 rounded-full bg-[#c4a77d]/20 text-[#c4a77d] text-xs">Pending</span>
                    )}
                    <button className="w-8 h-8 rounded-lg surface-glass flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            <button className="w-full py-4 surface-glass rounded-xl text-sm text-[#c4a77d] flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Add New Client
            </button>
          </motion.div>
        )}

        {activeTab === "measurements" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["All", "Today", "This Week", "This Month"].map((filter) => (
                <button
                  key={filter}
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
                    filter === "All" ? "bg-[#c4a77d] text-[#1f1c18]" : "surface-glass text-[#a8a29e]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {[...mockRecentMeasurements, ...mockRecentMeasurements].map((measurement, index) => (
              <motion.div
                key={`${measurement.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="surface-elevated rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c4a77d]/20 to-[#9c8f78]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#faf9f7]">{measurement.clientName}</p>
                      <p className="text-xs text-[#78716c]">{measurement.type}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#57534e]">{measurement.date}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 surface-glass rounded-xl text-xs text-[#faf9f7] flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View
                  </button>
                  <button className="flex-1 py-2.5 surface-glass rounded-xl text-xs text-[#faf9f7] flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export
                  </button>
                  <button className="flex-1 py-2.5 surface-glass rounded-xl text-xs text-[#faf9f7] flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                    Share
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Navigation />
    </main>
  );
}
