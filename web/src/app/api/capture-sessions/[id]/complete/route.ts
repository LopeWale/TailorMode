import { NextRequest, NextResponse } from "next/server";
import { completeCaptureSession } from "@/lib/capture-sessions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await completeCaptureSession(id);
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Failed to complete session:", error);
    return NextResponse.json(
      { error: "Failed to complete session", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
