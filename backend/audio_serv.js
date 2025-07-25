const { ipcMain } = require('electron');

class AudioService {
    constructor() {
        this.isCapturing = false;
        this.silenceStart = null;
        this.inSilence = false;
        this.lastVoiceEndTimeSet = false;
        this.SILENCE_THRESHOLD = 0.01;
        this.SILENCE_DURATION_MS = 1000;
        this.SAMPLE_RATE = 24000;
        this.BUFFER_SIZE = 4096;
        this.AUDIO_CHUNK_DURATION = 0.1;
    }

    convertFloat32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16Array;
    }

    arrayBufferToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    async startCapture(options = {}) {
        if (this.isCapturing) {
            console.log('🔄 Audio capture already running');
            throw new Error('Audio capture already running');
        }

        console.log('🎤 Starting backend audio capture...');
        console.log('⚙️ Audio options:', options);
        
        this.isCapturing = true;
        console.log('✅ Backend audio capture started successfully');
        return true;
    }

    async processAudioChunk(audioData) {
        // Process audio data from renderer
        const inputData = audioData;
        
        // Silence detection
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
            sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);

        if (rms < this.SILENCE_THRESHOLD) {
            // Detected silence
            if (!this.inSilence) {
                this.silenceStart = Date.now();
                this.inSilence = true;
                console.log('🔇 Silence detected (RMS:', rms.toFixed(4), ')');
            } else if (!this.lastVoiceEndTimeSet && this.silenceStart &&
                    (Date.now() - this.silenceStart > this.SILENCE_DURATION_MS)) {
                // Silence has lasted long enough, set the end time ONCE
                const voiceEndTime = Date.now();
                global.sendToRenderer('voice-end-time', voiceEndTime);
                this.lastVoiceEndTimeSet = true;
                console.log('⏱️ Voice end time set (silence duration:', (voiceEndTime - this.silenceStart), 'ms)');
            }
        } else {
            // Detected voice (not silence)
            if (this.inSilence) {
                console.log('🎤 Voice detected (RMS:', rms.toFixed(4), ')');
            }
            this.inSilence = false;
            this.silenceStart = null;
            this.lastVoiceEndTimeSet = false;
        }

        // Convert and send to Gemini
        const pcmData16 = this.convertFloat32ToInt16(inputData);
        const base64Data = this.arrayBufferToBase64(pcmData16.buffer);

        // Track audio tokens for rate limiting
        if (global.tokenTracker) {
            global.tokenTracker.trackAudioTokens();
        }

        // Send to Gemini client
        if (global.geminiClient && global.geminiClient.isConnected()) {
            try {
                await global.geminiClient.sendAudio({
                    data: base64Data,
                    mimeType: 'audio/pcm;rate=24000',
                });
                console.log('🎤 Audio chunk sent to Gemini');
            } catch (error) {
                console.error('❌ Failed to send audio to Gemini:', error);
            }
        } else {
            console.log('⚠️ Gemini client not connected, skipping audio send');
        }
    }

    async stopCapture() {
        if (!this.isCapturing) {
            console.log('ℹ️ Audio capture not running');
            return;
        }

        console.log('🛑 Stopping audio capture...');
        this.isCapturing = false;
        this.silenceStart = null;
        this.inSilence = false;
        this.lastVoiceEndTimeSet = false;

        console.log('✅ Audio capture stopped successfully');
    }

    isActive() {
        return this.isCapturing;
    }
}

module.exports = AudioService;
