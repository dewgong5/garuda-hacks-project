const { spawn } = require('child_process');
const { saveDebugAudio } = require('../audioUtils');

class AudioService {
    constructor() {
        this.systemAudioProc = null;
        this.isCapturing = false;
        this.silenceStart = null;
        this.inSilence = false;
        this.lastVoiceEndTimeSet = false;
        this.SILENCE_THRESHOLD = 0.01;
        this.SILENCE_DURATION_MS = 1000;
        this.SAMPLE_RATE = 24000;
        this.BUFFER_SIZE = 4096;
        this.AUDIO_CHUNK_DURATION = 0.1;
        
        // Callbacks
        this.onAudioChunk = null;
        this.onVoiceEnd = null;
        this.onSilenceDetected = null;
        this.onVoiceDetected = null;
    }

    setCallbacks(onAudioChunk, onVoiceEnd, onSilenceDetected, onVoiceDetected) {
        this.onAudioChunk = onAudioChunk;
        this.onVoiceEnd = onVoiceEnd;
        this.onSilenceDetected = onSilenceDetected;
        this.onVoiceDetected = onVoiceDetected;
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

        console.log('🎤 Starting audio capture...');
        console.log('⚙️ Audio options:', options);
        
        this.isCapturing = true;
        console.log('✅ Audio capture started successfully');
        return true;
    }

    async processAudioChunk(audioData) {
        if (!this.isCapturing) {
            return;
        }

        // Silence detection
        let sumSquares = 0;
        for (let i = 0; i < audioData.length; i++) {
            sumSquares += audioData[i] * audioData[i];
        }
        const rms = Math.sqrt(sumSquares / audioData.length);

        if (rms < this.SILENCE_THRESHOLD) {
            // Detected silence
            if (!this.inSilence) {
                this.silenceStart = Date.now();
                this.inSilence = true;
                console.log('🔇 Silence detected (RMS:', rms.toFixed(4), ')');
                this.onSilenceDetected?.(rms);
            } else if (!this.lastVoiceEndTimeSet && this.silenceStart &&
                    (Date.now() - this.silenceStart > this.SILENCE_DURATION_MS)) {
                // Silence has lasted long enough, set the end time ONCE
                const voiceEndTime = Date.now();
                this.onVoiceEnd?.(voiceEndTime);
                this.lastVoiceEndTimeSet = true;
                console.log('⏱️ Voice end time set (silence duration:', (voiceEndTime - this.silenceStart), 'ms)');
            }
        } else {
            // Detected voice (not silence)
            if (this.inSilence) {
                console.log('🎤 Voice detected (RMS:', rms.toFixed(4), ')');
                this.onVoiceDetected?.(rms);
            }
            this.inSilence = false;
            this.silenceStart = null;
            this.lastVoiceEndTimeSet = false;
        }

        // Convert and send audio chunk
        const pcmData16 = this.convertFloat32ToInt16(audioData);
        const base64Data = this.arrayBufferToBase64(pcmData16.buffer);

        this.onAudioChunk?.({
            data: base64Data,
            mimeType: 'audio/pcm;rate=24000',
        });
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

    // macOS specific audio capture
    async startMacOSAudioCapture() {
        if (process.platform !== 'darwin') {
            console.log('⚠️ macOS audio capture only available on macOS');
            return false;
        }

        // Kill any existing SystemAudioDump processes first
        await this.killExistingSystemAudioDump();

        console.log('Starting macOS audio capture with SystemAudioDump...');

        const { app } = require('electron');
        const path = require('path');

        let systemAudioPath;
        if (app.isPackaged) {
            systemAudioPath = path.join(process.resourcesPath, 'SystemAudioDump');
        } else {
            systemAudioPath = path.join(__dirname, '../assets', 'SystemAudioDump');
        }

        console.log('SystemAudioDump path:', systemAudioPath);

        // Spawn SystemAudioDump with stealth options
        const spawnOptions = {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PROCESS_NAME: 'AudioService',
                APP_NAME: 'System Audio Service',
            },
        };

        if (process.platform === 'darwin') {
            spawnOptions.detached = false;
            spawnOptions.windowsHide = false;
        }

        this.systemAudioProc = spawn(systemAudioPath, [], spawnOptions);

        if (!this.systemAudioProc.pid) {
            console.error('Failed to start SystemAudioDump');
            return false;
        }

        console.log('SystemAudioDump started with PID:', this.systemAudioProc.pid);

        const CHUNK_DURATION = 0.1;
        const SAMPLE_RATE = 24000;
        const BYTES_PER_SAMPLE = 2;
        const CHANNELS = 2;
        const CHUNK_SIZE = SAMPLE_RATE * BYTES_PER_SAMPLE * CHANNELS * CHUNK_DURATION;

        let audioBuffer = Buffer.alloc(0);

        this.systemAudioProc.stdout.on('data', data => {
            audioBuffer = Buffer.concat([audioBuffer, data]);

            while (audioBuffer.length >= CHUNK_SIZE) {
                const chunk = audioBuffer.slice(0, CHUNK_SIZE);
                audioBuffer = audioBuffer.slice(CHUNK_SIZE);

                const monoChunk = CHANNELS === 2 ? this.convertStereoToMono(chunk) : chunk;
                const base64Data = monoChunk.toString('base64');
                
                this.onAudioChunk?.({
                    data: base64Data,
                    mimeType: 'audio/pcm;rate=24000',
                });

                if (process.env.DEBUG_AUDIO) {
                    console.log(`Processed audio chunk: ${chunk.length} bytes`);
                    saveDebugAudio(monoChunk, 'system_audio');
                }
            }

            const maxBufferSize = SAMPLE_RATE * BYTES_PER_SAMPLE * 1;
            if (audioBuffer.length > maxBufferSize) {
                audioBuffer = audioBuffer.slice(-maxBufferSize);
            }
        });

        this.systemAudioProc.stderr.on('data', data => {
            console.error('SystemAudioDump stderr:', data.toString());
        });

        this.systemAudioProc.on('close', code => {
            console.log('SystemAudioDump process closed with code:', code);
            this.systemAudioProc = null;
        });

        this.systemAudioProc.on('error', err => {
            console.error('SystemAudioDump process error:', err);
            this.systemAudioProc = null;
        });

        return true;
    }

    convertStereoToMono(stereoBuffer) {
        const samples = stereoBuffer.length / 4;
        const monoBuffer = Buffer.alloc(samples * 2);

        for (let i = 0; i < samples; i++) {
            const leftSample = stereoBuffer.readInt16LE(i * 4);
            monoBuffer.writeInt16LE(leftSample, i * 2);
        }

        return monoBuffer;
    }

    async killExistingSystemAudioDump() {
        return new Promise(resolve => {
            console.log('Checking for existing SystemAudioDump processes...');

            const killProc = spawn('pkill', ['-f', 'SystemAudioDump'], {
                stdio: 'ignore',
            });

            killProc.on('close', code => {
                if (code === 0) {
                    console.log('Killed existing SystemAudioDump processes');
                } else {
                    console.log('No existing SystemAudioDump processes found');
                }
                resolve();
            });

            killProc.on('error', err => {
                console.log('Error checking for existing processes (this is normal):', err.message);
                resolve();
            });

            setTimeout(() => {
                killProc.kill();
                resolve();
            }, 2000);
        });
    }

    stopMacOSAudioCapture() {
        if (this.systemAudioProc) {
            console.log('Stopping SystemAudioDump...');
            this.systemAudioProc.kill('SIGTERM');
            this.systemAudioProc = null;
        }
    }

    reset() {
        this.silenceStart = null;
        this.inSilence = false;
        this.lastVoiceEndTimeSet = false;
    }
}

module.exports = AudioService; 