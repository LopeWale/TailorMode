import { NextRequest, NextResponse } from "next/server";
import { interpretMeasurementRequest, chatWithMeasurementAssistant } from "@/lib/measurement-service";

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [], mode = "assistant" } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (mode === "measurement") {
      const result = await interpretMeasurementRequest(message);
      return NextResponse.json({
        type: "measurement",
        ...result,
        timestamp: new Date().toISOString(),
      });
    }

    const response = await chatWithMeasurementAssistant(message, conversationHistory);

    return NextResponse.json({
      type: "chat",
      message: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
