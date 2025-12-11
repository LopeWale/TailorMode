import { NextRequest, NextResponse } from "next/server";

interface Measurement {
  name: string;
  value: number;
  unit: string;
  confidence: number;
}

interface MeasurementSession {
  id: string;
  date: string;
  bodyType: string;
  measurements: Measurement[];
  posture: string;
}

const mockMeasurements: MeasurementSession[] = [
  {
    id: "session-001",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    bodyType: "Athletic",
    posture: "Good",
    measurements: [
      { name: "Chest", value: 102, unit: "cm", confidence: 0.94 },
      { name: "Waist", value: 84, unit: "cm", confidence: 0.92 },
      { name: "Hips", value: 98, unit: "cm", confidence: 0.91 },
      { name: "Shoulder Width", value: 46, unit: "cm", confidence: 0.89 },
      { name: "Arm Length", value: 64, unit: "cm", confidence: 0.88 },
      { name: "Inseam", value: 81, unit: "cm", confidence: 0.87 },
    ],
  },
  {
    id: "session-002",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    bodyType: "Athletic",
    posture: "Slight forward lean",
    measurements: [
      { name: "Chest", value: 101, unit: "cm", confidence: 0.93 },
      { name: "Waist", value: 85, unit: "cm", confidence: 0.90 },
      { name: "Hips", value: 97, unit: "cm", confidence: 0.92 },
      { name: "Shoulder Width", value: 46, unit: "cm", confidence: 0.88 },
      { name: "Arm Length", value: 64, unit: "cm", confidence: 0.86 },
      { name: "Inseam", value: 81, unit: "cm", confidence: 0.85 },
    ],
  },
  {
    id: "session-003",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    bodyType: "Average",
    posture: "Good",
    measurements: [
      { name: "Chest", value: 100, unit: "cm", confidence: 0.91 },
      { name: "Waist", value: 86, unit: "cm", confidence: 0.89 },
      { name: "Hips", value: 96, unit: "cm", confidence: 0.90 },
      { name: "Shoulder Width", value: 45, unit: "cm", confidence: 0.87 },
      { name: "Arm Length", value: 63, unit: "cm", confidence: 0.85 },
      { name: "Inseam", value: 80, unit: "cm", confidence: 0.84 },
    ],
  },
  {
    id: "session-004",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    bodyType: "Average",
    posture: "Good",
    measurements: [
      { name: "Chest", value: 99, unit: "cm", confidence: 0.88 },
      { name: "Waist", value: 87, unit: "cm", confidence: 0.86 },
      { name: "Hips", value: 95, unit: "cm", confidence: 0.87 },
      { name: "Shoulder Width", value: 45, unit: "cm", confidence: 0.84 },
      { name: "Arm Length", value: 63, unit: "cm", confidence: 0.82 },
      { name: "Inseam", value: 80, unit: "cm", confidence: 0.81 },
    ],
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockMeasurements,
    });
  } catch (error) {
    console.error("Error fetching measurements:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch measurements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { bodyType, measurements, posture } = body;

    if (!bodyType || !measurements || !Array.isArray(measurements)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const newSession: MeasurementSession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      bodyType,
      measurements,
      posture: posture || "Unknown",
    };

    mockMeasurements.unshift(newSession);

    return NextResponse.json({
      success: true,
      data: newSession,
    });
  } catch (error) {
    console.error("Error saving measurements:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save measurements" },
      { status: 500 }
    );
  }
}
