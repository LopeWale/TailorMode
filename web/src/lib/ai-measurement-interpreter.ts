import { GoogleGenAI, Type } from "@google/genai";
import { 
  MEASUREMENT_CATALOG, 
  CLOTHING_PRESETS, 
  MeasurementDefinition,
  ClothingPreset,
  getRequiredCaptureViews 
} from "./measurement-types";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

export interface GarmentAnalysisResult {
  understood: boolean;
  garmentType: string;
  garmentDescription: string;
  requiredMeasurements: MeasurementDefinition[];
  optionalMeasurements: MeasurementDefinition[];
  captureViews: ("front" | "back" | "left" | "right")[];
  captureGuidance: string;
  fitConsiderations: string[];
  clarificationNeeded?: string;
  suggestedPreset?: ClothingPreset;
}

export interface MeasurementInterpretation {
  measurementIds: string[];
  reasoning: string;
  fitType: "loose" | "regular" | "fitted" | "custom";
  additionalNotes: string[];
}

const GARMENT_ANALYSIS_CONTEXT = `
You are TailorMode's AI measurement expert. Your role is to analyze garment descriptions and determine exactly which body measurements are needed.

AVAILABLE MEASUREMENTS (use these exact IDs):
${Object.entries(MEASUREMENT_CATALOG).map(([id, m]) => 
  `- ${id}: ${m.displayName} (${m.type}) - ${m.description}`
).join('\n')}

STANDARD PRESETS:
${Object.entries(CLOTHING_PRESETS).map(([id, p]) => 
  `- ${id}: ${p.displayName} - Required: ${p.requiredMeasurements.join(', ')}`
).join('\n')}

MEASUREMENT SELECTION RULES:
1. Always include measurements that directly affect fit and construction
2. For upper body garments: chest, shoulder_width are almost always required
3. For lower body garments: waist, hip, inseam/outseam are critical
4. For full-length garments: include hollow_to_hem or appropriate length
5. Consider the garment's fit style:
   - Fitted: need more precise measurements including secondary ones (bicep, thigh, etc.)
   - Loose/relaxed: fewer measurements needed, focus on key dimensions
   - Tailored: all relevant measurements including optional ones

CAPTURE GUIDANCE RULES:
1. Always specify which views (front, back, left, right) are needed
2. Explain why each view is important for the measurements
3. Include posture and positioning tips
4. Mention any clothing requirements (fitted clothing, bare arms, etc.)
`;

export async function analyzeGarmentDescription(
  description: string,
  additionalContext?: { fitPreference?: string; occasion?: string }
): Promise<GarmentAnalysisResult> {
  const contextInfo = additionalContext 
    ? `\nFit preference: ${additionalContext.fitPreference || 'not specified'}\nOccasion: ${additionalContext.occasion || 'not specified'}`
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${GARMENT_ANALYSIS_CONTEXT}${contextInfo}

User's garment description: "${description}"

Analyze this garment and respond with:
1. What type of garment this is
2. Which measurements are REQUIRED (essential for construction)
3. Which measurements are OPTIONAL (for better fit)
4. Which capture views are needed
5. Specific capture guidance for the user
6. Fit considerations the tailor should know
7. If the description is unclear, what clarification is needed

Use only measurement IDs from the available measurements list.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          understood: { type: Type.BOOLEAN },
          garmentType: { type: Type.STRING },
          garmentDescription: { type: Type.STRING },
          requiredMeasurementIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          optionalMeasurementIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          captureViews: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          captureGuidance: { type: Type.STRING },
          fitConsiderations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          clarificationNeeded: { type: Type.STRING },
          suggestedPresetId: { type: Type.STRING },
        },
        required: ["understood", "garmentType", "requiredMeasurementIds", "captureViews", "captureGuidance"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response from garment analysis");
  }

  const parsed = JSON.parse(responseText);
  
  const requiredMeasurements = parsed.requiredMeasurementIds
    .map((id: string) => MEASUREMENT_CATALOG[id])
    .filter((m: MeasurementDefinition | undefined): m is MeasurementDefinition => m !== undefined);
  
  const optionalMeasurements = (parsed.optionalMeasurementIds || [])
    .map((id: string) => MEASUREMENT_CATALOG[id])
    .filter((m: MeasurementDefinition | undefined): m is MeasurementDefinition => m !== undefined);

  const captureViews = parsed.captureViews.filter(
    (v: string): v is "front" | "back" | "left" | "right" => 
      ["front", "back", "left", "right"].includes(v)
  );

  return {
    understood: parsed.understood,
    garmentType: parsed.garmentType,
    garmentDescription: parsed.garmentDescription || description,
    requiredMeasurements,
    optionalMeasurements,
    captureViews: captureViews.length > 0 ? captureViews : getRequiredCaptureViews(parsed.requiredMeasurementIds),
    captureGuidance: parsed.captureGuidance,
    fitConsiderations: parsed.fitConsiderations || [],
    clarificationNeeded: parsed.clarificationNeeded,
    suggestedPreset: parsed.suggestedPresetId ? CLOTHING_PRESETS[parsed.suggestedPresetId] : undefined,
  };
}

export async function refineMeasurementSelection(
  currentMeasurements: string[],
  userFeedback: string,
  garmentContext: string
): Promise<MeasurementInterpretation> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${GARMENT_ANALYSIS_CONTEXT}

Current garment: ${garmentContext}
Currently selected measurements: ${currentMeasurements.join(', ')}

User's feedback/request: "${userFeedback}"

Based on this feedback, provide:
1. The updated list of measurement IDs needed
2. Your reasoning for the changes
3. The fit type this suggests (loose, regular, fitted, custom)
4. Any additional notes for the measurement process`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          measurementIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          reasoning: { type: Type.STRING },
          fitType: { type: Type.STRING },
          additionalNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["measurementIds", "reasoning", "fitType"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response from measurement refinement");
  }

  const parsed = JSON.parse(responseText);
  
  const validMeasurementIds = parsed.measurementIds.filter(
    (id: string) => MEASUREMENT_CATALOG[id] !== undefined
  );

  return {
    measurementIds: validMeasurementIds,
    reasoning: parsed.reasoning,
    fitType: ["loose", "regular", "fitted", "custom"].includes(parsed.fitType) 
      ? parsed.fitType 
      : "regular",
    additionalNotes: parsed.additionalNotes || [],
  };
}

export async function generateCaptureInstructions(
  measurements: MeasurementDefinition[],
  captureViews: ("front" | "back" | "left" | "right")[]
): Promise<{
  viewInstructions: Record<string, string>;
  generalGuidance: string;
  poseRequirements: string[];
  clothingRequirements: string[];
}> {
  const measurementSummary = measurements
    .map(m => `${m.displayName}: ${m.description}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are helping a user prepare for a 3D body scan for tailoring measurements.

Measurements needed:
${measurementSummary}

Required capture views: ${captureViews.join(', ')}

Generate specific instructions for:
1. Each capture view (what to do during that angle)
2. General guidance for the whole capture session
3. Required pose/posture for accurate measurements
4. Clothing requirements (what to wear)

Be concise but clear. Focus on what matters for measurement accuracy.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          viewInstructions: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              left: { type: Type.STRING },
              right: { type: Type.STRING },
            },
          },
          generalGuidance: { type: Type.STRING },
          poseRequirements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          clothingRequirements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["viewInstructions", "generalGuidance", "poseRequirements", "clothingRequirements"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response from capture instructions");
  }

  return JSON.parse(responseText);
}

export async function interpretMeasurementQuery(
  query: string,
  availableMeasurements: MeasurementDefinition[],
  meshContext?: { hasLandmarks: boolean; confidenceScores: Record<string, number> }
): Promise<{
  intent: "get_measurement" | "compare" | "explain" | "suggest" | "unknown";
  targetMeasurements: string[];
  response: string;
  actionRequired?: string;
}> {
  const availableIds = availableMeasurements.map(m => m.id).join(', ');
  const confidenceInfo = meshContext?.confidenceScores 
    ? `\nCurrent confidence scores: ${JSON.stringify(meshContext.confidenceScores)}`
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are TailorMode's measurement assistant helping a tailor.

Available measurements: ${availableIds}
Mesh available: ${meshContext?.hasLandmarks ? 'Yes, with landmarks' : 'No mesh yet'}${confidenceInfo}

Tailor's query: "${query}"

Determine:
1. What the tailor wants (get a measurement, compare values, explain something, get suggestions)
2. Which measurements are relevant
3. A helpful response
4. Any action needed (like triggering a measurement computation)`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intent: { type: Type.STRING },
          targetMeasurements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          response: { type: Type.STRING },
          actionRequired: { type: Type.STRING },
        },
        required: ["intent", "targetMeasurements", "response"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response from query interpretation");
  }

  const parsed = JSON.parse(responseText);
  
  const validIntent = ["get_measurement", "compare", "explain", "suggest", "unknown"].includes(parsed.intent)
    ? parsed.intent
    : "unknown";

  return {
    intent: validIntent,
    targetMeasurements: parsed.targetMeasurements.filter(
      (id: string) => availableMeasurements.some(m => m.id === id)
    ),
    response: parsed.response,
    actionRequired: parsed.actionRequired,
  };
}
