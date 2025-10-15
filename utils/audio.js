/**
 * Audio Processing Utilities
 * These utilities can be used for future WebSocket-based audio streaming
 */

/**
 * Convert Float32Array audio to 16-bit PCM
 */
export function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

/**
 * Downsample audio to target sample rate
 */
export function downsampleAudio(buffer, inputRate, outputRate) {
  if (inputRate === outputRate) {
    return buffer;
  }

  const sampleRateRatio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

/**
 * Convert audio blob to base64
 */
export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Merge audio chunks into single blob
 */
export function mergeAudioChunks(chunks, mimeType = "audio/webm") {
  return new Blob(chunks, { type: mimeType });
}

/**
 * Calculate audio level (volume) from buffer
 */
export function calculateAudioLevel(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Detect silence in audio buffer
 */
export function isSilent(buffer, threshold = 0.01) {
  const level = calculateAudioLevel(buffer);
  return level < threshold;
}

/**
 * Split audio into chunks by silence
 */
export function splitBySilence(
  buffer,
  silenceThreshold = 0.01,
  minSilenceDuration = 0.3,
  sampleRate = 16000
) {
  const chunks = [];
  let currentChunk = [];
  let silenceDuration = 0;
  const silenceFrames = minSilenceDuration * sampleRate;

  for (let i = 0; i < buffer.length; i++) {
    const isSilentFrame = Math.abs(buffer[i]) < silenceThreshold;

    if (isSilentFrame) {
      silenceDuration++;
    } else {
      silenceDuration = 0;
    }

    currentChunk.push(buffer[i]);

    if (silenceDuration >= silenceFrames && currentChunk.length > 0) {
      chunks.push(new Float32Array(currentChunk));
      currentChunk = [];
      silenceDuration = 0;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(new Float32Array(currentChunk));
  }

  return chunks;
}

/**
 * Create audio context with fallback
 */
export function createAudioContext(sampleRate = 16000) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return new AudioContext({ sampleRate });
}

/**
 * Get user media with proper configuration
 */
export async function getUserMediaStream(constraints = {}) {
  const defaultConstraints = {
    audio: {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    ...constraints,
  };

  return await navigator.mediaDevices.getUserMedia(defaultConstraints);
}

const audioUtils = {
  floatTo16BitPCM,
  downsampleAudio,
  blobToBase64,
  mergeAudioChunks,
  calculateAudioLevel,
  isSilent,
  splitBySilence,
  createAudioContext,
  getUserMediaStream,
};

export default audioUtils;
