const { ipcBridge, CHANNELS } = require('../bridge');
const GeminiService = require('../../services/GeminiService');

class GeminiIpcHandlers {
    constructor(geminiService, store) {
        this.geminiService = geminiService;
        this.store = store;
        this.setupCallbacks();
    }

    setupCallbacks() {
        // Set up Gemini service callbacks
        this.geminiService.setCallbacks(
            // onResponse
            (response) => {
                this.store.addResponse(response);
                ipcBridge.sendToRenderer(CHANNELS.EVENTS.UPDATE_RESPONSE, response);
            },
            // onStatus
            (status) => {
                this.store.setSessionStatus(status);
                ipcBridge.sendToRenderer(CHANNELS.EVENTS.UPDATE_STATUS, status);
            },
            // onError
            (error) => {
                this.store.setSessionError(error);
                console.error('Gemini service error:', error);
            }
        );
    }

    setupHandlers() {
        // Initialize Gemini session
        ipcBridge.handle(CHANNELS.GEMINI.INITIALIZE, async (event, apiKey = null, customPrompt = '', profile = 'teacher', language = 'en-US') => {
            try {
                console.log('🔄 Initializing Gemini session via IPC...');
                console.log('🔑 API Key provided:', apiKey ? 'Yes' : 'No (using hardcoded)');
                this.store.setSessionInitializing(true);
                
                const success = await this.geminiService.initialize(apiKey, customPrompt, profile, language);
                
                if (success) {
                    this.store.setSessionActive(true);
                    this.store.setSessionInitializing(false);
                    this.store.setSessionStatus('Live session connected');
                    
                    // Set current session ID
                    const sessionData = this.geminiService.getCurrentSessionData();
                    this.store.setCurrentSessionId(sessionData.sessionId);
                    
                    console.log('✅ Gemini session initialized successfully via IPC');
                    return { success: true };
                } else {
                    throw new Error('Failed to initialize Gemini session');
                }
            } catch (error) {
                console.error('❌ Failed to initialize Gemini session via IPC:', error);
                this.store.setSessionInitializing(false);
                this.store.setSessionError(error.message);
                return { success: false, error: error.message };
            }
        });

        // Close Gemini session
        ipcBridge.handle(CHANNELS.GEMINI.CLOSE_SESSION, async () => {
            try {
                console.log('🔌 Closing Gemini session via IPC...');
                await this.geminiService.closeSession();
                
                this.store.setSessionActive(false);
                this.store.setSessionStatus('Session closed');
                this.store.setCurrentSessionId(null);
                
                console.log('✅ Gemini session closed successfully via IPC');
                return { success: true };
            } catch (error) {
                console.error('❌ Failed to close Gemini session via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Send text message
        ipcBridge.handle(CHANNELS.GEMINI.SEND_TEXT, async (event, text) => {
            try {
                if (!this.geminiService.isConnected()) {
                    return { success: false, error: 'No active Gemini session' };
                }

                if (!text || typeof text !== 'string' || text.trim().length === 0) {
                    return { success: false, error: 'Invalid text message' };
                }

                console.log('📤 Sending text message via IPC:', text.substring(0, 50) + '...');
                const result = await this.geminiService.sendMessage(text.trim());
                console.log('✅ Text message sent successfully via IPC');
                return { success: true, data: result };
            } catch (error) {
                console.error('❌ Failed to send text message via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Send audio content
        ipcBridge.handle(CHANNELS.GEMINI.SEND_AUDIO, async (event, audioData) => {
            try {
                if (!this.geminiService.isConnected()) {
                    return { success: false, error: 'No active Gemini session' };
                }

                if (!audioData || !audioData.data) {
                    return { success: false, error: 'Invalid audio data' };
                }

                console.log('🎤 Sending audio content via IPC...');
                const result = await this.geminiService.sendAudio(audioData);
                console.log('✅ Audio content sent successfully via IPC');
                return { success: true, data: result };
            } catch (error) {
                console.error('❌ Failed to send audio content via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Send image content
        ipcBridge.handle(CHANNELS.GEMINI.SEND_IMAGE, async (event, imageData) => {
            try {
                if (!this.geminiService.isConnected()) {
                    return { success: false, error: 'No active Gemini session' };
                }

                if (!imageData || !imageData.data) {
                    return { success: false, error: 'Invalid image data' };
                }

                console.log('📸 Sending image content via IPC...');
                const result = await this.geminiService.sendImage(imageData);
                console.log('✅ Image content sent successfully via IPC');
                return { success: true, data: result };
            } catch (error) {
                console.error('❌ Failed to send image content via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Get current session data
        ipcBridge.handle(CHANNELS.GEMINI.GET_CURRENT_SESSION, async () => {
            try {
                const sessionData = this.geminiService.getCurrentSessionData();
                return { success: true, data: sessionData };
            } catch (error) {
                console.error('❌ Failed to get current session via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Start new session
        ipcBridge.handle(CHANNELS.GEMINI.START_NEW_SESSION, async () => {
            try {
                this.geminiService.initializeNewSession();
                const sessionData = this.geminiService.getCurrentSessionData();
                this.store.setCurrentSessionId(sessionData.sessionId);
                return { success: true, sessionId: sessionData.sessionId };
            } catch (error) {
                console.error('❌ Failed to start new session via IPC:', error);
                return { success: false, error: error.message };
            }
        });
    }

    removeHandlers() {
        // Remove all Gemini IPC handlers
        Object.values(CHANNELS.GEMINI).forEach(channel => {
            ipcBridge.removeHandler(channel);
        });
    }
}

module.exports = GeminiIpcHandlers; 