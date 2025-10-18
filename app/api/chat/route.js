import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MEDICAL_BOT_SYSTEM_PROMPT = `You are Dr. HealthAI, a compassionate and knowledgeable medical assistant bot. Your role is to:

1. Provide helpful medical information and health advice
2. Listen carefully to symptoms and concerns in any language (especially English)
3. Offer general guidance but always remind users to consult healthcare professionals for serious issues
4. Be empathetic, clear, and reassuring in your responses
5. Keep responses concise and conversational (2-3 sentences for voice responses)
6. Never diagnose or prescribe medication - only provide general information
7. Always prioritize patient safety and encourage professional medical consultation when needed

Remember: You are providing general health information, not medical diagnosis or treatment. Always recommend consulting with a qualified healthcare provider for personalized medical advice.

CRITICAL LANGUAGE INSTRUCTION: You will receive questions in ENGLISH, but you MUST respond ONLY in Telugu language (తెలుగు). Always reply in Telugu script, not in English or transliteration. Translate the user's English input and respond naturally in Telugu. Respond in a warm, professional, and conversational tone suitable for voice interaction in Telugu.`;

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
    let history = conversationHistory
      .map((msg) => ({
        role: msg.role === "bot" ? "model" : "user",
        parts: [{ text: msg.content }],
      }))
      .filter(
        (msg) => msg.parts[0].text && msg.parts[0].text.trim().length > 0
      ); // Remove empty messages

    // Find the first user message index
    const firstUserIndex = history.findIndex((msg) => msg.role === "user");

    // If history starts with bot message, remove all messages before first user message
    if (firstUserIndex > 0) {
      history = history.slice(firstUserIndex);
    }

    // Additional validation: Ensure history alternates between user and model
    // and doesn't end with a user message (since we're sending a new user message)
    const validHistory = [];
    let expectedRole = "user";

    for (const msg of history) {
      if (msg.role === expectedRole) {
        validHistory.push(msg);
        expectedRole = expectedRole === "user" ? "model" : "user";
      }
    }

    // If history is not empty and ends with 'user', remove the last message
    // because we're about to send a new user message
    if (
      validHistory.length > 0 &&
      validHistory[validHistory.length - 1].role === "user"
    ) {
      validHistory.pop();
    }

    console.log("Conversation history length:", validHistory.length);
    console.log("First message role:", validHistory[0]?.role || "none");

    // Start chat with history
    const chat = model.startChat({ history: validHistory });

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
