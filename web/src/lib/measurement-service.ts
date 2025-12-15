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
  type: "circumference" | "length" | "distance" | "limb_circumference";
  landmark_start: string;
  landmark_end: string;
  plane?: string;
  description: string;
  params?: Record<string, any>;
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
- circumference: Measure around the body at a specific landmark plane (chest, waist, hip, neck)
- limb_circumference: Measure around a limb perpendicular to the bone axis (thigh, bicep, calf)
- distance: Geodesic distance along the body surface between two points (shoulder width, sleeve length, inseam)
- straight_distance: Straight-line distance between two points (height)

STANDARD LANDMARKS:
- Head: crown, forehead, chin, ear_left, ear_right
- Torso: neck_base, shoulder_left, shoulder_right, chest_center, waist_center, hip_center, navel
- Arms: shoulder_point_left, shoulder_point_right, elbow_left, elbow_right, wrist_left, wrist_right
- Legs: hip_left, hip_right, knee_left, knee_right, ankle_left, ankle_right, crotch, floor

COMMON TAILORING MEASUREMENTS MAPPING:
- "chest" → circumference at chest_center plane
- "waist" → circumference at waist_center plane
- "hips" → circumference at hip_center plane
- "shoulder width" → distance (geodesic) from shoulder_point_left to shoulder_point_right across back
- "sleeve length" → distance (geodesic) from shoulder_point to wrist
- "inseam" → distance (geodesic) from crotch to floor (inner leg)
- "outseam" → distance (geodesic) from waist_center to floor (outer leg)
- "hollow to hem" → distance (geodesic) from neck_base (front) to hem level
- "back length" → distance (geodesic) from neck_base (back) to waist_center
- "neck" → circumference at neck_base
- "thigh" → limb_circumference at thigh (between hip and knee, usually top 1/3)
- "bicep" → limb_circumference at upper arm (between shoulder and elbow, mid point)

When a tailor requests a measurement, map it to the correct type and landmarks.
For "limb_circumference", you can specify a "fraction" param (0.0 to 1.0) indicating position along the limb (0=start, 1=end). Default is 0.5.
For "circumference", you can specify a "normal" vector if needed, but usually default [0,1,0] is fine for standing.

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
                params: {
                  type: Type.OBJECT,
                  properties: {
                     fraction: { type: Type.NUMBER },
                     normal: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                  }
                },
              },
              required: ["name", "type", "description", "landmark_start", "landmark_end"],
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

export async function getMeasurementRequirements(garmentDescription: string): Promise<{
    explanation: string;
    requiredMeasurements: string[];
}> {
    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a professional tailor assistant.
User wants to make/alter: "${garmentDescription}"

1. List the essential body measurements required for this garment.
2. Explain briefly WHY each measurement is needed and how it affects the fit.
3. Provide the response in JSON format.`,
          },
        ],
      },
    ],
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                explanation: { type: Type.STRING },
                requiredMeasurements: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["explanation", "requiredMeasurements"]
        }
    }
  });

  const responseText = response.text;
  if (!responseText) throw new Error("Empty response");

  return JSON.parse(responseText);
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
