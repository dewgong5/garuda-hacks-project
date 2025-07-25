const { GoogleGenAI } = require('@google/genai');
const { getSystemPrompt } = require('../utils/prompts');
const robot = require('robotjs');

class GeminiService {
    constructor() {
        this.client = null;
        this.session = null;
        this.apiKey = 'AIzaSyDPGDUkS6Zp6HIl6z_Qc9fW6L8d7FfJzeo'; // Hardcoded API key
        this.customPrompt = '';
        this.profile = 'teacher';
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

    async initialize(apiKey = null, customPrompt = '', profile = 'teacher', language = 'en-US', isReconnection = false) {
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
                    tools: [
                        { googleSearch: {} },
                        {
                            functionDeclarations: [
                                {
                                    name: "toggle_drawing_mode",
                                    description: "Toggles the drawing canvas mode on/off. Use this when the user wants to draw, sketch, or annotate on the screen.",
                                    parameters: {
                                        type: "object",
                                        properties: {},
                                        required: []
                                    }
                                },
                                {
                                    name: "draw_shape",
                                    description: "Draws a simple shape on the canvas. Use this when the user asks to draw geometric shapes like rectangles, circles, or lines.",
                                    parameters: {
                                        type: "object",
                                        properties: {
                                            shape: {
                                                type: "string",
                                                enum: ["rectangle", "circle", "line"],
                                                description: "The type of shape to draw"
                                            },
                                            x: {
                                                type: "number",
                                                description: "X coordinate for the shape (0-100, percentage of screen width)"
                                            },
                                            y: {
                                                type: "number", 
                                                description: "Y coordinate for the shape (0-100, percentage of screen height)"
                                            },
                                            width: {
                                                type: "number",
                                                description: "Width of the shape (0-100, percentage of screen width). For circles, this is the diameter."
                                            },
                                            height: {
                                                type: "number",
                                                description: "Height of the shape (0-100, percentage of screen height). Not used for circles."
                                            },
                                            color: {
                                                type: "string",
                                                enum: ["red", "blue", "green", "yellow", "purple", "orange", "black", "white"],
                                                description: "Color of the shape",
                                                default: "red"
                                            }
                                        },
                                        required: ["shape", "x", "y", "width"]
                                    }
                                },
                                {
                                    name: "draw_stroke",
                                    description: "Draws a freehand stroke or mark at specific pixel coordinates. Use this when the user asks to draw at exact pixel positions or make marks/strokes.",
                                    parameters: {
                                        type: "object",
                                        properties: {
                                            x: {
                                                type: "number",
                                                description: "X coordinate in pixels from the left edge of the screen"
                                            },
                                            y: {
                                                type: "number",
                                                description: "Y coordinate in pixels from the top edge of the screen"
                                            },
                                            size: {
                                                type: "number",
                                                description: "Size of the stroke/mark in pixels",
                                                default: 20
                                            },
                                            color: {
                                                type: "string",
                                                enum: ["red", "blue", "green", "yellow", "purple", "orange", "black", "white"],
                                                description: "Color of the stroke",
                                                default: "red"
                                            },
                                            type: {
                                                type: "string",
                                                enum: ["dot", "cross", "circle", "line"],
                                                description: "Type of stroke to draw",
                                                default: "dot"
                                            }
                                        },
                                        required: ["x", "y"]
                                    }
                                },
                                {
                                    name: "draw_parabola",
                                    description: "Draws a parabola curve for mathematical explanations. Perfect for teaching quadratic functions, physics trajectories, or any parabolic concepts.",
                                    parameters: {
                                        type: "object",
                                        properties: {
                                            centerX: {
                                                type: "number",
                                                description: "X coordinate of the parabola center (0-100, percentage of screen width)",
                                                default: 50
                                            },
                                            centerY: {
                                                type: "number",
                                                description: "Y coordinate of the parabola center (0-100, percentage of screen height)",
                                                default: 50
                                            },
                                            width: {
                                                type: "number",
                                                description: "Width of the parabola (0-100, percentage of screen width)",
                                                default: 30
                                            },
                                            height: {
                                                type: "number",
                                                description: "Height of the parabola (0-100, percentage of screen height)",
                                                default: 20
                                            },
                                            color: {
                                                type: "string",
                                                enum: ["red", "blue", "green", "yellow", "purple", "orange", "black", "white"],
                                                description: "Color of the parabola",
                                                default: "blue"
                                            },
                                            direction: {
                                                type: "string",
                                                enum: ["up", "down"],
                                                description: "Direction the parabola opens (up for U-shape, down for inverted U)",
                                                default: "up"
                                            }
                                        },
                                        required: []
                                    }
                                },
                                {
                                    name: "robot_draw",
                                    description: "Uses robotjs to control the mouse and draw on the screen. Use this for drawing complex shapes or when drawing on the canvas is not working.",
                                    parameters: {
                                        type: "object",
                                        properties: {
                                            path: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        x: { type: "number" },
                                                        y: { type: "number" }
                                                    },
                                                    required: ["x", "y"]
                                                },
                                                description: "An array of points to draw."
                                            }
                                        },
                                        required: ["path"]
                                    }
                                }
                            ]
                        }
                    ],
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
        console.log('📨 Gemini message received:', JSON.stringify(message, null, 2));

        // Handle transcription
        if (message.serverContent?.inputTranscription?.text) {
            this.currentTranscription += message.serverContent.inputTranscription.text;
            console.log('🎤 Voice transcribed:', message.serverContent.inputTranscription.text);
        }

        // Handle direct tool calls (this is the key fix!)
        if (message.toolCall?.functionCalls) {
            console.log('🔧 Direct tool call received:', message.toolCall.functionCalls);
            for (const functionCall of message.toolCall.functionCalls) {
                console.log('🔧 Processing function call:', functionCall);
                this.handleFunctionCall(functionCall);
            }
        }

        // Handle AI response
        if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                    this.messageBuffer += part.text;
                    this.onResponse?.(this.messageBuffer);
                }
                
                // Handle function/tool calls in model turn
                if (part.functionCall) {
                    console.log('🔧 Function call in model turn:', part.functionCall);
                    this.handleFunctionCall(part.functionCall);
                }
            }
        }

        // Handle tool call cancellation
        if (message.toolCallCancellation) {
            console.log('❌ Tool call was cancelled:', message.toolCallCancellation);
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

    async handleFunctionCall(functionCall) {
        console.log('🔧 Executing function:', functionCall.name);
        
        try {
            switch (functionCall.name) {
                case 'toggle_drawing_mode':
                    console.log('🎨 Toggling drawing mode...');
                    
                    // Use the global main window reference
                    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
                        try {
                            const result = await global.mainWindow.webContents.executeJavaScript(`
                                console.log('🔍 Checking for canvasDrawing on window...');
                                console.log('Window keys containing "canvas":', Object.keys(window).filter(k => k.toLowerCase().includes('canvas')));
                                
                                if (window.canvasDrawing && typeof window.canvasDrawing.toggle === 'function') {
                                    console.log('✅ Found canvasDrawing, calling toggle...');
                                    window.canvasDrawing.toggle();
                                    console.log('🎨 Drawing mode toggled via AI tool call');
                                    true;
                                } else {
                                    console.error('❌ canvasDrawing not available on window object');
                                    console.log('Available window properties:', Object.keys(window).slice(0, 20));
                                    
                                    // Try alternative approach - simulate Ctrl+D keypress
                                    console.log('🔄 Trying alternative approach - simulating Ctrl+D...');
                                    const event = new KeyboardEvent('keydown', {
                                        key: 'd',
                                        code: 'KeyD',
                                        ctrlKey: true,
                                        bubbles: true
                                    });
                                    document.dispatchEvent(event);
                                    console.log('📤 Ctrl+D event dispatched');
                                    true;
                                }
                            `);
                            console.log('✅ Drawing toggle executed, result:', result);
                        } catch (jsError) {
                            console.error('❌ JavaScript execution failed:', jsError);
                        }
                    } else {
                        console.error('❌ Main window not available');
                    }
                    
                    // Send function response back to Gemini
                    await this.session.sendRealtimeInput({
                        functionResponse: {
                            name: functionCall.name,
                            response: {
                                success: true,
                                message: "Drawing mode has been toggled. You can now draw on the screen!"
                            }
                        }
                    });
                    break;

                case 'draw_shape':
                    console.log('🔷 Drawing shape:', functionCall.args);
                    
                    // Use the global main window reference
                    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
                        try {
                            const args = functionCall.args || {};
                            const result = await global.mainWindow.webContents.executeJavaScript(`
                                console.log('🔷 Drawing shape with args:', ${JSON.stringify(args)});
                                
                                if (window.canvasDrawing && typeof window.canvasDrawing.draw_shape === 'function') {
                                    console.log('✅ Found canvasDrawing.draw_shape, calling...');
                                    const result = window.canvasDrawing.draw_shape(${JSON.stringify(args)});
                                    console.log('🔷 Shape drawn via AI tool call');
                                    result;
                                } else {
                                    console.error('❌ canvasDrawing.draw_shape not available');
                                    false;
                                }
                            `);
                            console.log('✅ Shape drawing executed, result:', result);
                        } catch (jsError) {
                            console.error('❌ JavaScript execution failed:', jsError);
                        }
                    } else {
                        console.error('❌ Main window not available');
                    }
                    
                    // Send function response back to Gemini
                    await this.session.sendRealtimeInput({
                        functionResponse: {
                            name: functionCall.name,
                            response: {
                                success: true,
                                message: `${functionCall.args?.shape || 'Shape'} has been drawn on the canvas!`
                            }
                        }
                    });
                    break;

                case 'draw_stroke':
                    console.log('✏️ Drawing stroke:', functionCall.args);
                    
                    // Use the global main window reference
                    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
                        try {
                            const args = functionCall.args || {};
                            const result = await global.mainWindow.webContents.executeJavaScript(`
                                console.log('✏️ Drawing stroke with args:', ${JSON.stringify(args)});
                                
                                if (window.canvasDrawing && typeof window.canvasDrawing.draw_stroke === 'function') {
                                    console.log('✅ Found canvasDrawing.draw_stroke, calling...');
                                    const result = window.canvasDrawing.draw_stroke(${JSON.stringify(args)});
                                    console.log('✏️ Stroke drawn via AI tool call');
                                    result;
                                } else {
                                    console.error('❌ canvasDrawing.draw_stroke not available');
                                    false;
                                }
                            `);
                            console.log('✅ Stroke drawing executed, result:', result);
                        } catch (jsError) {
                            console.error('❌ JavaScript execution failed:', jsError);
                        }
                    } else {
                        console.error('❌ Main window not available');
                    }
                    
                    // Send function response back to Gemini
                    await this.session.sendRealtimeInput({
                        functionResponse: {
                            name: functionCall.name,
                            response: {
                                success: true,
                                message: `Stroke has been drawn at coordinates (${functionCall.args?.x}, ${functionCall.args?.y})!`
                            }
                        }
                    });
                    break;

                case 'draw_parabola':
                    console.log('📈 Drawing parabola:', functionCall.args);
                    
                    // Use the global main window reference
                    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
                        try {
                            const args = functionCall.args || {};
                            const result = await global.mainWindow.webContents.executeJavaScript(`
                                console.log('📈 Drawing parabola with args:', ${JSON.stringify(args)});
                                
                                if (window.canvasDrawing && typeof window.canvasDrawing.draw_parabola === 'function') {
                                    console.log('✅ Found canvasDrawing.draw_parabola, calling...');
                                    const result = window.canvasDrawing.draw_parabola(${JSON.stringify(args)});
                                    console.log('📈 Parabola drawn via AI tool call');
                                    result;
                                } else {
                                    console.error('❌ canvasDrawing.draw_parabola not available');
                                    false;
                                }
                            `);
                            console.log('✅ Parabola drawing executed, result:', result);
                        } catch (jsError) {
                            console.error('❌ JavaScript execution failed:', jsError);
                        }
                    } else {
                        console.error('❌ Main window not available');
                    }
                    
                    // Send function response back to Gemini
                    await this.session.sendRealtimeInput({
                        functionResponse: {
                            name: functionCall.name,
                            response: {
                                success: true,
                                message: `Parabola has been drawn! Direction: ${functionCall.args?.direction || 'up'}, Color: ${functionCall.args?.color || 'blue'}`
                            }
                        }
                    });
                    break;

                case 'robot_draw':
                    console.log('🤖 Drawing with robotjs:', functionCall.args);
                    try {
                        // First, ensure drawing mode is on
                        if (global.mainWindow && !global.mainWindow.isDestroyed()) {
                            console.log('🤖 Toggling drawing mode for robotjs...');
                            await global.mainWindow.webContents.executeJavaScript(`
                                if (window.canvasDrawing && !window.canvasDrawing.isEnabled()) {
                                    console.log('🤖 Canvas not enabled, toggling...');
                                    window.canvasDrawing.toggle();
                                } else {
                                    console.log('🤖 Canvas already enabled.');
                                }
                            `);
                            await new Promise(resolve => setTimeout(resolve, 200)); // Add a 200ms delay
                        }

                        const { path } = functionCall.args;
                        console.log('🤖 Drawing path:', JSON.stringify(path, null, 2));
                        if (path && path.length > 0) {
                            robot.moveMouse(path[0].x, path[0].y);
                            robot.mouseToggle("down");
                            for (const point of path) {
                                robot.dragMouse(point.x, point.y);
                                await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for smoother drawing
                            }
                            robot.mouseToggle("up");
                        }
                        console.log('🤖 Drawing completed.');
                        await this.session.sendRealtimeInput({
                            functionResponse: {
                                name: functionCall.name,
                                response: {
                                    success: true,
                                    message: "Drawing completed with robotjs."
                                }
                            }
                        });
                    } catch (e) {
                        console.error('❌ robotjs drawing failed:', e);
                        await this.session.sendRealtimeInput({
                            functionResponse: {
                                name: functionCall.name,
                                response: {
                                    success: false,
                                    error: e.message
                                }
                            }
                        });
                    }
                    break;
                    
                default:
                    console.log('❌ Unknown function:', functionCall.name);
                    await this.session.sendRealtimeInput({
                        functionResponse: {
                            name: functionCall.name,
                            response: {
                                success: false,
                                error: `Unknown function: ${functionCall.name}`
                            }
                        }
                    });
            }
        } catch (error) {
            console.error('❌ Error executing function:', error);
            await this.session.sendRealtimeInput({
                functionResponse: {
                    name: functionCall.name,
                    response: {
                        success: false,
                        error: error.message
                    }
                }
            });
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
