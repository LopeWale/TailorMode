import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; detail?: string }> = {
    uptime: { status: "ok", detail: `${Math.round(process.uptime())}s` },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    checks.database = { status: "error", detail: message };
  }

  const healthy = Object.values(checks).every((check) => check.status === "ok");

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
