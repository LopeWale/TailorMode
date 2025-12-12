import { PoseLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface PoseLandmarks {
  landmarks: NormalizedLandmark[];
  worldLandmarks: NormalizedLandmark[];
}

export interface BodyMeasurement {
  name: string;
  value: number;
  unit: string;
  confidence: number;
  landmark_start: string;
  landmark_end: string;
}

export interface MeasurementResult {
  measurements: BodyMeasurement[];
  bodyType: string;
  posture: string;
  recommendations: string[];
  landmarksDetected: boolean;
  poseQuality: number;
}

const LANDMARK_NAMES: Record<number, string> = {
  0: "nose",
  1: "left_eye_inner",
  2: "left_eye",
  3: "left_eye_outer",
  4: "right_eye_inner",
  5: "right_eye",
  6: "right_eye_outer",
  7: "left_ear",
  8: "right_ear",
  9: "mouth_left",
  10: "mouth_right",
  11: "left_shoulder",
  12: "right_shoulder",
  13: "left_elbow",
  14: "right_elbow",
  15: "left_wrist",
  16: "right_wrist",
  17: "left_pinky",
  18: "right_pinky",
  19: "left_index",
  20: "right_index",
  21: "left_thumb",
  22: "right_thumb",
  23: "left_hip",
  24: "right_hip",
  25: "left_knee",
  26: "right_knee",
  27: "left_ankle",
  28: "right_ankle",
  29: "left_heel",
  30: "right_heel",
  31: "left_foot_index",
  32: "right_foot_index",
};

let poseLandmarker: PoseLandmarker | null = null;
let initPromise: Promise<PoseLandmarker> | null = null;

export async function initializePoseEstimation(): Promise<PoseLandmarker> {
  if (poseLandmarker) return poseLandmarker;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    return poseLandmarker;
  })();

  return initPromise;
}

function distance3D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = (a.x - b.x);
  const dy = (a.y - b.y);
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function distance2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = (a.x - b.x);
  const dy = (a.y - b.y);
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(a: NormalizedLandmark, b: NormalizedLandmark): NormalizedLandmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z || 0) + (b.z || 0)) / 2,
    visibility: Math.min(a.visibility || 0, b.visibility || 0),
  };
}

function avgVisibility(landmarks: NormalizedLandmark[], indices: number[]): number {
  const visibilities = indices.map(i => landmarks[i]?.visibility || 0);
  return visibilities.reduce((a, b) => a + b, 0) / visibilities.length;
}

export function computeMeasurementsFromLandmarks(
  landmarks: NormalizedLandmark[],
  heightCm: number
): BodyMeasurement[] {
  if (landmarks.length < 33) {
    throw new Error("Incomplete pose landmarks detected");
  }

  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const nose = landmarks[0];
  
  const ankleY = Math.max(leftAnkle.y, rightAnkle.y);
  const headY = nose.y;
  const normalizedHeight = ankleY - headY;
  
  if (normalizedHeight <= 0) {
    throw new Error("Invalid pose - head should be above feet");
  }
  
  const pixelsPerCm = normalizedHeight / heightCm;
  
  const measurements: BodyMeasurement[] = [];
  
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const shoulderDist = distance2D(leftShoulder, rightShoulder);
  const shoulderWidthCm = shoulderDist / pixelsPerCm;
  measurements.push({
    name: "Shoulder Width",
    value: Math.round(shoulderWidthCm * 10) / 10,
    unit: "cm",
    confidence: avgVisibility(landmarks, [11, 12]),
    landmark_start: "left_shoulder",
    landmark_end: "right_shoulder",
  });

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const hipDist = distance2D(leftHip, rightHip);
  const hipWidthCm = hipDist / pixelsPerCm;
  
  const chestCircumference = shoulderWidthCm * 2.5;
  measurements.push({
    name: "Chest",
    value: Math.round(chestCircumference * 10) / 10,
    unit: "cm",
    confidence: avgVisibility(landmarks, [11, 12]) * 0.8,
    landmark_start: "left_chest",
    landmark_end: "right_chest",
  });

  const waistEstimate = (shoulderWidthCm + hipWidthCm) / 2;
  const waistCircumference = waistEstimate * 2.3;
  measurements.push({
    name: "Waist",
    value: Math.round(waistCircumference * 10) / 10,
    unit: "cm",
    confidence: avgVisibility(landmarks, [11, 12, 23, 24]) * 0.7,
    landmark_start: "left_waist",
    landmark_end: "right_waist",
  });

  const hipCircumference = hipWidthCm * 2.8;
  measurements.push({
    name: "Hips",
    value: Math.round(hipCircumference * 10) / 10,
    unit: "cm",
    confidence: avgVisibility(landmarks, [23, 24]) * 0.8,
    landmark_start: "left_hip",
    landmark_end: "right_hip",
  });

  const leftElbow = landmarks[13];
  const leftWrist = landmarks[15];
  const upperArmDist = distance2D(leftShoulder, leftElbow);
  const forearmDist = distance2D(leftElbow, leftWrist);
  const armLengthCm = (upperArmDist + forearmDist) / pixelsPerCm;
  measurements.push({
    name: "Arm Length",
    value: Math.round(armLengthCm * 10) / 10,
    unit: "cm",
    confidence: avgVisibility(landmarks, [11, 13, 15]),
    landmark_start: "shoulder",
    landmark_end: "wrist",
  });

  const hipMid = midpoint(leftHip, rightHip);
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const kneeMid = midpoint(leftKnee, rightKnee);
  const ankleMid = midpoint(leftAnkle, rightAnkle);
  
  const upperLegDist = distance2D(hipMid, kneeMid);
  const lowerLegDist = distance2D(kneeMid, ankleMid);
  const inseamCm = (upperLegDist + lowerLegDist) / pixelsPerCm;
  measurements.push({
    name: "Inseam",
    value: Math.round(inseamCm * 10) / 10,
    unit: "cm",
    confidence: avgVisibility(landmarks, [23, 24, 25, 26, 27, 28]),
    landmark_start: "crotch",
    landmark_end: "ankle",
  });

  const thighDist = distance2D(leftHip, leftKnee);
  const thighCircumference = (thighDist / pixelsPerCm) * 0.8;
  measurements.push({
    name: "Thigh",
    value: Math.round(thighCircumference * 10) / 10,
    unit: "cm",
    confidence: avgVisibility(landmarks, [23, 25]),
    landmark_start: "upper_thigh",
    landmark_end: "upper_thigh",
  });

  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const neckWidthDist = distance2D(leftEar, rightEar);
  const neckCircumference = (neckWidthDist / pixelsPerCm) * 2.2;
  measurements.push({
    name: "Neck",
    value: Math.round(neckCircumference * 10) / 10,
    unit: "cm",
    confidence: avgVisibility(landmarks, [7, 8]) * 0.6,
    landmark_start: "neck_base",
    landmark_end: "neck_base",
  });

  return measurements;
}

export async function detectPoseFromImage(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<PoseLandmarks | null> {
  const landmarker = await initializePoseEstimation();
  
  const result = landmarker.detect(imageElement);
  
  if (!result.landmarks || result.landmarks.length === 0) {
    return null;
  }

  return {
    landmarks: result.landmarks[0],
    worldLandmarks: result.worldLandmarks?.[0] || result.landmarks[0],
  };
}

export function evaluatePoseQuality(landmarks: NormalizedLandmark[]): {
  quality: number;
  issues: string[];
} {
  const issues: string[] = [];
  let quality = 1.0;

  const keyPoints = [11, 12, 23, 24, 25, 26, 27, 28];
  const avgKeyVisibility = avgVisibility(landmarks, keyPoints);
  if (avgKeyVisibility < 0.7) {
    quality -= 0.3;
    issues.push("Some body parts are not clearly visible");
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
  if (shoulderTilt > 0.05) {
    quality -= 0.1;
    issues.push("Shoulders are not level");
  }

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const hipTilt = Math.abs(leftHip.y - rightHip.y);
  if (hipTilt > 0.05) {
    quality -= 0.1;
    issues.push("Hips are not level");
  }

  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const nose = landmarks[0];
  const ankleY = Math.max(leftAnkle.y, rightAnkle.y);
  const headY = nose.y;
  const bodyHeight = ankleY - headY;
  
  if (bodyHeight < 0.5) {
    quality -= 0.2;
    issues.push("Stand further from the camera for full body capture");
  }

  return {
    quality: Math.max(0, quality),
    issues,
  };
}

export function drawPoseLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number
): void {
  const drawingUtils = new DrawingUtils(ctx);
  
  ctx.save();
  ctx.strokeStyle = "#c4a77d";
  ctx.fillStyle = "#c4a77d";
  ctx.lineWidth = 2;

  const connections = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [24, 26], [26, 28],
  ];

  for (const [start, end] of connections) {
    const startLandmark = landmarks[start];
    const endLandmark = landmarks[end];
    
    ctx.beginPath();
    ctx.moveTo(startLandmark.x * width, startLandmark.y * height);
    ctx.lineTo(endLandmark.x * width, endLandmark.y * height);
    ctx.stroke();
  }

  for (let i = 0; i < landmarks.length; i++) {
    const landmark = landmarks[i];
    const x = landmark.x * width;
    const y = landmark.y * height;
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();
}
