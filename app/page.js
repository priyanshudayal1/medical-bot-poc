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
      "నమస్కారం! నేను డాక్టర్ హెల్త్ఏఐ, మీ వైద్య సహాయకుడిని. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను? దయచేసి మీ లక్షణాలు లేదా ఆరోగ్య సమస్యలను వివరించండి.";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Header with enhanced styling */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo with enhanced animation */}
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
              <div className="relative bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-2xl shadow-xl">
                <MdHealthAndSafety className="text-3xl text-white" />
              </div>
            </motion.div>

            {/* Title section */}
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent"
              >
                Dr. HealthAI
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-600 dark:text-gray-400 font-medium"
              >
                Your Virtual Medical Assistant
              </motion.p>
            </div>
          </div>

          <StatusIndicator
            status={status}
            message={
              status === "connecting"
                ? "Initializing"
                : status === "connected"
                ? "Ready"
                : status === "listening"
                ? "Listening"
                : status === "processing"
                ? "Thinking"
                : status === "speaking"
                ? "Speaking"
                : "Error"
            }
          />
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chat Section with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 h-[calc(100vh-180px)] flex flex-col overflow-hidden">
              {/* Chat header */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-600/20 px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Conversation
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {messages.length} messages
                  </span>
                </div>
              </div>

              {/* Messages with custom scrollbar */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} index={index} />
                  ))}
                </AnimatePresence>

                {/* Current transcript with enhanced styling */}
                {currentTranscript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-4 mb-4 flex-row-reverse"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg ring-2 ring-green-400/50"
                    >
                      <FaMicrophone className="text-white text-lg" />
                    </motion.div>
                    <div className="max-w-[75%] rounded-2xl px-5 py-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 border border-gray-300 dark:border-gray-600 shadow-md">
                      <p className="text-sm text-gray-700 dark:text-gray-200 italic font-medium">
                        {currentTranscript}
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          ...
                        </motion.span>
                      </p>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Voice Visualizer with enhanced container */}
              <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/30 p-4">
                <VoiceVisualizer
                  isActive={isListening || isBotSpeaking}
                  type={isListening ? "listening" : "speaking"}
                />
              </div>
            </div>
          </motion.div>

          {/* Control Panel with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Call Control with enhanced design */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            >
              <h3 className="text-lg font-bold mb-5 flex items-center gap-3 text-gray-800 dark:text-white">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaHeartbeat className="text-2xl text-red-500" />
                </motion.div>
                Voice Call
              </h3>

              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={isCallActive ? endCall : startCall}
                  disabled={!isInitialized || status === "error"}
                  className={`w-full py-5 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-3 shadow-lg relative overflow-hidden ${
                    isCallActive
                      ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/30"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-green-500/30"
                  }`}
                >
                  {/* Button glow effect */}
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute inset-0 ${
                      isCallActive ? "bg-red-500/30" : "bg-green-500/30"
                    } blur-xl`}
                  />

                  <span className="relative z-10 flex items-center gap-3">
                    {isCallActive ? (
                      <>
                        <FaPhoneSlash className="text-2xl" />
                        End Call
                      </>
                    ) : (
                      <>
                        <FaPhone className="text-2xl" />
                        Start Call
                      </>
                    )}
                  </span>
                </motion.button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border border-red-300 dark:border-red-700 rounded-2xl text-sm text-red-800 dark:text-red-200 font-medium shadow-lg"
                  >
                    {error}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Status Info with enhanced design */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            >
              <h3 className="text-lg font-bold mb-5 flex items-center gap-3 text-gray-800 dark:text-white">
                <FaRobot className="text-2xl text-blue-500" />
                Bot Status
              </h3>

              <div className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/30 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Listening
                  </span>
                  <div className="relative">
                    {isListening && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-green-500 rounded-full blur-md"
                      />
                    )}
                    <div
                      className={`w-4 h-4 rounded-full relative z-10 shadow-lg ${
                        isListening
                          ? "bg-green-500 animate-pulse"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-700 dark:to-purple-900/30 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Processing
                  </span>
                  <div className="relative">
                    {isProcessing && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-yellow-500 rounded-full blur-md"
                      />
                    )}
                    <div
                      className={`w-4 h-4 rounded-full relative z-10 shadow-lg ${
                        isProcessing
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-cyan-50 dark:from-gray-700 dark:to-cyan-900/30 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Speaking
                  </span>
                  <div className="relative">
                    {isBotSpeaking && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-500 rounded-full blur-md"
                      />
                    )}
                    <div
                      className={`w-4 h-4 rounded-full relative z-10 shadow-lg ${
                        isBotSpeaking
                          ? "bg-blue-500 animate-pulse"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Instructions with enhanced design */}
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 rounded-3xl shadow-2xl p-6 text-white relative overflow-hidden"
            >
              {/* Animated background pattern */}
              <motion.div
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)",
                  backgroundSize: "20px 20px",
                }}
              />

              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  💡
                </motion.span>
                How to Use
              </h3>
              <ol className="space-y-3 text-sm relative z-10">
                {[
                  { num: "1", text: 'Click "Start Call" to begin' },
                  { num: "2", text: "Speak your health concerns clearly" },
                  { num: "3", text: "Wait for Dr. HealthAI to respond" },
                  { num: "4", text: "Continue the conversation naturally" },
                ].map((item, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ x: 5 }}
                    className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3"
                  >
                    <span className="font-bold text-lg bg-white/20 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                      {item.num}
                    </span>
                    <span className="leading-relaxed font-medium">
                      {item.text}
                    </span>
                  </motion.li>
                ))}
              </ol>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
