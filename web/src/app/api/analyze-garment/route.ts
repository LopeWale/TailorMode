import { NextRequest, NextResponse } from "next/server";
import { analyzeGarmentDescription } from "@/lib/ai-measurement-interpreter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, fitPreference, occasion } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeGarmentDescription(description, {
      fitPreference,
      occasion,
    });

    if (!analysis.understood) {
      return NextResponse.json({
        understood: false,
        clarificationNeeded: analysis.clarificationNeeded || "Could not understand the garment description. Please provide more details.",
        suggestedPreset: analysis.suggestedPreset,
      });
    }

    return NextResponse.json({
      understood: true,
      garmentType: analysis.garmentType,
      garmentDescription: analysis.garmentDescription,
      requiredMeasurements: analysis.requiredMeasurements,
      optionalMeasurements: analysis.optionalMeasurements,
      captureViews: analysis.captureViews,
      captureGuidance: analysis.captureGuidance,
      fitConsiderations: analysis.fitConsiderations,
      suggestedPreset: analysis.suggestedPreset,
    });
  } catch (error) {
    console.error("Garment analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze garment description" },
      { status: 500 }
    );
  }
}
