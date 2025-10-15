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
  }

  initialize() {
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = this.synth.getVoices();
        // Prefer female voices for medical bot
        this.selectedVoice =
          this.voices.find(
            (voice) =>
              voice.name.includes("Female") || voice.name.includes("Samantha")
          ) ||
          this.voices.find((voice) => voice.lang.startsWith("en")) ||
          this.voices[0];
        resolve();
      };

      if (this.synth.getVoices().length > 0) {
        loadVoices();
      } else {
        this.synth.onvoiceschanged = loadVoices;
      }
    });
  }

  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (this.isSpeaking) {
        this.synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.selectedVoice;
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        reject(event);
      };

      this.synth.speak(utterance);
    });
  }

  stop() {
    if (this.isSpeaking) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  pause() {
    if (this.isSpeaking) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.isSpeaking) {
      this.synth.resume();
    }
  }
}
