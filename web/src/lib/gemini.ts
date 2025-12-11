import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

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
}

export async function analyzeBodyImage(imageBase64: string): Promise<MeasurementResult> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are an expert body measurement AI for a tailoring application. Analyze this image of a person and provide realistic body measurements.

IMPORTANT: Provide measurements in centimeters. Estimate based on typical human proportions if the full body is not visible.

Respond with a JSON object containing:
1. "measurements": Array of measurement objects with:
   - "name": measurement name (e.g., "Chest", "Waist", "Hip", "Shoulder Width", "Arm Length", "Inseam", "Height")
   - "value": numeric value in cm
   - "unit": "cm"
   - "confidence": 0-1 confidence score
   - "landmark_start": body landmark where measurement starts
   - "landmark_end": body landmark where measurement ends

2. "bodyType": one of "Athletic", "Slim", "Regular", "Plus"
3. "posture": description of posture quality
4. "recommendations": array of 2-3 brief tailoring recommendations

Provide at least 8 key measurements for tailoring purposes.`,
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          measurements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                landmark_start: { type: Type.STRING },
                landmark_end: { type: Type.STRING },
              },
              required: ["name", "value", "unit", "confidence", "landmark_start", "landmark_end"],
            },
          },
          bodyType: { type: Type.STRING },
          posture: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["measurements", "bodyType", "posture", "recommendations"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response from AI model");
  }

  try {
    return JSON.parse(responseText) as MeasurementResult;
  } catch {
    throw new Error("Invalid JSON response from AI model");
  }
}
