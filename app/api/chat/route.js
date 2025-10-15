import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MEDICAL_BOT_SYSTEM_PROMPT = `You are Dr. HealthAI, a compassionate and knowledgeable medical assistant bot. Your role is to:

1. Provide helpful medical information and health advice
2. Listen carefully to symptoms and concerns
3. Offer general guidance but always remind users to consult healthcare professionals for serious issues
4. Be empathetic, clear, and reassuring in your responses
5. Keep responses concise and conversational (2-3 sentences for voice responses)
6. Never diagnose or prescribe medication - only provide general information
7. Always prioritize patient safety and encourage professional medical consultation when needed

Remember: You are providing general health information, not medical diagnosis or treatment. Always recommend consulting with a qualified healthcare provider for personalized medical advice.

Respond in a warm, professional, and conversational tone suitable for voice interaction.`;

export async function POST(request) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: MEDICAL_BOT_SYSTEM_PROMPT,
    });

    // Build conversation history
    // Filter out any messages before the first user message (e.g., bot introduction)
    // Gemini requires conversations to start with 'user' role
    let history = conversationHistory.map((msg) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Find the first user message index
    const firstUserIndex = history.findIndex((msg) => msg.role === "user");

    // If history starts with bot message, remove it
    if (firstUserIndex > 0) {
      history = history.slice(firstUserIndex);
    }

    // Start chat with history
    const chat = model.startChat({ history });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      response: text,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get response from medical bot",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
