"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaRobot,
  FaHeartbeat,
  FaPhone,
  FaPhoneSlash,
} from "react-icons/fa";
import { MdHealthAndSafety } from "react-icons/md";
import axios from "axios";
import useMedicalBotStore from "@/store/useMedicalBotStore";
import ChatMessage from "@/components/ChatMessage";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import StatusIndicator from "@/components/StatusIndicator";
import { SpeechRecognitionService, TextToSpeechService } from "@/utils/speech";

export default function Home() {
  const {
    messages,
    isListening,
    isBotSpeaking,
    isProcessing,
    addMessage,
    setListening,
    setBotSpeaking,
    setProcessing,
    setCurrentTranscript,
    currentTranscript,
  } = useMedicalBotStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [hasSpokenIntro, setHasSpokenIntro] = useState(false);

  const speechRecognitionRef = useRef(null);
  const textToSpeechRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentProcessingController = useRef(null); // Track current API request

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speak bot introduction
  const speakBotIntroduction = useCallback(async () => {
    // Don't speak intro if already spoken
    if (hasSpokenIntro) {
      return;
    }

    const introMessage =
      "Hello! I'm Dr. HealthAI, your medical assistant. How can I help you today? Feel free to describe any symptoms or health concerns you have.";

    addMessage({
      role: "bot",
      content: introMessage,
    });

    setHasSpokenIntro(true);

    // Check if TTS is ready before attempting to speak
    try {
      if (textToSpeechRef.current?.isReady()) {
        setBotSpeaking(true);
        await textToSpeechRef.current.speak(introMessage, { rate: 0.95 });
      } else {
        console.log(
          "Speech synthesis not ready yet, skipping voice introduction"
        );
      }
    } catch (err) {
      console.error("Speech synthesis error during introduction:", err);
      // Silently fail - message is still shown in UI
    } finally {
      setBotSpeaking(false);
    }
  }, [addMessage, setBotSpeaking, hasSpokenIntro]);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setStatus("connecting");

        // Initialize speech services
        speechRecognitionRef.current = new SpeechRecognitionService();
        textToSpeechRef.current = new TextToSpeechService();

        // Wait for TTS to fully initialize
        await textToSpeechRef.current.initialize();

        // Wait until the speech system is fully ready
        console.log("Waiting for speech system to be fully ready...");
        const isReady = await textToSpeechRef.current.waitUntilReady(
          10000,
          100
        );

        if (!isReady) {
          console.error("TTS failed to become ready within timeout");
          setError(
            "Voice system initialization timed out, but you can still use text chat"
          );
        } else {
          console.log("Speech system is fully ready!");
        }

        setStatus("connected");
        setIsInitialized(true);

        console.log("Initialization complete. Ready to start call.");
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err.message);
        setStatus("error");
      }
    };

    initializeServices();

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (textToSpeechRef.current) {
        textToSpeechRef.current.stop();
      }
    };
  }, []);

  // Start call and listening
  const startCall = async () => {
    if (!isInitialized) return;

    try {
      setIsCallActive(true);
      setError(null);

      // Speak bot introduction when call starts (only once)
      await speakBotIntroduction();

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      startListening();
    } catch (err) {
      console.error("Failed to start call:", err);
      setError("Failed to access microphone. Please grant permission.");
      setIsCallActive(false);
    }
  };

  // End call
  const endCall = () => {
    stopListening();
    setIsCallActive(false);
    if (textToSpeechRef.current) {
      textToSpeechRef.current.stop();
    }
  };

  // Start listening to user voice
  const startListening = () => {
    if (!speechRecognitionRef.current) {
      console.error("Speech recognition not initialized");
      return;
    }

    // Don't start if already listening
    if (isListening) {
      console.log("Already listening, skipping start");
      return;
    }

    console.log("Starting to listen...");
    setListening(true);
    setStatus("listening");
    setCurrentTranscript("");

    speechRecognitionRef.current.setOnResult(async ({ final, interim }) => {
      if (final) {
        setCurrentTranscript("");

        if (final.length > 3) {
          // Ignore very short utterances
          console.log("User said:", final);

          // DON'T stop listening - keep it running continuously
          // Just process the message in parallel

          // Add user message
          addMessage({
            role: "user",
            content: final,
          });

          // Process with AI (listening continues in background)
          processUserMessage(final);
        } else {
          console.log("Utterance too short, ignoring:", final);
        }
      } else {
        setCurrentTranscript(interim);
      }
    });

    speechRecognitionRef.current.setOnError((error) => {
      console.error("Speech recognition error:", error);
      if (error === "not-allowed") {
        setError("Microphone permission denied");
        setIsCallActive(false);
      } else if (error === "no-speech") {
        console.log("No speech detected, will auto-restart");
      }
      setListening(false);

      // Don't set error status for common errors
      if (error === "not-allowed") {
        setStatus("error");
      }
    });

    speechRecognitionRef.current.setOnEnd(() => {
      console.log("Speech recognition ended");
      setListening(false);

      // Auto-restart listening immediately if call is still active
      // Keep listening even while bot is speaking
      if (isCallActive) {
        console.log("Auto-restarting listening in 200ms...");
        setTimeout(() => {
          if (isCallActive && !isListening) {
            console.log("Restarting listening now");
            try {
              speechRecognitionRef.current.start();
              setListening(true);
              setStatus("listening");
            } catch (err) {
              console.error("Failed to restart listening:", err);
            }
          }
        }, 200);
      }
    });

    try {
      speechRecognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setListening(false);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setListening(false);
    setStatus("connected");
  };

  // Process user message with Gemini
  const processUserMessage = async (message) => {
    // Cancel any ongoing processing
    if (currentProcessingController.current) {
      console.log("⚠️ Cancelling previous request...");
      currentProcessingController.current.abort();
      currentProcessingController.current = null;
    }

    // Stop any ongoing speech immediately
    if (textToSpeechRef.current && isBotSpeaking) {
      console.log("⚠️ Interrupting bot speech...");
      textToSpeechRef.current.stop();
      setBotSpeaking(false);
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    currentProcessingController.current = abortController;

    setProcessing(true);
    setStatus("processing");

    try {
      const response = await axios.post(
        "/api/chat",
        {
          message,
          conversationHistory: messages.slice(-10), // Send last 10 messages for context
        },
        {
          signal: abortController.signal, // Pass abort signal
        }
      );

      // Check if this request was cancelled
      if (abortController.signal.aborted) {
        console.log("Request was cancelled, skipping response");
        return;
      }

      const botResponse = response.data.response;

      // Add bot message
      addMessage({
        role: "bot",
        content: botResponse,
      });

      // Force stop any previous speech before speaking new response
      if (textToSpeechRef.current) {
        textToSpeechRef.current.stop();
        console.log("🛑 Stopped any previous speech for new response");
      }

      // Small delay to ensure previous speech is fully stopped
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Speak the response
      setBotSpeaking(true);
      setStatus("speaking");

      try {
        if (textToSpeechRef.current?.isReady()) {
          console.log("🔊 Bot speaking NEW response...");
          await textToSpeechRef.current.speak(botResponse, { rate: 0.95 });
          console.log("✅ Bot finished speaking");
        } else {
          console.warn("TTS not ready, skipping speech");
        }
      } catch (speechErr) {
        // Check if it was interrupted (not an error)
        if (speechErr.message && speechErr.message.includes("interrupted")) {
          console.log("Speech was interrupted by newer query");
        } else {
          console.error("Speech synthesis error:", speechErr);
        }
      }

      setBotSpeaking(false);
    } catch (err) {
      // Check if request was cancelled
      if (
        axios.isCancel(err) ||
        err.name === "AbortError" ||
        err.name === "CanceledError"
      ) {
        console.log("✋ Request cancelled by user (new query received)");
        return; // Exit silently
      }

      console.error("Failed to process message:", err);

      // Check if it's an API key error
      let errorMessage =
        "I'm sorry, I'm having trouble processing your request right now. Please try again.";
      let errorDisplay = "Failed to get response from medical bot";

      if (
        err.response?.status === 500 &&
        err.response?.data?.error?.includes("API key")
      ) {
        errorMessage =
          "I'm sorry, but I'm not properly configured. Please check that the Gemini API key is set in the environment variables.";
        errorDisplay =
          "API key not configured. Please add GEMINI_API_KEY to .env.local file";
      }

      setError(errorDisplay);

      addMessage({
        role: "bot",
        content: errorMessage,
      });

      // Force stop any previous speech before speaking error
      if (textToSpeechRef.current) {
        textToSpeechRef.current.stop();
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      setBotSpeaking(true);
      try {
        if (textToSpeechRef.current?.isReady()) {
          console.log("🔊 Bot speaking error message...");
          await textToSpeechRef.current.speak(errorMessage);
        }
      } catch (speechErr) {
        console.error("Speech synthesis error:", speechErr);
      }
      setBotSpeaking(false);
    } finally {
      // Clear the controller reference if this is the current request
      if (currentProcessingController.current === abortController) {
        currentProcessingController.current = null;
      }

      setProcessing(false);
      setStatus("listening"); // Set status back to listening since it's continuous

      console.log("Processing complete. Listening continues in background.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <MdHealthAndSafety className="text-4xl text-blue-500" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Dr. HealthAI
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your Virtual Medical Assistant
              </p>
            </div>
          </div>

          <StatusIndicator
            status={status}
            message={
              status === "connecting"
                ? "Initializing..."
                : status === "connected"
                ? "Ready"
                : status === "listening"
                ? "Listening..."
                : status === "processing"
                ? "Thinking..."
                : "Connection Error"
            }
          />
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-[calc(100vh-200px)] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} index={index} />
                  ))}
                </AnimatePresence>

                {/* Current transcript */}
                {currentTranscript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 mb-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-500/20">
                      <FaMicrophone className="text-green-500" />
                    </div>
                    <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                        {currentTranscript}...
                      </p>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Voice Visualizer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <VoiceVisualizer
                  isActive={isListening || isBotSpeaking}
                  type={isListening ? "listening" : "speaking"}
                />
              </div>
            </div>
          </motion.div>

          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Call Control */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaHeartbeat className="text-red-500" />
                Voice Call
              </h3>

              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isCallActive ? endCall : startCall}
                  disabled={!isInitialized || status === "error"}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-3 ${
                    isCallActive
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  }`}
                >
                  {isCallActive ? (
                    <>
                      <FaPhoneSlash className="text-xl" />
                      End Call
                    </>
                  ) : (
                    <>
                      <FaPhone className="text-xl" />
                      Start Call
                    </>
                  )}
                </motion.button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-800 dark:text-red-200"
                  >
                    {error}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Status Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaRobot className="text-blue-500" />
                Bot Status
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Listening
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isListening ? "bg-green-500 animate-pulse" : "bg-gray-300"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Processing
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isProcessing
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-gray-300"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Speaking
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isBotSpeaking
                        ? "bg-blue-500 animate-pulse"
                        : "bg-gray-300"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">How to Use</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Click &quot;Start Call&quot; to begin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Speak your health concerns clearly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">3.</span>
                  <span>Wait for Dr. HealthAI to respond</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">4.</span>
                  <span>Continue the conversation naturally</span>
                </li>
              </ol>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
