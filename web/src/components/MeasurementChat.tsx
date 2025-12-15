"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  measurements?: {
    name: string;
    value: number;
    unit: string;
  }[];
  timestamp: Date;
}

interface MeasurementChatProps {
  onMeasurementRequest?: (measurement: { name: string; value: number; unit: string }) => void;
  className?: string;
}

const QUICK_PROMPTS = [
  "Measure chest circumference",
  "What's the waist size?",
  "Shoulder to shoulder width",
  "Inseam length",
  "Arm length",
];

export default function MeasurementChat({ onMeasurementRequest, className }: MeasurementChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I can help you take measurements from this scan. Try asking for specific measurements like \"chest circumference\" or \"shoulder width\".",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const validatedMeasurements = Array.isArray(data.measurements)
        ? data.measurements.filter((m: unknown): m is { name: string; value: number; unit: string } => {
            if (typeof m !== "object" || m === null) return false;
            const obj = m as Record<string, unknown>;
            return (
              typeof obj.name === "string" &&
              typeof obj.value === "number" &&
              typeof obj.unit === "string" &&
              obj.name.length > 0 &&
              obj.value > 0 &&
              obj.unit.length > 0
            );
          })
        : [];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.error || "I couldn't process that request.",
        measurements: validatedMeasurements.length > 0 ? validatedMeasurements : undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (validatedMeasurements.length > 0 && onMeasurementRequest) {
        validatedMeasurements.forEach((m: { name: string; value: number; unit: string }) => {
          onMeasurementRequest(m);
        });
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <motion.div
      layout
      className={`bg-[#1f1c18] border border-[#3d3630]/50 rounded-2xl overflow-hidden flex flex-col ${className || ""}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 hover:bg-[#2a2520]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#c4a77d]/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#c4a77d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-[#faf9f7] font-medium text-sm">Measurement Assistant</h3>
            <p className="text-[#78716c] text-xs">Ask for custom measurements</p>
          </div>
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="w-5 h-5 text-[#78716c]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#3d3630]/50">
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 ${
                        message.role === "user"
                          ? "bg-[#c4a77d] text-[#1f1c18]"
                          : "bg-[#2a2520] text-[#e8e0d5]"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      
                      {message.measurements && message.measurements.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.measurements.map((m, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between bg-[#1f1c18]/50 rounded-lg px-2 py-1.5"
                            >
                              <span className="text-xs text-[#a8a29e]">{m.name}</span>
                              <span className="text-sm font-medium text-[#c4a77d]">
                                {m.value} {m.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-[#2a2520] rounded-xl px-3 py-2 flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                          className="w-2 h-2 rounded-full bg-[#c4a77d]"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-[#3d3630]/50">
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      disabled={isLoading}
                      className="flex-shrink-0 px-3 py-1.5 bg-[#2a2520] hover:bg-[#3d3630] text-[#a8a29e] text-xs rounded-full transition-colors disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask for a measurement..."
                    disabled={isLoading}
                    className="flex-1 bg-[#2a2520] border border-[#3d3630]/50 rounded-xl px-3 py-2 text-sm text-[#faf9f7] placeholder:text-[#57534e] focus:outline-none focus:border-[#c4a77d]/50 disabled:opacity-50"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-xl bg-[#c4a77d] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-[#1f1c18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
