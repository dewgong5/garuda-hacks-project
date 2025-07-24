// backend/geminiClient.js
const { GoogleGenAI } = require('@google/genai');

class GeminiClient {
    constructor() {
        this.client = null;
        this.session = null;
        this.apiKey = null; // Will be set during initialization
        this.customPrompt = '';
        this.profile = 'interview';
        this.language = 'en-US';
        this.isInitializing = false;
    }

    async initialize(apiKey, customPrompt = '', profile = 'interview', language = 'en-US') {
        if (this.isInitializing) {
            console.log('🔄 Gemini initialization already in progress...');
            throw new Error('Session initialization already in progress');
        }

        console.log('🚀 Initializing Gemini session...');
        console.log('📋 Profile:', profile);
        console.log('🌍 Language:', language);
        console.log('💬 Custom prompt length:', customPrompt.length);

        this.isInitializing = true;
        this.apiKey = apiKey;
        this.customPrompt = customPrompt;
        this.profile = profile;
        this.language = language;

        try {
            console.log('🔧 Creating GoogleGenAI client...');
            this.client = new GoogleGenAI({
                vertexai: false,
                apiKey: this.apiKey,
            });

            const systemPrompt = this.getSystemPrompt();
            console.log('📝 System prompt configured');

            console.log('🔌 Connecting to Gemini Live API...');
            this.session = await this.client.live.connect({
                model: 'gemini-live-2.5-flash-preview',
                callbacks: {
                    onopen: () => {
                        console.log('✅ Gemini Live session connected successfully!');
                        global.sendToRenderer('update-status', 'Live session connected');
                    },
                    onmessage: (message) => {
                        this.handleMessage(message);
                    },
                    onerror: (error) => {
                        console.error('❌ Gemini session error:', error);
                        global.sendToRenderer('update-status', 'Error: ' + error.message);
                    },
                    onclose: (event) => {
                        console.log('🔌 Gemini session closed:', event.reason);
                        global.sendToRenderer('update-status', 'Session closed');
                    }
                },
                config: {
                    responseModalities: ['TEXT'],
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

    getSystemPrompt() {
        const basePrompt = `You are an AI assistant helping with academic tasks. 
        Be helpful, accurate, and provide complete answers. 
        If analyzing code or screenshots, provide detailed explanations.`;
        
        if (this.customPrompt) {
            return `${basePrompt}\n\nAdditional instructions: ${this.customPrompt}`;
        }
        
        return basePrompt;
    }

    handleMessage(message) {
        console.log('📨 Gemini message received:', message);

        // Handle transcription
        if (message.serverContent?.inputTranscription?.text) {
            console.log('🎤 Voice transcribed:', message.serverContent.inputTranscription.text);
            // Could send transcription to renderer if needed
        }

        // Handle AI response
        if (message.serverContent?.modelTurn?.parts) {
            let responseText = '';
            for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                    responseText += part.text;
                }
            }
            
            if (responseText) {
                console.log('🤖 Gemini response received:', responseText.substring(0, 100) + '...');
                global.sendToRenderer('update-response', responseText);
            }
        }

        // Handle completion
        if (message.serverContent?.generationComplete) {
            console.log('✅ Response generation complete');
            global.sendToRenderer('update-status', 'Listening...');
        }

        if (message.serverContent?.turnComplete) {
            console.log('🔄 Turn complete, ready for next input');
            global.sendToRenderer('update-status', 'Ready');
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
    }

    isConnected() {
        return this.session !== null;
    }
}

module.exports = GeminiClient;
