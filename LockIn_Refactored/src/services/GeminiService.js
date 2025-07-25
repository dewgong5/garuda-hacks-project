const { GoogleGenAI } = require('@google/genai');
const { getSystemPrompt } = require('../utils/prompts');

class GeminiService {
    constructor() {
        this.client = null;
        this.session = null;
        this.apiKey = 'AIzaSyDPGDUkS6Zp6HIl6z_Qc9fW6L8d7FfJzeo'; // Hardcoded API key
        this.customPrompt = '';
        this.profile = 'exam';
        this.language = 'en-US';
        this.isInitializing = false;
        
        // Conversation tracking
        this.currentSessionId = null;
        this.currentTranscription = '';
        this.conversationHistory = [];
        
        // Reconnection tracking
        this.reconnectionAttempts = 0;
        this.maxReconnectionAttempts = 3;
        this.reconnectionDelay = 2000;
        this.lastSessionParams = null;
        
        // Message buffer
        this.messageBuffer = '';
        
        // Callbacks
        this.onResponse = null;
        this.onStatus = null;
        this.onError = null;
    }

    setCallbacks(onResponse, onStatus, onError) {
        this.onResponse = onResponse;
        this.onStatus = onStatus;
        this.onError = onError;
    }

    async initialize(apiKey = null, customPrompt = '', profile = 'exam', language = 'en-US', isReconnection = false) {
        if (this.isInitializing) {
            console.log('🔄 Gemini initialization already in progress...');
            throw new Error('Session initialization already in progress');
        }

        console.log('🚀 Initializing Gemini session...');
        console.log('📋 Profile:', profile);
        console.log('🌍 Language:', language);
        console.log('💬 Custom prompt length:', customPrompt.length);

        this.isInitializing = true;
        this.apiKey = apiKey || this.apiKey; // Use provided API key or fallback to hardcoded
        this.customPrompt = customPrompt;
        this.profile = profile;
        this.language = language;

        // Store session parameters for reconnection
        if (!isReconnection) {
            this.lastSessionParams = { apiKey: this.apiKey, customPrompt, profile, language };
            this.reconnectionAttempts = 0;
            this.initializeNewSession();
        }

        try {
            console.log('🔧 Creating GoogleGenAI client...');
            this.client = new GoogleGenAI({
                apiKey: this.apiKey,
            });

            const systemPrompt = getSystemPrompt(this.profile, this.customPrompt, true);
            console.log('📝 System prompt configured');

            console.log('🔌 Connecting to Gemini Live API...');
            this.session = await this.client.live.connect({
                model: 'gemini-live-2.5-flash-preview',
                callbacks: {
                    onopen: () => {
                        console.log('✅ Gemini Live session connected successfully!');
                        this.onStatus?.('Live session connected');
                    },
                    onmessage: (message) => {
                        this.handleMessage(message);
                    },
                    onerror: (error) => {
                        console.error('❌ Gemini session error:', error);
                        this.onError?.(error.message);
                        this.onStatus?.('Error: ' + error.message);
                    },
                    onclose: (event) => {
                        console.log('🔌 Gemini session closed:', event.reason);
                        this.onStatus?.('Session closed');
                        
                        // Attempt automatic reconnection
                        if (this.lastSessionParams && this.reconnectionAttempts < this.maxReconnectionAttempts) {
                            console.log('Attempting automatic reconnection...');
                            this.attemptReconnection();
                        }
                    }
                },
                config: {
                    responseModalities: ['TEXT'],
                    tools: [{ googleSearch: {} }],
                    inputAudioTranscription: {},
                    contextWindowCompression: { slidingWindow: {} },
                    speechConfig: { languageCode: this.language },
                    systemInstruction: {
                        parts: [{ text: systemPrompt }],
                    },
                },
            });

            this.isInitializing = false;
            console.log('🎉 Gemini initialization completed successfully!');
            return true;
        } catch (error) {
            this.isInitializing = false;
            console.error('❌ Gemini initialization failed:', error.message);
            throw error;
        }
    }

    handleMessage(message) {
        console.log('📨 Gemini message received:', message);

        // Handle transcription
        if (message.serverContent?.inputTranscription?.text) {
            this.currentTranscription += message.serverContent.inputTranscription.text;
            console.log('🎤 Voice transcribed:', message.serverContent.inputTranscription.text);
        }

        // Handle AI response
        if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                    this.messageBuffer += part.text;
                    this.onResponse?.(this.messageBuffer);
                }
            }
        }

        // Handle completion
        if (message.serverContent?.generationComplete) {
            this.onResponse?.(this.messageBuffer);
            
            // Save conversation turn
            if (this.currentTranscription && this.messageBuffer) {
                this.saveConversationTurn(this.currentTranscription, this.messageBuffer);
                this.currentTranscription = '';
            }
            
            this.messageBuffer = '';
            this.onStatus?.('Listening...');
        }

        if (message.serverContent?.turnComplete) {
            console.log('🔄 Turn complete, ready for next input');
            this.onStatus?.('Ready');
        }
    }

    async sendMessage(text) {
        if (!this.session) {
            console.log('❌ Cannot send message: Session not initialized');
            throw new Error('Session not initialized');
        }

        try {
            console.log('📤 Sending text message to Gemini:', text.substring(0, 50) + '...');
            await this.session.sendRealtimeInput({ text: text.trim() });
            console.log('✅ Text message sent successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to send text message:', error.message);
            throw error;
        }
    }

    async sendAudio(audioData) {
        if (!this.session) {
            console.log('❌ Cannot send audio: Session not initialized');
            throw new Error('Session not initialized');
        }

        try {
            console.log('🎤 Sending audio chunk to Gemini (size:', audioData.data.length, 'bytes)');
            await this.session.sendRealtimeInput({
                audio: {
                    data: audioData.data,
                    mimeType: audioData.mimeType,
                },
            });
            console.log('✅ Audio chunk sent successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to send audio chunk:', error.message);
            throw error;
        }
    }

    async sendImage(imageData) {
        if (!this.session) {
            console.log('❌ Cannot send image: Session not initialized');
            throw new Error('Session not initialized');
        }

        try {
            console.log('📸 Sending screenshot to Gemini (size:', imageData.data.length, 'bytes)');
            await this.session.sendRealtimeInput({
                media: {
                    data: imageData.data,
                    mimeType: 'image/jpeg',
                },
            });
            console.log('✅ Screenshot sent successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to send screenshot:', error.message);
            throw error;
        }
    }

    initializeNewSession() {
        this.currentSessionId = Date.now().toString();
        this.currentTranscription = '';
        this.conversationHistory = [];
        console.log('New conversation session started:', this.currentSessionId);
    }

    saveConversationTurn(transcription, aiResponse) {
        if (!this.currentSessionId) {
            this.initializeNewSession();
        }

        const conversationTurn = {
            timestamp: Date.now(),
            transcription: transcription.trim(),
            ai_response: aiResponse.trim(),
        };

        this.conversationHistory.push(conversationTurn);
        console.log('Saved conversation turn:', conversationTurn);

        // Emit event for conversation storage
        this.onConversationSaved?.({
            sessionId: this.currentSessionId,
            turn: conversationTurn,
            fullHistory: this.conversationHistory,
        });
    }

    getCurrentSessionData() {
        return {
            sessionId: this.currentSessionId,
            history: this.conversationHistory,
        };
    }

    async attemptReconnection() {
        if (!this.lastSessionParams || this.reconnectionAttempts >= this.maxReconnectionAttempts) {
            console.log('Max reconnection attempts reached or no session params stored');
            this.onStatus?.('Session closed');
            return false;
        }

        this.reconnectionAttempts++;
        console.log(`Attempting reconnection ${this.reconnectionAttempts}/${this.maxReconnectionAttempts}...`);

        await new Promise(resolve => setTimeout(resolve, this.reconnectionDelay));

        try {
            const success = await this.initialize(
                this.lastSessionParams.apiKey,
                this.lastSessionParams.customPrompt,
                this.lastSessionParams.profile,
                this.lastSessionParams.language,
                true
            );

            if (success) {
                this.reconnectionAttempts = 0;
                console.log('Live session reconnected');
                await this.sendReconnectionContext();
                return true;
            }
        } catch (error) {
            console.error(`Reconnection attempt ${this.reconnectionAttempts} failed:`, error);
        }

        if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
            return this.attemptReconnection();
        } else {
            console.log('All reconnection attempts failed');
            this.onStatus?.('Session closed');
            return false;
        }
    }

    async sendReconnectionContext() {
        if (!this.session || this.conversationHistory.length === 0) {
            return;
        }

        try {
            const transcriptions = this.conversationHistory
                .map(turn => turn.transcription)
                .filter(transcription => transcription && transcription.trim().length > 0);

            if (transcriptions.length === 0) {
                return;
            }

            const contextMessage = `Till now all these questions were asked in the interview, answer the last one please:\n\n${transcriptions.join('\n')}`;
            console.log('Sending reconnection context with', transcriptions.length, 'previous questions');

            await this.session.sendRealtimeInput({
                text: contextMessage,
            });
        } catch (error) {
            console.error('Error sending reconnection context:', error);
        }
    }

    async closeSession() {
        if (this.session) {
            console.log('🔌 Closing Gemini session...');
            try {
                await this.session.close();
                console.log('✅ Gemini session closed successfully');
            } catch (error) {
                console.error('❌ Error closing Gemini session:', error);
            }
            this.session = null;
        } else {
            console.log('ℹ️ No active Gemini session to close');
        }
        this.isInitializing = false;
        this.lastSessionParams = null; // Clear session params to prevent reconnection
    }

    isConnected() {
        return this.session !== null;
    }

    reset() {
        this.currentTranscription = '';
        this.messageBuffer = '';
        this.conversationHistory = [];
    }
}

module.exports = GeminiService; 