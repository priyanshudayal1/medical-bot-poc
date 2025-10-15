import { create } from "zustand";

const useMedicalBotStore = create((set, get) => ({
  // Connection state
  isConnected: false,
  socket: null,

  // Bot state
  isBotSpeaking: false,
  isListening: false,
  isProcessing: false,

  // Messages
  messages: [],
  currentTranscript: "",

  // Audio
  audioContext: null,
  mediaRecorder: null,
  audioChunks: [],

  // Actions
  setConnected: (status) => set({ isConnected: status }),

  setSocket: (socket) => set({ socket }),

  setBotSpeaking: (status) => set({ isBotSpeaking: status }),

  setListening: (status) => set({ isListening: status }),

  setProcessing: (status) => set({ isProcessing: status }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, timestamp: Date.now() }],
    })),

  setCurrentTranscript: (transcript) => set({ currentTranscript: transcript }),

  clearMessages: () => set({ messages: [] }),

  setAudioContext: (context) => set({ audioContext: context }),

  setMediaRecorder: (recorder) => set({ mediaRecorder: recorder }),

  addAudioChunk: (chunk) =>
    set((state) => ({
      audioChunks: [...state.audioChunks, chunk],
    })),

  clearAudioChunks: () => set({ audioChunks: [] }),

  // Initialize audio
  initializeAudio: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      const context = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      set({ audioContext: context, mediaRecorder: recorder });
      return { context, recorder, stream };
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      throw error;
    }
  },

  // Cleanup
  cleanup: () => {
    const { socket, mediaRecorder, audioContext } = get();

    if (socket) {
      socket.close();
    }

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }

    if (audioContext) {
      audioContext.close();
    }

    set({
      isConnected: false,
      socket: null,
      isBotSpeaking: false,
      isListening: false,
      isProcessing: false,
      audioContext: null,
      mediaRecorder: null,
      audioChunks: [],
    });
  },
}));

export default useMedicalBotStore;
