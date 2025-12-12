import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.replit.dev",
    "*.riker.replit.dev",
    "*.repl.co",
  ],
};

export default nextConfig;
