const { ipcBridge, CHANNELS } = require('../bridge');
const AudioService = require('../../services/AudioService');

class AudioIpcHandlers {
    constructor(audioService, geminiService, store) {
        this.audioService = audioService;
        this.geminiService = geminiService;
        this.store = store;
        this.setupCallbacks();
    }

    setupCallbacks() {
        // Set up Audio service callbacks
        this.audioService.setCallbacks(
            // onAudioChunk
            async (audioData) => {
                // Send audio to Gemini if connected
                if (this.geminiService.isConnected()) {
                    try {
                        await this.geminiService.sendAudio(audioData);
                    } catch (error) {
                        console.error('Failed to send audio to Gemini:', error);
                    }
                }
            },
            // onVoiceEnd
            (voiceEndTime) => {
                global.lastTranscriptionEndTime = voiceEndTime;
                ipcBridge.sendToRenderer(CHANNELS.EVENTS.VOICE_END_TIME, voiceEndTime);
            },
            // onSilenceDetected
            (rms) => {
                console.log('🔇 Silence detected (RMS:', rms.toFixed(4), ')');
            },
            // onVoiceDetected
            (rms) => {
                console.log('🎤 Voice detected (RMS:', rms.toFixed(4), ')');
            }
        );
    }

    setupHandlers() {
        // Start audio capture
        ipcBridge.handle(CHANNELS.AUDIO.START_CAPTURE, async (event, options) => {
            try {
                console.log('🎤 Starting audio capture via IPC...');
                const result = await this.audioService.startCapture(options);
                
                if (result) {
                    this.store.setRecording(true);
                    console.log('✅ Audio capture started successfully via IPC');
                    return { success: true };
                } else {
                    throw new Error('Failed to start audio capture');
                }
            } catch (error) {
                console.error('❌ Failed to start audio capture via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Stop audio capture
        ipcBridge.handle(CHANNELS.AUDIO.STOP_CAPTURE, async () => {
            try {
                console.log('🛑 Stopping audio capture via IPC...');
                await this.audioService.stopCapture();
                
                this.store.setRecording(false);
                console.log('✅ Audio capture stopped successfully via IPC');
                return { success: true };
            } catch (error) {
                console.error('❌ Failed to stop audio capture via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Process audio chunk
        ipcBridge.handle(CHANNELS.AUDIO.PROCESS_CHUNK, async (event, audioData) => {
            try {
                console.log('🎵 Processing audio chunk from frontend...');
                await this.audioService.processAudioChunk(audioData);
                console.log('✅ Audio chunk processed successfully');
                return { success: true };
            } catch (error) {
                console.error('❌ Failed to process audio chunk:', error);
                return { success: false, error: error.message };
            }
        });

        // Start macOS audio capture
        ipcBridge.handle(CHANNELS.AUDIO.START_MACOS, async () => {
            try {
                if (process.platform !== 'darwin') {
                    return {
                        success: false,
                        error: 'macOS audio capture only available on macOS',
                    };
                }

                console.log('🎤 Starting macOS audio capture via IPC...');
                const success = await this.audioService.startMacOSAudioCapture();
                
                if (success) {
                    this.store.setRecording(true);
                    console.log('✅ macOS audio capture started successfully via IPC');
                    return { success: true };
                } else {
                    throw new Error('Failed to start macOS audio capture');
                }
            } catch (error) {
                console.error('❌ Failed to start macOS audio capture via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Stop macOS audio capture
        ipcBridge.handle(CHANNELS.AUDIO.STOP_MACOS, async () => {
            try {
                console.log('🛑 Stopping macOS audio capture via IPC...');
                this.audioService.stopMacOSAudioCapture();
                
                this.store.setRecording(false);
                console.log('✅ macOS audio capture stopped successfully via IPC');
                return { success: true };
            } catch (error) {
                console.error('❌ Failed to stop macOS audio capture via IPC:', error);
                return { success: false, error: error.message };
            }
        });
    }

    removeHandlers() {
        // Remove all Audio IPC handlers
        Object.values(CHANNELS.AUDIO).forEach(channel => {
            ipcBridge.removeHandler(channel);
        });
    }

    // Stop all audio capture (for cleanup)
    stopAllAudioCapture() {
        try {
            this.audioService.stopCapture();
            this.audioService.stopMacOSAudioCapture();
            this.store.setRecording(false);
            console.log('✅ All audio capture stopped');
        } catch (error) {
            console.error('❌ Error stopping audio capture:', error);
        }
    }
}

module.exports = AudioIpcHandlers; 