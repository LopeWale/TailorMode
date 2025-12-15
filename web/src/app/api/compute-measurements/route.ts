import { NextRequest, NextResponse } from "next/server";
import { 
  MeasurementDefinition,
  MeasurementResult,
  getMeasurementById,
  validateMeasurementResult
} from "@/lib/measurement-types";
import {
  computeMeasurementsRemote
} from "@/lib/geometry-client";
import { MeasurementDefinition as ClientDefinition } from "@/lib/measurement-service";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

// We keep the old MeshData/LandmarkData interfaces for input parsing if needed
// but we will primarily deal with raw data to save to file.
interface MeshData {
  vertices: number[] | Float32Array;
  indices: number[] | Uint32Array;
  normals?: number[] | Float32Array;
  scale?: number;
}

interface LandmarkData {
  id: string;
  position: { x: number; y: number; z: number };
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

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

    const definitions = measurementIds
      .map((id: string) => getMeasurementById(id))
      .filter((d: any): d is MeasurementDefinition => d !== undefined);

    if (definitions.length === 0) {
      return NextResponse.json(
        { error: "No valid measurement definitions found for the provided IDs" },
        { status: 400 }
      );
    }

    // Prepare Landmarks for Python Service (Map<string, [x,y,z]>)
    const landmarksForService: Record<string, number[]> = {};
    
    if (landmarksInput && typeof landmarksInput === "object") {
      Object.entries(landmarksInput).forEach(([id, data]: [string, any]) => {
        if (data && data.position) {
          landmarksForService[id] = [data.position.x, data.position.y, data.position.z];
        }
      });
    } else {
        // Fallback: if we only have height, we might need to estimate landmarks
        // But the Python service expects explicit landmarks.
        // For MVP, we assume landmarks are provided (e.g. from SMPL fitting result).
        // If not, we fail or need to implement estimation logic here or in Python.
        // Let's assume input has landmarks.
        return NextResponse.json(
            { error: "Landmarks are required for accurate measurement" },
            { status: 400 }
        );
    }

    // Save Mesh to Temp File
    if (!meshData || !meshData.vertices || !meshData.indices) {
         return NextResponse.json(
            { error: "Mesh data (vertices/indices) is required" },
            { status: 400 }
        );
    }

    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `mesh-${uuidv4()}.obj`);

    // Create OBJ content
    // v x y z
    // f v1 v2 v3
    let objContent = "";
    const vertices = meshData.vertices;
    const indices = meshData.indices;
    const scale = meshData.scale || 1.0;

    for (let i = 0; i < vertices.length; i += 3) {
      objContent += `v ${vertices[i] * scale} ${vertices[i+1] * scale} ${vertices[i+2] * scale}\n`;
    }
    
    for (let i = 0; i < indices.length; i += 3) {
      // OBJ indices are 1-based
      objContent += `f ${indices[i] + 1} ${indices[i+1] + 1} ${indices[i+2] + 1}\n`;
    }

    await fs.writeFile(tempFilePath, objContent);

    // Prepare Definitions for Client
    const clientDefinitions: ClientDefinition[] = definitions.map(d => ({
        name: d.displayName,
        type: mapType(d.type),
        landmark_start: d.landmarkStart,
        landmark_end: d.landmarkEnd,
        description: d.description,
        plane: d.plane
    }));

    // Call Python Service
    const computedResults = await computeMeasurementsRemote(
        tempFilePath,
        landmarksForService,
        clientDefinitions
    );

    // Process Results
    const updatedResults: MeasurementResult[] = [];
    const validationsObject: Record<string, any> = {};
    let validatedCount = 0;
    let needsRecaptureCount = 0;
    let flaggedCount = 0;

    const prevResultsMap = new Map(
        (previousResults || []).map((r: any) => [r.measurementId, r])
    );

    definitions.forEach((def, index) => {
        const computed = computedResults[index];
        const prevRes = prevResultsMap.get(def.id) || {
            measurementId: def.id,
            captureAttempts: 0,
            status: "pending"
        };

        const newResult: MeasurementResult = {
            measurementId: def.id,
            value: computed.value, // in mm from service? Service returns unit. Service returns value.
            // Wait, Python service returns value and unit. Client wrapper returns ComputedMeasurement with unit.
            // Client wrapper says unit: r.unit. Python says "mm".
            // MeasurementResult expects "cm" or "in".
            // We need to convert mm to cm.
            unit: "cm",
            confidence: computed.confidence,
            captureAttempts: prevRes.captureAttempts + 1,
            status: "pending"
        };

        // Convert if needed
        if (computed.unit === "mm") {
            newResult.value = computed.value / 10;
        }

        const validation = validateMeasurementResult(newResult, def);

        if (validation.valid) {
            newResult.status = "validated";
            validatedCount++;
        } else if (newResult.captureAttempts >= 3) {
            newResult.status = "flagged";
            newResult.flagReason = validation.reason;
            flaggedCount++;
        } else {
            needsRecaptureCount++;
        }

        updatedResults.push(newResult);
        validationsObject[def.id] = {
            isValid: validation.valid,
            shouldRecapture: !validation.valid && newResult.status !== "flagged",
            shouldFlag: newResult.status === "flagged",
            reason: validation.reason
        };
    });

    return NextResponse.json({
      success: true,
      measurements: computedResults, // Debug info
      validations: validationsObject,
      results: updatedResults,
      summary: {
        total: definitions.length,
        validated: validatedCount,
        needsRecapture: needsRecaptureCount,
        flagged: flaggedCount
      },
    });

  } catch (error) {
    console.error("Measurement computation error:", error);
    return NextResponse.json(
      { error: "Failed to compute measurements", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  } finally {
      // Cleanup temp file
      if (tempFilePath) {
          try {
              await fs.unlink(tempFilePath);
          } catch (e) {
              console.error("Failed to delete temp file:", e);
          }
      }
  }
}

function mapType(type: string): "circumference" | "length" | "distance" | "limb_circumference" {
    if (type === "circumference") return "circumference";
    if (type === "length") return "distance"; // Geodesic length is "distance" (geodesic) in our Python service?
    // Wait, Python service has "distance" (geodesic) and "circumference" and "limb_circumference".
    // TS type "length" usually means geodesic length along body. So "distance".
    // TS type "distance" usually means straight line? "shoulder_width" -> "distance" (geodesic across back).
    // Actually, "shoulder_width" is geodesic across back surface.
    // So "length" and "distance" both map to "distance" (geodesic) in Python service.
    return "distance";
}
