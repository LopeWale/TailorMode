import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { message, measurementContext } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a professional tailoring and body measurement assistant for TailorMode, an AI-powered body measurement application. Your role is to:

1. Help users understand their body measurements and what they mean for clothing fit
2. Provide tailoring advice and recommendations based on measurements
3. Explain how different measurements affect garment construction
4. Suggest alterations and adjustments for better fit
5. Answer questions about sizing, fabric choices, and garment styles

Guidelines:
- Be professional and helpful
- Provide accurate, practical advice
- Use metric measurements (centimeters) by default
- Never use emojis in responses
- Keep responses clear and concise
- When discussing measurements, explain their significance for fit

${measurementContext ? `Current user measurements context:\n${JSON.stringify(measurementContext, null, 2)}` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nUser question: ${message}`,
            },
          ],
        },
      ],
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI model");
    }

    return NextResponse.json({
      message: responseText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
