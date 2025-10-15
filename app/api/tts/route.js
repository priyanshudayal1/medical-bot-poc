import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Use browser's built-in speech synthesis
    // This endpoint is mainly for configuration/testing
    // The actual TTS will be done on the client side for better performance

    return NextResponse.json({
      success: true,
      message: "Text received for speech synthesis",
      text,
    });
  } catch (error) {
    console.error("TTS API Error:", error);
    return NextResponse.json(
      { error: "Failed to process text-to-speech" },
      { status: 500 }
    );
  }
}
