import { 
  MeasurementDefinition, 
  MeasurementResult,
  STANDARD_LANDMARKS,
  validateMeasurementResult
} from "./measurement-types";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface MeshData {
  vertices: Float32Array;
  indices: Uint32Array;
  normals?: Float32Array;
  scale: number;
}

export interface LandmarkData {
  id: string;
  position: Vector3;
  confidence: number;
  detectionMethod: "smpl" | "manual" | "estimated";
}

export interface MeshAnalysisResult {
  landmarks: Map<string, LandmarkData>;
  boundingBox: { min: Vector3; max: Vector3 };
  heightInMeters: number;
  meshQuality: number;
}

export interface ComputedMeasurement {
  measurementId: string;
  name: string;
  value: number;
  unit: "cm" | "in";
  confidence: number;
  computationMethod: "geodesic" | "planar_slice" | "euclidean" | "estimated";
  landmarks: { start: string; end: string };
  debugInfo?: {
    slicePoints?: number;
    pathLength?: number;
    iterations?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  shouldRecapture: boolean;
  shouldFlag: boolean;
  reason?: string;
  suggestedAction?: string;
}

export function vec3Distance(a: Vector3, b: Vector3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function vec3Add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vec3Scale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vec3Normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function vec3Cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function vec3Dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function extractHorizontalSlice(
  mesh: MeshData,
  yLevel: number,
  tolerance: number = 0.005
): Vector3[] {
  const slicePoints: Vector3[] = [];
  const vertices = mesh.vertices;
  const indices = mesh.indices;
  
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;
    
    const v0: Vector3 = { x: vertices[i0], y: vertices[i0 + 1], z: vertices[i0 + 2] };
    const v1: Vector3 = { x: vertices[i1], y: vertices[i1 + 1], z: vertices[i1 + 2] };
    const v2: Vector3 = { x: vertices[i2], y: vertices[i2 + 1], z: vertices[i2 + 2] };
    
    const intersections = findTrianglePlaneIntersections(v0, v1, v2, yLevel);
    slicePoints.push(...intersections);
  }
  
  return orderSlicePoints(slicePoints);
}

function findTrianglePlaneIntersections(
  v0: Vector3,
  v1: Vector3,
  v2: Vector3,
  yLevel: number
): Vector3[] {
  const points: Vector3[] = [];
  
  const edges: [Vector3, Vector3][] = [
    [v0, v1],
    [v1, v2],
    [v2, v0],
  ];
  
  for (const [a, b] of edges) {
    if ((a.y <= yLevel && b.y >= yLevel) || (a.y >= yLevel && b.y <= yLevel)) {
      if (Math.abs(b.y - a.y) < 0.0001) continue;
      
      const t = (yLevel - a.y) / (b.y - a.y);
      if (t >= 0 && t <= 1) {
        points.push({
          x: a.x + t * (b.x - a.x),
          y: yLevel,
          z: a.z + t * (b.z - a.z),
        });
      }
    }
  }
  
  return points;
}

function orderSlicePoints(points: Vector3[]): Vector3[] {
  if (points.length < 3) return points;
  
  let cx = 0, cz = 0;
  for (const p of points) {
    cx += p.x;
    cz += p.z;
  }
  cx /= points.length;
  cz /= points.length;
  
  return points.sort((a, b) => {
    const angleA = Math.atan2(a.z - cz, a.x - cx);
    const angleB = Math.atan2(b.z - cz, b.x - cx);
    return angleA - angleB;
  });
}

export function computeSlicePerimeter(orderedPoints: Vector3[]): number {
  if (orderedPoints.length < 3) return 0;
  
  let perimeter = 0;
  for (let i = 0; i < orderedPoints.length; i++) {
    const current = orderedPoints[i];
    const next = orderedPoints[(i + 1) % orderedPoints.length];
    perimeter += vec3Distance(current, next);
  }
  
  return perimeter;
}

export function computeCircumference(
  mesh: MeshData,
  centerLandmark: LandmarkData,
  planeNormal: Vector3 = { x: 0, y: 1, z: 0 }
): { value: number; confidence: number; pointCount: number } {
  const yLevel = centerLandmark.position.y;
  const slicePoints = extractHorizontalSlice(mesh, yLevel);
  
  if (slicePoints.length < 10) {
    return { value: 0, confidence: 0, pointCount: slicePoints.length };
  }
  
  const perimeter = computeSlicePerimeter(slicePoints);
  
  const expectedRange = getExpectedCircumferenceRange(centerLandmark.id);
  const valueInCm = perimeter * mesh.scale * 100;
  
  let confidence = centerLandmark.confidence;
  if (valueInCm < expectedRange.min || valueInCm > expectedRange.max) {
    confidence *= 0.7;
  }
  if (slicePoints.length < 50) {
    confidence *= 0.8;
  }
  
  return {
    value: valueInCm,
    confidence: Math.max(0, Math.min(1, confidence)),
    pointCount: slicePoints.length,
  };
}

function getExpectedCircumferenceRange(landmarkId: string): { min: number; max: number } {
  const ranges: Record<string, { min: number; max: number }> = {
    chest_center: { min: 70, max: 150 },
    waist_center: { min: 55, max: 130 },
    hip_center: { min: 75, max: 150 },
    neck_base: { min: 30, max: 55 },
    thigh_right: { min: 40, max: 85 },
    bicep_right: { min: 20, max: 50 },
    wrist_right: { min: 12, max: 22 },
    knee_right: { min: 30, max: 55 },
    calf_right: { min: 25, max: 55 },
  };
  
  return ranges[landmarkId] || { min: 10, max: 200 };
}

export function computeGeodesicDistance(
  mesh: MeshData,
  startLandmark: LandmarkData,
  endLandmark: LandmarkData
): { value: number; confidence: number; pathLength: number } {
  const euclidean = vec3Distance(startLandmark.position, endLandmark.position);
  const geodesicFactor = estimateGeodesicFactor(startLandmark.id, endLandmark.id);
  const geodesicDistance = euclidean * geodesicFactor;
  
  const valueInCm = geodesicDistance * mesh.scale * 100;
  const confidence = Math.min(startLandmark.confidence, endLandmark.confidence) * 0.95;
  
  return {
    value: valueInCm,
    confidence,
    pathLength: geodesicDistance,
  };
}

function estimateGeodesicFactor(startId: string, endId: string): number {
  const factors: Record<string, number> = {
    "shoulder_point_right-wrist_right": 1.05,
    "neck_base-waist_back": 1.08,
    "crotch-floor": 1.02,
    "waist_center-floor": 1.03,
    "neck_front-floor": 1.05,
  };
  
  const key = `${startId}-${endId}`;
  const reverseKey = `${endId}-${startId}`;
  
  return factors[key] || factors[reverseKey] || 1.0;
}

export function computeEuclideanDistance(
  mesh: MeshData,
  startLandmark: LandmarkData,
  endLandmark: LandmarkData
): { value: number; confidence: number } {
  const distance = vec3Distance(startLandmark.position, endLandmark.position);
  const valueInCm = distance * mesh.scale * 100;
  const confidence = Math.min(startLandmark.confidence, endLandmark.confidence);
  
  return { value: valueInCm, confidence };
}

export function computeMeasurement(
  mesh: MeshData,
  landmarks: Map<string, LandmarkData>,
  definition: MeasurementDefinition
): ComputedMeasurement {
  const startLandmark = landmarks.get(definition.landmarkStart);
  const endLandmark = landmarks.get(definition.landmarkEnd);
  
  if (!startLandmark) {
    throw new Error(`Start landmark not found: ${definition.landmarkStart}`);
  }
  if (!endLandmark) {
    throw new Error(`End landmark not found: ${definition.landmarkEnd}`);
  }
  
  let result: { value: number; confidence: number };
  let method: "geodesic" | "planar_slice" | "euclidean" | "estimated";
  let debugInfo: ComputedMeasurement["debugInfo"];
  
  switch (definition.type) {
    case "circumference": {
      const circumResult = computeCircumference(mesh, startLandmark);
      result = { value: circumResult.value, confidence: circumResult.confidence };
      method = "planar_slice";
      debugInfo = { slicePoints: circumResult.pointCount };
      break;
    }
    
    case "length": {
      const lengthResult = computeGeodesicDistance(mesh, startLandmark, endLandmark);
      result = { value: lengthResult.value, confidence: lengthResult.confidence };
      method = "geodesic";
      debugInfo = { pathLength: lengthResult.pathLength };
      break;
    }
    
    case "distance": {
      result = computeEuclideanDistance(mesh, startLandmark, endLandmark);
      method = "euclidean";
      break;
    }
    
    default:
      throw new Error(`Unknown measurement type: ${definition.type}`);
  }
  
  return {
    measurementId: definition.id,
    name: definition.displayName,
    value: Math.round(result.value * 10) / 10,
    unit: "cm",
    confidence: result.confidence,
    computationMethod: method,
    landmarks: {
      start: definition.landmarkStart,
      end: definition.landmarkEnd,
    },
    debugInfo,
  };
}

export function validateAndUpdateResult(
  computed: ComputedMeasurement,
  definition: MeasurementDefinition,
  previousResult: MeasurementResult
): { result: MeasurementResult; validation: ValidationResult } {
  const newAttempts = previousResult.captureAttempts + 1;
  
  const updatedResult: MeasurementResult = {
    measurementId: computed.measurementId,
    value: computed.value,
    unit: computed.unit,
    confidence: computed.confidence,
    captureAttempts: newAttempts,
    status: "pending",
  };
  
  const validationCheck = validateMeasurementResult(updatedResult, definition);
  
  let validation: ValidationResult;
  
  if (validationCheck.valid) {
    updatedResult.status = "validated";
    validation = {
      isValid: true,
      shouldRecapture: false,
      shouldFlag: false,
    };
  } else if (newAttempts >= 3) {
    updatedResult.status = "flagged";
    updatedResult.flagReason = validationCheck.reason;
    validation = {
      isValid: false,
      shouldRecapture: false,
      shouldFlag: true,
      reason: validationCheck.reason,
      suggestedAction: "This measurement has been flagged for manual review by the tailor.",
    };
  } else {
    updatedResult.status = "pending";
    validation = {
      isValid: false,
      shouldRecapture: true,
      shouldFlag: false,
      reason: validationCheck.reason,
      suggestedAction: getRecaptureGuidance(definition, computed.confidence),
    };
  }
  
  return { result: updatedResult, validation };
}

function getRecaptureGuidance(definition: MeasurementDefinition, confidence: number): string {
  const viewsNeeded = definition.captureRequirements.join(", ");
  
  if (confidence < 0.5) {
    return `Low confidence on ${definition.displayName}. Please ensure good lighting and hold still during the ${viewsNeeded} capture(s).`;
  }
  
  if (confidence < 0.7) {
    return `${definition.displayName} needs better visibility. Make sure your ${definition.description.toLowerCase()} is clearly visible in the ${viewsNeeded} view(s).`;
  }
  
  return `Please recapture the ${viewsNeeded} view(s) for more accurate ${definition.displayName} measurement.`;
}

export function computeAllMeasurements(
  mesh: MeshData,
  landmarks: Map<string, LandmarkData>,
  definitions: MeasurementDefinition[],
  previousResults: MeasurementResult[]
): {
  measurements: ComputedMeasurement[];
  validations: Map<string, ValidationResult>;
  updatedResults: MeasurementResult[];
  summary: {
    total: number;
    validated: number;
    needsRecapture: number;
    flagged: number;
  };
} {
  const measurements: ComputedMeasurement[] = [];
  const validations = new Map<string, ValidationResult>();
  const updatedResults: MeasurementResult[] = [];
  
  let validated = 0;
  let needsRecapture = 0;
  let flagged = 0;
  
  for (const definition of definitions) {
    const previousResult = previousResults.find(r => r.measurementId === definition.id) || {
      measurementId: definition.id,
      value: 0,
      unit: "cm" as const,
      confidence: 0,
      captureAttempts: 0,
      status: "pending" as const,
    };
    
    try {
      const computed = computeMeasurement(mesh, landmarks, definition);
      measurements.push(computed);
      
      const { result, validation } = validateAndUpdateResult(computed, definition, previousResult);
      validations.set(definition.id, validation);
      updatedResults.push(result);
      
      if (validation.isValid) validated++;
      else if (validation.shouldRecapture) needsRecapture++;
      else if (validation.shouldFlag) flagged++;
    } catch (error) {
      console.error(`Failed to compute ${definition.id}:`, error);
      
      validations.set(definition.id, {
        isValid: false,
        shouldRecapture: true,
        shouldFlag: previousResult.captureAttempts >= 2,
        reason: `Could not compute measurement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      updatedResults.push({
        ...previousResult,
        captureAttempts: previousResult.captureAttempts + 1,
        status: previousResult.captureAttempts >= 2 ? "flagged" : "pending",
      });
      
      if (previousResult.captureAttempts >= 2) flagged++;
      else needsRecapture++;
    }
  }
  
  return {
    measurements,
    validations,
    updatedResults,
    summary: {
      total: definitions.length,
      validated,
      needsRecapture,
      flagged,
    },
  };
}

export function estimateLandmarksFromHeight(
  heightInCm: number,
  bodyProportions?: Partial<Record<string, number>>
): Map<string, LandmarkData> {
  const landmarks = new Map<string, LandmarkData>();
  const heightInM = heightInCm / 100;
  
  const proportions: Record<string, { y: number; x: number; z: number }> = {
    crown: { y: 1.0, x: 0, z: 0 },
    chin: { y: 0.87, x: 0, z: 0.02 },
    neck_base: { y: 0.82, x: 0, z: 0 },
    neck_front: { y: 0.82, x: 0, z: 0.03 },
    shoulder_left: { y: 0.80, x: -0.10, z: 0 },
    shoulder_right: { y: 0.80, x: 0.10, z: 0 },
    shoulder_point_left: { y: 0.80, x: -0.12, z: 0 },
    shoulder_point_right: { y: 0.80, x: 0.12, z: 0 },
    chest_center: { y: 0.72, x: 0, z: 0.05 },
    bust_point_left: { y: 0.72, x: -0.06, z: 0.06 },
    bust_point_right: { y: 0.72, x: 0.06, z: 0.06 },
    waist_center: { y: 0.60, x: 0, z: 0.04 },
    waist_front: { y: 0.60, x: 0, z: 0.05 },
    waist_back: { y: 0.60, x: 0, z: -0.03 },
    hip_center: { y: 0.52, x: 0, z: 0.04 },
    hip_left: { y: 0.52, x: -0.09, z: 0 },
    hip_right: { y: 0.52, x: 0.09, z: 0 },
    crotch: { y: 0.47, x: 0, z: 0.02 },
    thigh_left: { y: 0.42, x: -0.06, z: 0.02 },
    thigh_right: { y: 0.42, x: 0.06, z: 0.02 },
    knee_left: { y: 0.28, x: -0.05, z: 0.02 },
    knee_right: { y: 0.28, x: 0.05, z: 0.02 },
    calf_left: { y: 0.20, x: -0.04, z: 0.02 },
    calf_right: { y: 0.20, x: 0.04, z: 0.02 },
    ankle_left: { y: 0.05, x: -0.04, z: 0 },
    ankle_right: { y: 0.05, x: 0.04, z: 0 },
    floor: { y: 0, x: 0, z: 0 },
    elbow_left: { y: 0.62, x: -0.22, z: 0 },
    elbow_right: { y: 0.62, x: 0.22, z: 0 },
    wrist_left: { y: 0.48, x: -0.28, z: 0.02 },
    wrist_right: { y: 0.48, x: 0.28, z: 0.02 },
    bicep_left: { y: 0.70, x: -0.16, z: 0 },
    bicep_right: { y: 0.70, x: 0.16, z: 0 },
  };
  
  for (const [id, prop] of Object.entries(proportions)) {
    landmarks.set(id, {
      id,
      position: {
        x: prop.x * heightInM,
        y: prop.y * heightInM,
        z: prop.z * heightInM,
      },
      confidence: 0.6,
      detectionMethod: "estimated",
    });
  }
  
  return landmarks;
}
