"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  measurementData?: MeasurementData;
}

interface MeasurementData {
  name: string;
  value: number;
  unit: string;
}

interface ChatInterfaceProps {
  measurementContext?: any;
  initialMessages?: Message[];
  placeholder?: string;
}

export default function ChatInterface({
  measurementContext,
  initialMessages = [],
  placeholder = "Ask about measurements, fit, or tailoring...",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedInput,
          measurementContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(data.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, index) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={index} className="font-semibold text-[#faf9f7] mt-3 mb-1">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <p key={index} className="pl-4 text-[#a8a29e] flex items-start gap-2 my-1">
            <span className="text-[#c4a77d] mt-1.5 flex-shrink-0">
              <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4" />
              </svg>
            </span>
            <span>{line.substring(2)}</span>
          </p>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <p key={index} className="pl-4 text-[#a8a29e] my-1">
            <span className="text-[#c4a77d] mr-2">{line.match(/^\d+/)?.[0]}.</span>
            {line.replace(/^\d+\.\s/, "")}
          </p>
        );
      }
      if (line.trim() === "") {
        return <br key={index} />;
      }
      return (
        <p key={index} className="text-[#a8a29e] my-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl surface-elevated flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-[#c4a77d]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#faf9f7] mb-2">
              Tailoring Assistant
            </h3>
            <p className="text-[#78716c] text-sm max-w-xs">
              Ask questions about your measurements, get fit recommendations, or learn about tailoring techniques.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm">
              {[
                "What does my chest measurement mean for shirt fit?",
                "How should I adjust for broad shoulders?",
                "What alterations do I need for a slim fit suit?",
              ].map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setInputValue(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-left text-xs text-[#9c8f78] surface-glass px-4 py-3 rounded-xl hover:border-[#c4a77d]/20 transition-colors"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === "user"
                    ? "bg-[#c4a77d] text-[#1f1c18] rounded-2xl rounded-br-md px-4 py-3"
                    : "surface-elevated rounded-2xl rounded-bl-md px-4 py-3"
                }`}
              >
                {message.role === "user" ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  <div className="text-sm leading-relaxed">
                    {formatMessageContent(message.content)}
                  </div>
                )}
                {message.measurementData && (
                  <div className="mt-3 pt-3 border-t border-[#c4a77d]/10">
                    <div className="flex items-center gap-2 text-xs">
                      <svg
                        className="w-4 h-4 text-[#c4a77d]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
                        />
                      </svg>
                      <span className="text-[#9c8f78]">
                        {message.measurementData.name}:{" "}
                        <span className="text-[#faf9f7] font-medium">
                          {message.measurementData.value} {message.measurementData.unit}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="surface-elevated rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        delay: i * 0.2,
                      }}
                      className="w-2 h-2 rounded-full bg-[#c4a77d]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="surface-glass border-red-500/20 rounded-xl px-4 py-3 text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-[#78716c] text-xs mt-1 hover:text-[#faf9f7] transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#c4a77d]/10">
        <form onSubmit={handleSubmit} className="relative">
          <div className="surface-glass rounded-2xl flex items-end">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent text-[#faf9f7] text-sm px-4 py-3 resize-none focus:outline-none placeholder:text-[#57534e] max-h-32 min-h-[48px]"
              style={{ height: "48px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "48px";
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`m-2 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                inputValue.trim() && !isLoading
                  ? "bg-[#c4a77d] text-[#1f1c18]"
                  : "bg-[#1f1c18] text-[#57534e]"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
