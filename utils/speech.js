// Speech Recognition Utility
export class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onError = null;
    this.onEnd = null;
  }

  initialize() {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      throw new Error("Speech recognition not supported in this browser");
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onResult) {
        this.onResult({
          final: finalTranscript.trim(),
          interim: interimTranscript.trim(),
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };
  }

  start() {
    if (!this.recognition) {
      this.initialize();
    }

    if (!this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  setOnResult(callback) {
    this.onResult = callback;
  }

  setOnError(callback) {
    this.onError = callback;
  }

  setOnEnd(callback) {
    this.onEnd = callback;
  }
}

// Text-to-Speech Utility
export class TextToSpeechService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.isInitialized = false;
  }

  initialize() {
    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        this.synth.cancel();

        let hasResolved = false;

        const loadVoices = () => {
          try {
            this.voices = this.synth.getVoices();

            if (this.voices.length === 0) {
              console.warn("No voices available yet");
              return false;
            }

            // Prefer Telugu voices for medical bot
            this.selectedVoice =
              this.voices.find(
                (voice) => voice.lang && voice.lang.startsWith("te")
              ) ||
              this.voices.find(
                (voice) =>
                  voice.lang &&
                  (voice.lang.includes("te-IN") || voice.lang.includes("te_IN"))
              ) ||
              this.voices.find(
                (voice) =>
                  voice.name && voice.name.toLowerCase().includes("telugu")
              ) ||
              this.voices[0];

            console.log(`TTS initialized with ${this.voices.length} voices`);
            console.log(
              `Selected voice: ${this.selectedVoice?.name || "none"}`
            );

            this.isInitialized = true;

            // Only resolve once
            if (!hasResolved) {
              hasResolved = true;
              // Add a small delay to ensure browser is fully ready
              setTimeout(() => {
                console.log("TTS is fully ready");
                resolve();
              }, 250);
            }
            return true;
          } catch (err) {
            console.error("Error loading voices:", err);
            if (!hasResolved) {
              hasResolved = true;
              reject(err);
            }
            return false;
          }
        };

        // Try to load voices immediately
        if (this.synth.getVoices().length > 0) {
          if (loadVoices()) {
            return;
          }
        }

        // Set up the event listener
        let timeoutId = null;
        const voicesChangedHandler = () => {
          if (loadVoices()) {
            clearTimeout(timeoutId);
            this.synth.onvoiceschanged = null;
          }
        };

        this.synth.onvoiceschanged = voicesChangedHandler;

        // Timeout fallback in case voices never load
        timeoutId = setTimeout(() => {
          this.synth.onvoiceschanged = null;
          if (this.voices.length === 0) {
            console.warn("Voice loading timeout, attempting to load anyway");
            loadVoices();
          }
          if (!this.isInitialized && !hasResolved) {
            // Even if no voices, mark as initialized to prevent hanging
            console.warn("Force resolving after timeout");
            this.isInitialized = true;
            hasResolved = true;
            resolve();
          }
        }, 5000);
      } catch (err) {
        console.error("TTS initialization error:", err);
        reject(err);
      }
    });
  }

  speak(text, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.synth) {
          reject(new Error("Speech synthesis not available"));
          return;
        }

        if (!this.isInitialized) {
          reject(new Error("Speech synthesis not initialized"));
          return;
        }

        // Wait a moment if not ready yet
        if (!this.isReady()) {
          console.log("TTS not ready, waiting...");
          const ready = await this.waitUntilReady(3000, 100);
          if (!ready) {
            reject(new Error("Speech synthesis not ready"));
            return;
          }
        }

        // Reload voices if needed
        if (!this.selectedVoice || this.voices.length === 0) {
          console.warn("No voice selected, attempting to reload voices");
          this.voices = this.synth.getVoices();

          if (this.voices.length === 0) {
            reject(new Error("No voices available"));
            return;
          }

          this.selectedVoice = this.voices[0];
        }

        // Cancel any ongoing speech
        if (this.isSpeaking || this.synth.speaking) {
          this.synth.cancel();
          this.isSpeaking = false;
          // Wait for cancel to complete
          await new Promise((resolve) => setTimeout(resolve, 150));
        }

        // Create and configure utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.selectedVoice;
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        utterance.lang = this.selectedVoice?.lang || "en-US";

        utterance.onstart = () => {
          this.isSpeaking = true;
          console.log("Speech started");
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          console.log("Speech ended");
          resolve();
        };

        utterance.onerror = (event) => {
          this.isSpeaking = false;
          console.error("Speech synthesis error:", event);

          // More detailed error logging
          if (event.error) {
            console.error("Error type:", event.error);
            console.error("Error message:", event.message || "No message");
          }

          // Don't reject on certain errors, just resolve
          if (event.error === "interrupted" || event.error === "cancelled") {
            console.log("Speech was interrupted or cancelled");
            resolve();
          } else {
            reject(new Error(`Speech synthesis failed: ${event.error}`));
          }
        };

        // Speak the utterance
        console.log("Starting speech synthesis...");
        this.synth.speak(utterance);
      } catch (err) {
        this.isSpeaking = false;
        console.error("Error in speak method:", err);
        reject(err);
      }
    });
  }

  stop() {
    if (this.isSpeaking || this.synth.speaking) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  pause() {
    if (this.isSpeaking && this.synth.speaking) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.isSpeaking && this.synth.paused) {
      this.synth.resume();
    }
  }

  isReady() {
    return (
      this.isInitialized &&
      this.voices.length > 0 &&
      this.selectedVoice !== null &&
      !this.synth.speaking
    );
  }

  /**
   * Wait until the speech system is fully ready
   * @param {number} maxWaitTime - Maximum time to wait in milliseconds (default: 10000)
   * @param {number} checkInterval - How often to check in milliseconds (default: 100)
   * @returns {Promise<boolean>} - Resolves to true when ready, false if timeout
   */
  async waitUntilReady(maxWaitTime = 10000, checkInterval = 100) {
    const startTime = Date.now();

    console.log("Waiting for TTS to be fully ready...");

    while (Date.now() - startTime < maxWaitTime) {
      // Try to refresh voices if not loaded yet
      if (this.voices.length === 0) {
        this.voices = this.synth.getVoices();

        if (this.voices.length > 0 && !this.selectedVoice) {
          this.selectedVoice =
            this.voices.find(
              (voice) => voice.lang && voice.lang.startsWith("te")
            ) ||
            this.voices.find(
              (voice) =>
                voice.lang &&
                (voice.lang.includes("te-IN") || voice.lang.includes("te_IN"))
            ) ||
            this.voices.find(
              (voice) =>
                voice.name && voice.name.toLowerCase().includes("telugu")
            ) ||
            this.voices[0];

          this.isInitialized = true;
          console.log(`Voice loaded during wait: ${this.selectedVoice?.name}`);
        }
      }

      // Check if ready
      if (this.isReady()) {
        const waitedTime = Date.now() - startTime;
        console.log(`TTS fully ready after ${waitedTime}ms`);
        return true;
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    // Timeout reached
    const waitedTime = Date.now() - startTime;
    console.warn(`TTS readiness timeout after ${waitedTime}ms`);
    console.warn(
      `Status: initialized=${this.isInitialized}, voices=${
        this.voices.length
      }, selectedVoice=${this.selectedVoice?.name || "null"}, speaking=${
        this.synth.speaking
      }`
    );

    return false;
  }
}
