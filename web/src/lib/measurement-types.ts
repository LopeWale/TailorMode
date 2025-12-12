export type MeasurementType = "circumference" | "length" | "distance";

export interface Landmark {
  id: string;
  name: string;
  description: string;
  bodyRegion: "head" | "torso" | "arms" | "legs";
}

export interface MeasurementDefinition {
  id: string;
  name: string;
  displayName: string;
  type: MeasurementType;
  landmarkStart: string;
  landmarkEnd: string;
  plane?: string;
  description: string;
  captureRequirements: string[];
  minConfidence: number;
}

export interface ClothingPreset {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  requiredMeasurements: string[];
  optionalMeasurements: string[];
  captureViews: ("front" | "back" | "left" | "right")[];
  fitGuidance: string;
}

export interface MeasurementResult {
  measurementId: string;
  value: number;
  unit: "cm" | "in";
  confidence: number;
  captureAttempts: number;
  status: "pending" | "captured" | "validated" | "flagged";
  flagReason?: string;
}

export interface MeasurementSession {
  id: string;
  userId: string;
  presetId?: string;
  customGarmentDescription?: string;
  requiredMeasurements: string[];
  results: MeasurementResult[];
  status: "in_progress" | "completed" | "needs_review";
  createdAt: Date;
  updatedAt: Date;
}

export const STANDARD_LANDMARKS: Record<string, Landmark> = {
  crown: { id: "crown", name: "Crown", description: "Top of the head", bodyRegion: "head" },
  forehead: { id: "forehead", name: "Forehead", description: "Center of forehead", bodyRegion: "head" },
  chin: { id: "chin", name: "Chin", description: "Bottom of chin", bodyRegion: "head" },
  ear_left: { id: "ear_left", name: "Left Ear", description: "Left ear lobe", bodyRegion: "head" },
  ear_right: { id: "ear_right", name: "Right Ear", description: "Right ear lobe", bodyRegion: "head" },
  
  neck_base: { id: "neck_base", name: "Neck Base", description: "Base of neck where it meets shoulders", bodyRegion: "torso" },
  neck_front: { id: "neck_front", name: "Neck Front", description: "Front hollow of neck", bodyRegion: "torso" },
  shoulder_left: { id: "shoulder_left", name: "Left Shoulder", description: "Left shoulder point", bodyRegion: "torso" },
  shoulder_right: { id: "shoulder_right", name: "Right Shoulder", description: "Right shoulder point", bodyRegion: "torso" },
  chest_center: { id: "chest_center", name: "Chest Center", description: "Center of chest at fullest point", bodyRegion: "torso" },
  bust_point_left: { id: "bust_point_left", name: "Left Bust Point", description: "Left bust apex", bodyRegion: "torso" },
  bust_point_right: { id: "bust_point_right", name: "Right Bust Point", description: "Right bust apex", bodyRegion: "torso" },
  waist_center: { id: "waist_center", name: "Waist Center", description: "Natural waist at narrowest point", bodyRegion: "torso" },
  waist_front: { id: "waist_front", name: "Waist Front", description: "Front center of waist", bodyRegion: "torso" },
  waist_back: { id: "waist_back", name: "Waist Back", description: "Back center of waist", bodyRegion: "torso" },
  hip_center: { id: "hip_center", name: "Hip Center", description: "Center of hips at fullest point", bodyRegion: "torso" },
  
  shoulder_point_left: { id: "shoulder_point_left", name: "Left Shoulder Point", description: "Outer edge of left shoulder", bodyRegion: "arms" },
  shoulder_point_right: { id: "shoulder_point_right", name: "Right Shoulder Point", description: "Outer edge of right shoulder", bodyRegion: "arms" },
  elbow_left: { id: "elbow_left", name: "Left Elbow", description: "Left elbow joint", bodyRegion: "arms" },
  elbow_right: { id: "elbow_right", name: "Right Elbow", description: "Right elbow joint", bodyRegion: "arms" },
  wrist_left: { id: "wrist_left", name: "Left Wrist", description: "Left wrist bone", bodyRegion: "arms" },
  wrist_right: { id: "wrist_right", name: "Right Wrist", description: "Right wrist bone", bodyRegion: "arms" },
  bicep_left: { id: "bicep_left", name: "Left Bicep", description: "Fullest part of left upper arm", bodyRegion: "arms" },
  bicep_right: { id: "bicep_right", name: "Right Bicep", description: "Fullest part of right upper arm", bodyRegion: "arms" },
  
  hip_left: { id: "hip_left", name: "Left Hip", description: "Left hip bone", bodyRegion: "legs" },
  hip_right: { id: "hip_right", name: "Right Hip", description: "Right hip bone", bodyRegion: "legs" },
  crotch: { id: "crotch", name: "Crotch", description: "Crotch point", bodyRegion: "legs" },
  knee_left: { id: "knee_left", name: "Left Knee", description: "Left knee cap", bodyRegion: "legs" },
  knee_right: { id: "knee_right", name: "Right Knee", description: "Right knee cap", bodyRegion: "legs" },
  thigh_left: { id: "thigh_left", name: "Left Thigh", description: "Fullest part of left thigh", bodyRegion: "legs" },
  thigh_right: { id: "thigh_right", name: "Right Thigh", description: "Fullest part of right thigh", bodyRegion: "legs" },
  calf_left: { id: "calf_left", name: "Left Calf", description: "Fullest part of left calf", bodyRegion: "legs" },
  calf_right: { id: "calf_right", name: "Right Calf", description: "Fullest part of right calf", bodyRegion: "legs" },
  ankle_left: { id: "ankle_left", name: "Left Ankle", description: "Left ankle bone", bodyRegion: "legs" },
  ankle_right: { id: "ankle_right", name: "Right Ankle", description: "Right ankle bone", bodyRegion: "legs" },
  floor: { id: "floor", name: "Floor", description: "Ground level", bodyRegion: "legs" },
};

export const MEASUREMENT_CATALOG: Record<string, MeasurementDefinition> = {
  chest: {
    id: "chest",
    name: "chest",
    displayName: "Chest",
    type: "circumference",
    landmarkStart: "chest_center",
    landmarkEnd: "chest_center",
    plane: "horizontal_chest",
    description: "Full circumference around the chest at the fullest point, under the arms",
    captureRequirements: ["front", "back", "left", "right"],
    minConfidence: 0.85,
  },
  bust: {
    id: "bust",
    name: "bust",
    displayName: "Bust",
    type: "circumference",
    landmarkStart: "bust_point_left",
    landmarkEnd: "bust_point_right",
    plane: "horizontal_bust",
    description: "Full circumference around the bust at the fullest point",
    captureRequirements: ["front", "back", "left", "right"],
    minConfidence: 0.85,
  },
  waist: {
    id: "waist",
    name: "waist",
    displayName: "Waist",
    type: "circumference",
    landmarkStart: "waist_center",
    landmarkEnd: "waist_center",
    plane: "horizontal_waist",
    description: "Full circumference around the natural waist at the narrowest point",
    captureRequirements: ["front", "back", "left", "right"],
    minConfidence: 0.85,
  },
  hip: {
    id: "hip",
    name: "hip",
    displayName: "Hip",
    type: "circumference",
    landmarkStart: "hip_center",
    landmarkEnd: "hip_center",
    plane: "horizontal_hip",
    description: "Full circumference around the hips at the fullest point",
    captureRequirements: ["front", "back", "left", "right"],
    minConfidence: 0.85,
  },
  neck: {
    id: "neck",
    name: "neck",
    displayName: "Neck",
    type: "circumference",
    landmarkStart: "neck_base",
    landmarkEnd: "neck_base",
    plane: "horizontal_neck",
    description: "Circumference around the base of the neck",
    captureRequirements: ["front", "back"],
    minConfidence: 0.80,
  },
  shoulder_width: {
    id: "shoulder_width",
    name: "shoulder_width",
    displayName: "Shoulder Width",
    type: "distance",
    landmarkStart: "shoulder_point_left",
    landmarkEnd: "shoulder_point_right",
    description: "Distance from left shoulder point to right shoulder point across the back",
    captureRequirements: ["back"],
    minConfidence: 0.90,
  },
  arm_length: {
    id: "arm_length",
    name: "arm_length",
    displayName: "Arm Length",
    type: "length",
    landmarkStart: "shoulder_point_right",
    landmarkEnd: "wrist_right",
    description: "Length from shoulder point to wrist bone along the arm",
    captureRequirements: ["right"],
    minConfidence: 0.85,
  },
  sleeve_length: {
    id: "sleeve_length",
    name: "sleeve_length",
    displayName: "Sleeve Length",
    type: "length",
    landmarkStart: "neck_base",
    landmarkEnd: "wrist_right",
    description: "Length from center back neck to wrist (for set-in sleeves)",
    captureRequirements: ["back", "right"],
    minConfidence: 0.85,
  },
  back_length: {
    id: "back_length",
    name: "back_length",
    displayName: "Back Length",
    type: "length",
    landmarkStart: "neck_base",
    landmarkEnd: "waist_back",
    description: "Length from center back neck to waist",
    captureRequirements: ["back"],
    minConfidence: 0.85,
  },
  inseam: {
    id: "inseam",
    name: "inseam",
    displayName: "Inseam",
    type: "length",
    landmarkStart: "crotch",
    landmarkEnd: "floor",
    description: "Length from crotch to floor along inner leg",
    captureRequirements: ["front", "left"],
    minConfidence: 0.85,
  },
  outseam: {
    id: "outseam",
    name: "outseam",
    displayName: "Outseam",
    type: "length",
    landmarkStart: "waist_center",
    landmarkEnd: "floor",
    description: "Length from waist to floor along outer leg",
    captureRequirements: ["left", "right"],
    minConfidence: 0.85,
  },
  thigh: {
    id: "thigh",
    name: "thigh",
    displayName: "Thigh",
    type: "circumference",
    landmarkStart: "thigh_right",
    landmarkEnd: "thigh_right",
    plane: "horizontal_thigh",
    description: "Circumference around the fullest part of the thigh",
    captureRequirements: ["front", "right"],
    minConfidence: 0.80,
  },
  knee: {
    id: "knee",
    name: "knee",
    displayName: "Knee",
    type: "circumference",
    landmarkStart: "knee_right",
    landmarkEnd: "knee_right",
    plane: "horizontal_knee",
    description: "Circumference around the knee",
    captureRequirements: ["front", "right"],
    minConfidence: 0.80,
  },
  calf: {
    id: "calf",
    name: "calf",
    displayName: "Calf",
    type: "circumference",
    landmarkStart: "calf_right",
    landmarkEnd: "calf_right",
    plane: "horizontal_calf",
    description: "Circumference around the fullest part of the calf",
    captureRequirements: ["right"],
    minConfidence: 0.80,
  },
  bicep: {
    id: "bicep",
    name: "bicep",
    displayName: "Bicep",
    type: "circumference",
    landmarkStart: "bicep_right",
    landmarkEnd: "bicep_right",
    plane: "horizontal_bicep",
    description: "Circumference around the fullest part of the upper arm",
    captureRequirements: ["right"],
    minConfidence: 0.80,
  },
  wrist: {
    id: "wrist",
    name: "wrist",
    displayName: "Wrist",
    type: "circumference",
    landmarkStart: "wrist_right",
    landmarkEnd: "wrist_right",
    plane: "horizontal_wrist",
    description: "Circumference around the wrist bone",
    captureRequirements: ["right"],
    minConfidence: 0.85,
  },
  hollow_to_hem: {
    id: "hollow_to_hem",
    name: "hollow_to_hem",
    displayName: "Hollow to Hem",
    type: "length",
    landmarkStart: "neck_front",
    landmarkEnd: "floor",
    description: "Length from hollow of neck (front) to desired hem length",
    captureRequirements: ["front"],
    minConfidence: 0.85,
  },
  torso_length: {
    id: "torso_length",
    name: "torso_length",
    displayName: "Torso Length",
    type: "length",
    landmarkStart: "shoulder_point_right",
    landmarkEnd: "waist_center",
    description: "Length from shoulder to waist",
    captureRequirements: ["front", "back"],
    minConfidence: 0.85,
  },
  rise: {
    id: "rise",
    name: "rise",
    displayName: "Rise",
    type: "length",
    landmarkStart: "waist_front",
    landmarkEnd: "crotch",
    description: "Length from waist to crotch (front rise)",
    captureRequirements: ["front", "left"],
    minConfidence: 0.80,
  },
  skirt_length: {
    id: "skirt_length",
    name: "skirt_length",
    displayName: "Skirt Length",
    type: "length",
    landmarkStart: "waist_center",
    landmarkEnd: "knee_right",
    description: "Length from waist to desired skirt hem (knee level default)",
    captureRequirements: ["front", "left"],
    minConfidence: 0.85,
  },
  across_back: {
    id: "across_back",
    name: "across_back",
    displayName: "Across Back",
    type: "distance",
    landmarkStart: "shoulder_left",
    landmarkEnd: "shoulder_right",
    description: "Width across the back from armhole seam to armhole seam",
    captureRequirements: ["back"],
    minConfidence: 0.85,
  },
  across_chest: {
    id: "across_chest",
    name: "across_chest",
    displayName: "Across Chest",
    type: "distance",
    landmarkStart: "shoulder_left",
    landmarkEnd: "shoulder_right",
    description: "Width across the chest from armhole seam to armhole seam",
    captureRequirements: ["front"],
    minConfidence: 0.85,
  },
};

export const CLOTHING_PRESETS: Record<string, ClothingPreset> = {
  shirt: {
    id: "shirt",
    name: "shirt",
    displayName: "Shirt / Blouse",
    description: "Standard button-up shirt or blouse measurements",
    icon: "shirt",
    requiredMeasurements: ["chest", "waist", "shoulder_width", "arm_length", "neck"],
    optionalMeasurements: ["bicep", "wrist", "back_length", "across_back"],
    captureViews: ["front", "back", "left", "right"],
    fitGuidance: "For fitted shirts, we'll need precise chest and waist measurements. Stand naturally with arms slightly away from body.",
  },
  pants: {
    id: "pants",
    name: "pants",
    displayName: "Trousers / Pants",
    description: "Standard trouser and pants measurements",
    icon: "pants",
    requiredMeasurements: ["waist", "hip", "inseam", "outseam", "thigh"],
    optionalMeasurements: ["knee", "calf", "rise"],
    captureViews: ["front", "back", "left", "right"],
    fitGuidance: "Stand straight with feet shoulder-width apart. We'll measure from natural waist to floor.",
  },
  dress: {
    id: "dress",
    name: "dress",
    displayName: "Dress",
    description: "Full dress measurements including bodice and skirt",
    icon: "dress",
    requiredMeasurements: ["bust", "waist", "hip", "hollow_to_hem", "shoulder_width"],
    optionalMeasurements: ["arm_length", "back_length", "across_chest", "across_back"],
    captureViews: ["front", "back", "left", "right"],
    fitGuidance: "Stand naturally. We'll capture full-length measurements for both bodice and skirt portions.",
  },
  jacket: {
    id: "jacket",
    name: "jacket",
    displayName: "Suit Jacket / Blazer",
    description: "Tailored jacket and blazer measurements",
    icon: "jacket",
    requiredMeasurements: ["chest", "waist", "shoulder_width", "arm_length", "back_length"],
    optionalMeasurements: ["bicep", "wrist", "across_back", "neck"],
    captureViews: ["front", "back", "left", "right"],
    fitGuidance: "Stand with arms relaxed at sides. Jacket measurements require precision across shoulders and chest.",
  },
  skirt: {
    id: "skirt",
    name: "skirt",
    displayName: "Skirt",
    description: "Skirt measurements from waist to hem",
    icon: "skirt",
    requiredMeasurements: ["waist", "hip", "skirt_length"],
    optionalMeasurements: ["thigh"],
    captureViews: ["front", "back", "left"],
    fitGuidance: "Stand naturally. We'll measure waist, hips, and length from waist to desired hem.",
  },
  vest: {
    id: "vest",
    name: "vest",
    displayName: "Vest / Waistcoat",
    description: "Vest and waistcoat measurements",
    icon: "vest",
    requiredMeasurements: ["chest", "waist", "shoulder_width", "back_length"],
    optionalMeasurements: ["neck", "across_back"],
    captureViews: ["front", "back"],
    fitGuidance: "Stand straight with arms at sides. Vests require close-fitting chest and waist measurements.",
  },
};

export function getMeasurementById(id: string): MeasurementDefinition | undefined {
  return MEASUREMENT_CATALOG[id];
}

export function getPresetById(id: string): ClothingPreset | undefined {
  return CLOTHING_PRESETS[id];
}

export function getMeasurementsForPreset(presetId: string): MeasurementDefinition[] {
  const preset = CLOTHING_PRESETS[presetId];
  if (!preset) return [];
  
  return preset.requiredMeasurements
    .map(id => MEASUREMENT_CATALOG[id])
    .filter((m): m is MeasurementDefinition => m !== undefined);
}

export function getOptionalMeasurementsForPreset(presetId: string): MeasurementDefinition[] {
  const preset = CLOTHING_PRESETS[presetId];
  if (!preset) return [];
  
  return preset.optionalMeasurements
    .map(id => MEASUREMENT_CATALOG[id])
    .filter((m): m is MeasurementDefinition => m !== undefined);
}

export function getRequiredCaptureViews(measurementIds: string[]): ("front" | "back" | "left" | "right")[] {
  const views = new Set<"front" | "back" | "left" | "right">();
  
  for (const id of measurementIds) {
    const measurement = MEASUREMENT_CATALOG[id];
    if (measurement) {
      measurement.captureRequirements.forEach(view => {
        views.add(view as "front" | "back" | "left" | "right");
      });
    }
  }
  
  return Array.from(views);
}

export function createMeasurementSession(
  userId: string,
  presetId?: string,
  customDescription?: string,
  measurementIds?: string[]
): MeasurementSession {
  let requiredMeasurements: string[] = [];
  
  if (presetId) {
    const preset = CLOTHING_PRESETS[presetId];
    if (preset) {
      requiredMeasurements = [...preset.requiredMeasurements];
    }
  } else if (measurementIds) {
    requiredMeasurements = measurementIds;
  }
  
  return {
    id: crypto.randomUUID(),
    userId,
    presetId,
    customGarmentDescription: customDescription,
    requiredMeasurements,
    results: requiredMeasurements.map(id => ({
      measurementId: id,
      value: 0,
      unit: "cm",
      confidence: 0,
      captureAttempts: 0,
      status: "pending",
    })),
    status: "in_progress",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function validateMeasurementResult(
  result: MeasurementResult,
  definition: MeasurementDefinition
): { valid: boolean; reason?: string } {
  if (result.confidence < definition.minConfidence) {
    if (result.captureAttempts >= 3) {
      return { valid: false, reason: "Low confidence after 3 attempts - flagged for manual review" };
    }
    return { valid: false, reason: `Confidence ${(result.confidence * 100).toFixed(0)}% below minimum ${(definition.minConfidence * 100).toFixed(0)}%` };
  }
  
  return { valid: true };
}
