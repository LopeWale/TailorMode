import { NextRequest, NextResponse } from "next/server";
import { 
  MeasurementDefinition,
  MeasurementResult,
  getMeasurementById 
} from "@/lib/measurement-types";
import {
  MeshData,
  LandmarkData,
  computeAllMeasurements,
  estimateLandmarksFromHeight
} from "@/lib/geometry-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      meshData, 
      landmarks: landmarksInput,
      measurementIds,
      previousResults,
      heightInCm 
    } = body;

    if (!measurementIds || !Array.isArray(measurementIds) || measurementIds.length === 0) {
      return NextResponse.json(
        { error: "measurementIds array is required" },
        { status: 400 }
      );
    }

    const definitions: MeasurementDefinition[] = measurementIds
      .map((id: string) => getMeasurementById(id))
      .filter((d): d is MeasurementDefinition => d !== undefined);

    if (definitions.length === 0) {
      return NextResponse.json(
        { error: "No valid measurement definitions found for the provided IDs" },
        { status: 400 }
      );
    }

    let landmarks: Map<string, LandmarkData>;
    
    if (landmarksInput && typeof landmarksInput === "object") {
      landmarks = new Map(
        Object.entries(landmarksInput).map(([id, data]) => [
          id,
          data as LandmarkData
        ])
      );
    } else if (heightInCm && typeof heightInCm === "number") {
      landmarks = estimateLandmarksFromHeight(heightInCm);
    } else {
      return NextResponse.json(
        { error: "Either landmarks or heightInCm is required" },
        { status: 400 }
      );
    }

    let mesh: MeshData;
    
    if (meshData && meshData.vertices) {
      mesh = {
        vertices: new Float32Array(meshData.vertices),
        indices: new Uint32Array(meshData.indices || []),
        normals: meshData.normals ? new Float32Array(meshData.normals) : undefined,
        scale: meshData.scale || 1,
      };
    } else {
      mesh = createEstimatedMesh(landmarks, heightInCm || 170);
    }

    const prevResults: MeasurementResult[] = previousResults || definitions.map(d => ({
      measurementId: d.id,
      value: 0,
      unit: "cm" as const,
      confidence: 0,
      captureAttempts: 0,
      status: "pending" as const,
    }));

    const result = computeAllMeasurements(mesh, landmarks, definitions, prevResults);

    const validationsObject: Record<string, { isValid: boolean; shouldRecapture: boolean; shouldFlag: boolean; reason?: string; suggestedAction?: string }> = {};
    result.validations.forEach((val, key) => {
      validationsObject[key] = val;
    });

    return NextResponse.json({
      success: true,
      measurements: result.measurements,
      validations: validationsObject,
      results: result.updatedResults,
      summary: result.summary,
    });
  } catch (error) {
    console.error("Measurement computation error:", error);
    return NextResponse.json(
      { error: "Failed to compute measurements", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function createEstimatedMesh(landmarks: Map<string, LandmarkData>, heightInCm: number): MeshData {
  const vertices: number[] = [];
  const indices: number[] = [];
  const heightInM = heightInCm / 100;
  
  const circumferenceLandmarks = ["chest_center", "waist_center", "hip_center", "neck_base", "thigh_right", "bicep_right"];
  const estimatedRadii: Record<string, number> = {
    chest_center: 0.15,
    waist_center: 0.12,
    hip_center: 0.14,
    neck_base: 0.06,
    thigh_right: 0.08,
    bicep_right: 0.045,
    knee_right: 0.055,
    calf_right: 0.05,
    wrist_right: 0.025,
  };
  
  for (const landmarkId of circumferenceLandmarks) {
    const landmark = landmarks.get(landmarkId);
    if (!landmark) continue;
    
    const radius = estimatedRadii[landmarkId] || 0.1;
    const segments = 32;
    const y = landmark.position.y;
    const baseIndex = vertices.length / 3;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(
        Math.cos(angle) * radius + landmark.position.x,
        y,
        Math.sin(angle) * radius + landmark.position.z
      );
    }
    
    for (let i = 0; i < segments; i++) {
      indices.push(baseIndex + i);
      indices.push(baseIndex + ((i + 1) % segments));
      indices.push(baseIndex + i);
    }
  }
  
  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    scale: 1,
  };
}
