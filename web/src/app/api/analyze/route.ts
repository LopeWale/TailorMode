import { NextRequest, NextResponse } from "next/server";
import { analyzeBodyImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "No valid image provided" },
        { status: 400 }
      );
    }

    const result = await analyzeBodyImage(image);

    if (!result.measurements || result.measurements.length === 0) {
      return NextResponse.json(
        { error: "Could not extract measurements from image. Please try again with a clearer photo." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Analysis error:", error);
    const errorMessage = error.message || "Failed to analyze image";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
