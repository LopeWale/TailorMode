import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

export interface MeasurementDefinition {
  name: string;
  type: "circumference" | "length" | "distance";
  landmark_start: string;
  landmark_end: string;
  plane?: string;
  description: string;
}

export interface MeasurementAssistantResponse {
  understood: boolean;
  measurements: MeasurementDefinition[];
  clarification?: string;
  followUp?: string;
}

const MEASUREMENT_DSL_CONTEXT = `
You are a measurement assistant for TailorMode, a professional tailoring application.

AVAILABLE MEASUREMENT TYPES:
- circumference: Measure around the body at a specific plane (chest, waist, hip, neck, thigh, bicep)
- length: Measure along the body between two landmarks (arm length, inseam, torso length)
- distance: Straight-line distance between two points (shoulder width, hip width)

STANDARD LANDMARKS:
- Head: crown, forehead, chin, ear_left, ear_right
- Torso: neck_base, shoulder_left, shoulder_right, chest_center, waist_center, hip_center
- Arms: shoulder_point_left, shoulder_point_right, elbow_left, elbow_right, wrist_left, wrist_right
- Legs: hip_left, hip_right, knee_left, knee_right, ankle_left, ankle_right, crotch, floor

COMMON TAILORING MEASUREMENTS:
- "chest" → circumference at chest_center plane
- "waist" → circumference at waist_center plane
- "hips" → circumference at hip_center plane
- "shoulder width" → distance from shoulder_point_left to shoulder_point_right
- "arm length" or "sleeve length" → length from shoulder_point to wrist
- "inseam" → length from crotch to floor (inner leg)
- "outseam" → length from waist to floor (outer leg)
- "hollow to hem" → length from neck_base (front) to hem level
- "back length" → length from neck_base (back) to waist
- "neck" → circumference at neck_base
- "thigh" → circumference at upper thigh
- "bicep" → circumference at mid-upper-arm

When a tailor requests a measurement, map it to the correct type and landmarks.
If the request is ambiguous, ask for clarification.
`;

export async function interpretMeasurementRequest(
  request: string,
  context?: { previousMeasurements?: string[]; garmentType?: string }
): Promise<MeasurementAssistantResponse> {
  const contextInfo = context?.garmentType 
    ? `\nContext: Measuring for ${context.garmentType}.` 
    : "";
  
  const previousInfo = context?.previousMeasurements?.length
    ? `\nAlready measured: ${context.previousMeasurements.join(", ")}.`
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${MEASUREMENT_DSL_CONTEXT}${contextInfo}${previousInfo}

Tailor's request: "${request}"

Interpret this measurement request and respond with:
1. Whether you understood the request
2. The measurement definitions to execute
3. Any clarification needed
4. Any follow-up suggestions`,
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
          measurements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                landmark_start: { type: Type.STRING },
                landmark_end: { type: Type.STRING },
                plane: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "type", "description"],
            },
          },
          clarification: { type: Type.STRING },
          followUp: { type: Type.STRING },
        },
        required: ["understood", "measurements"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response from measurement assistant");
  }

  return JSON.parse(responseText) as MeasurementAssistantResponse;
}

export async function chatWithMeasurementAssistant(
  message: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const historyContext = conversationHistory
    .map((msg) => `${msg.role === "user" ? "Tailor" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${MEASUREMENT_DSL_CONTEXT}

You are helping a tailor take measurements. Respond conversationally but precisely.
When suggesting measurements, describe exactly what to measure.
If the tailor asks about fit or sizing, provide professional tailoring guidance.

Conversation history:
${historyContext}

Tailor: ${message}

Respond helpfully:`,
          },
        ],
      },
    ],
  });

  return response.text || "I'm sorry, I couldn't process that request. Please try again.";
}

export interface ComputedMeasurement {
  name: string;
  value: number;
  unit: string;
  confidence: number;
  type: "circumference" | "length" | "distance";
  landmarks: { start: string; end: string };
}

export function computeMeasurementFromMesh(
  meshData: Float32Array,
  landmarks: Map<string, [number, number, number]>,
  definition: MeasurementDefinition
): ComputedMeasurement {
  const startPos = landmarks.get(definition.landmark_start);
  const endPos = landmarks.get(definition.landmark_end);

  if (!startPos || !endPos) {
    throw new Error(`Landmarks not found: ${definition.landmark_start} or ${definition.landmark_end}`);
  }

  let value: number;
  let confidence = 0.9;

  switch (definition.type) {
    case "distance":
      const dx = endPos[0] - startPos[0];
      const dy = endPos[1] - startPos[1];
      const dz = endPos[2] - startPos[2];
      value = Math.sqrt(dx * dx + dy * dy + dz * dz) * 100;
      break;

    case "length":
      value = Math.abs(endPos[1] - startPos[1]) * 100;
      confidence = 0.85;
      break;

    case "circumference":
      const radius = Math.abs(endPos[0] - startPos[0]) / 2;
      value = 2 * Math.PI * radius * 100;
      confidence = 0.8;
      break;

    default:
      value = 0;
      confidence = 0;
  }

  return {
    name: definition.name,
    value: Math.round(value * 10) / 10,
    unit: "cm",
    confidence,
    type: definition.type,
    landmarks: {
      start: definition.landmark_start,
      end: definition.landmark_end,
    },
  };
}
