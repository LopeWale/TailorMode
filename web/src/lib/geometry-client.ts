import { MeasurementDefinition } from "./measurement-service";

const GEOMETRY_SERVICE_URL = process.env.GEOMETRY_SERVICE_URL || "http://localhost:8000";

interface MeasurementRequest {
  mesh_file: string;
  landmarks: Record<string, number[]>;
  measurements: MeasurementDefinition[];
}

interface GeometryServiceResult {
  name: string;
  value: number;
  unit: string;
  confidence: number;
}

export interface ComputedMeasurement {
  name: string;
  value: number;
  unit: string;
  confidence: number;
  type: string;
  landmarks: { start: string; end: string };
}

export async function computeMeasurementsRemote(
  meshFilePath: string,
  landmarks: Record<string, number[]>,
  definitions: MeasurementDefinition[]
): Promise<ComputedMeasurement[]> {
  const request: MeasurementRequest = {
    mesh_file: meshFilePath,
    landmarks,
    measurements: definitions,
  };

  try {
    const response = await fetch(`${GEOMETRY_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Geometry Service Error: ${response.statusText}`);
    }

    const results: GeometryServiceResult[] = await response.json();

    return results.map((r, index) => {
      const def = definitions[index];
      return {
        name: r.name,
        value: r.value,
        unit: r.unit,
        confidence: r.confidence,
        type: def.type,
        landmarks: {
          start: def.landmark_start,
          end: def.landmark_end,
        }
      };
    });
  } catch (error) {
    console.error("Failed to compute measurements via geometry service:", error);
    throw error;
  }
}
