import { NextRequest, NextResponse } from "next/server";
import { analyzeBodyImage, MeasurementResult } from "@/lib/gemini";

function generateDemoMeasurements(): MeasurementResult & { isDemo: boolean } {
  const baseChest = 90 + Math.floor(Math.random() * 20);
  const baseWaist = baseChest - 10 - Math.floor(Math.random() * 8);
  const baseHips = baseChest + Math.floor(Math.random() * 10);
  
  return {
    isDemo: true,
    measurements: [
      {
        name: "Chest",
        value: baseChest,
        unit: "cm",
        confidence: 0.0,
        landmark_start: "left chest",
        landmark_end: "right chest",
      },
      {
        name: "Waist",
        value: baseWaist,
        unit: "cm",
        confidence: 0.0,
        landmark_start: "left waist",
        landmark_end: "right waist",
      },
      {
        name: "Hips",
        value: baseHips,
        unit: "cm",
        confidence: 0.0,
        landmark_start: "left hip",
        landmark_end: "right hip",
      },
      {
        name: "Shoulder Width",
        value: 42 + Math.floor(Math.random() * 8),
        unit: "cm",
        confidence: 0.0,
        landmark_start: "left shoulder",
        landmark_end: "right shoulder",
      },
      {
        name: "Arm Length",
        value: 58 + Math.floor(Math.random() * 10),
        unit: "cm",
        confidence: 0.0,
        landmark_start: "shoulder",
        landmark_end: "wrist",
      },
      {
        name: "Inseam",
        value: 76 + Math.floor(Math.random() * 10),
        unit: "cm",
        confidence: 0.0,
        landmark_start: "crotch",
        landmark_end: "floor",
      },
    ],
    bodyType: "Demo",
    posture: "Demo mode - simulated data",
    recommendations: [
      "This is demo data - not from your actual photo",
      "For accurate measurements, use manual entry or try again with better lighting",
    ],
  };
}

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

    try {
      const result = await analyzeBodyImage(image);
      
      if (!result.measurements || result.measurements.length === 0) {
        console.log("AI returned no measurements, using demo data");
        return NextResponse.json(generateDemoMeasurements());
      }

      return NextResponse.json({ ...result, isDemo: false });
    } catch (aiError: any) {
      console.error("AI analysis failed:", aiError.message);
      return NextResponse.json(generateDemoMeasurements());
    }
  } catch (error: any) {
    console.error("Request error:", error);
    return NextResponse.json(generateDemoMeasurements());
  }
}
