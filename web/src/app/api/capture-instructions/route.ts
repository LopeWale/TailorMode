import { NextRequest, NextResponse } from "next/server";
import { getMeasurementById, MeasurementDefinition } from "@/lib/measurement-types";
import { generateCaptureInstructions } from "@/lib/ai-measurement-interpreter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { measurementIds, captureViews } = body;

    if (!measurementIds || !Array.isArray(measurementIds) || measurementIds.length === 0) {
      return NextResponse.json(
        { error: "measurementIds array is required" },
        { status: 400 }
      );
    }

    const measurements: MeasurementDefinition[] = measurementIds
      .map((id: string) => getMeasurementById(id))
      .filter((m): m is MeasurementDefinition => m !== undefined);

    if (measurements.length === 0) {
      return NextResponse.json(
        { error: "No valid measurements found for the provided IDs" },
        { status: 400 }
      );
    }

    const views = captureViews || ["front", "back", "left", "right"];
    const validViews = views.filter(
      (v: string): v is "front" | "back" | "left" | "right" => 
        ["front", "back", "left", "right"].includes(v)
    );

    const instructions = await generateCaptureInstructions(measurements, validViews);

    return NextResponse.json({
      success: true,
      instructions: instructions.viewInstructions,
      generalGuidance: instructions.generalGuidance,
      poseRequirements: instructions.poseRequirements,
      clothingRequirements: instructions.clothingRequirements,
      measurementCount: measurements.length,
      viewsRequired: validViews,
    });
  } catch (error) {
    console.error("Capture instructions error:", error);
    return NextResponse.json(
      { error: "Failed to generate capture instructions" },
      { status: 500 }
    );
  }
}
