import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, height } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "No valid image provided" },
        { status: 400 }
      );
    }

    if (!height || typeof height !== "number" || height < 100 || height > 250) {
      return NextResponse.json(
        { error: "Valid height (100-250 cm) required for scale calibration" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      requiresClientProcessing: true,
      height: height,
      message: "Pose estimation will be performed client-side using MediaPipe",
    });

  } catch (error: any) {
    console.error("Request error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
