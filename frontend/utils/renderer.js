// renderer.js - Frontend utilities for audio capture and IPC communication
// Note: In renderer process, we need to use window.electronAPI instead of require('electron')

// Audio capture variables (frontend only)
let mediaStream = null;
let audioContext = null;
let audioProcessor = null;
let audioBuffer = [];
const SAMPLE_RATE = 24000;
const AUDIO_CHUNK_DURATION = 0.1; // seconds
const BUFFER_SIZE = 4096;

// Screenshot variables (frontend only)
let screenshotInterval = null;
let currentImageQuality = 'medium';

// Audio utility functions
function convertFloat32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Initialize Gemini session (delegates to backend)
async function initializeGemini(apiKey, customPrompt = '', profile = 'interview', language = 'en-US') {
    try {
        console.log('🔧 Initializing Gemini session from renderer...');
        const result = await window.electronAPI.initializeGeminiSession(apiKey, customPrompt, profile, language);
        console.log('✅ Gemini session initialized:', result);
        return result;
    } catch (error) {
        console.error('❌ Failed to initialize Gemini session:', error);
        throw error;
    }
}

// Start audio capture only (no automatic screenshots)
async function startAudioCapture() {
    try {
        console.log('🎤 Starting audio capture only...');
        
        // Start backend audio capture
        await window.electronAPI.startAudioCapture();
        
        console.log('✅ Audio capture started successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to start audio capture:', error);
        throw error;
    }
}

// Start audio and screenshot capture (delegates to backend services)
async function startCapture(screenshotIntervalSeconds = 5, imageQuality = 'medium') {
    try {
        console.log('🎤 Starting audio and screenshot capture...');
        
        // Start backend audio capture
        await window.electronAPI.startAudioCapture();
        
        // Start backend screenshot capture
        if (screenshotIntervalSeconds && screenshotIntervalSeconds !== 'manual') {
            await window.electronAPI.startScreenshotCapture(screenshotIntervalSeconds, imageQuality);
        }
        
        console.log('✅ Capture started successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to start capture:', error);
        throw error;
    }
}

// Start frontend audio capture (for microphone access)
async function startFrontendAudioCapture() {
    try {
        console.log('🎤 Requesting microphone access...');
        
        // Get microphone stream
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: SAMPLE_RATE,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
            video: false,
        });

        console.log('✅ Microphone access granted');

        // Create audio context
        audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
        const source = audioContext.createMediaStreamSource(mediaStream);
        audioProcessor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

        let chunkCount = 0;
        const samplesPerChunk = SAMPLE_RATE * AUDIO_CHUNK_DURATION;

        console.log('🎵 Setting up audio processing...');
        audioProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            audioBuffer.push(...inputData);

            // Process audio in chunks
            while (audioBuffer.length >= samplesPerChunk) {
                const chunk = audioBuffer.splice(0, samplesPerChunk);
                chunkCount++;
                
                // Send raw audio data to backend for processing
                window.electronAPI.processAudioChunk({
                    data: arrayBufferToBase64(new Float32Array(chunk).buffer),
                    mimeType: 'audio/pcm;rate=24000',
                });
                
                if (chunkCount % 10 === 0) {
                    console.log('🎤 Audio chunk sent to backend (#', chunkCount, ')');
                }
            }
        };

        source.connect(audioProcessor);
        audioProcessor.connect(audioContext.destination);
        
        console.log('✅ Frontend audio capture started successfully');
    } catch (error) {
        console.error('❌ Failed to start frontend audio capture:', error);
        throw error;
    }
}

// Capture screenshot (delegates to backend)
async function captureScreenshot(imageQuality = 'medium', isManual = false) {
    try {
        console.log('📸 Capturing screenshot...');
        
        const result = await ipcRenderer.invoke('capture-screenshot', {
            quality: imageQuality,
            isManual: isManual
        });
        
        if (result.success) {
            console.log('✅ Screenshot captured successfully');
            return result;
        } else {
            console.error('❌ Screenshot capture failed:', result.error);
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Screenshot capture error:', error);
        throw error;
    }
}

// Stop all capture (delegates to backend)
async function stopCapture() {
    try {
        console.log('🛑 Stopping all capture...');
        
        // Stop frontend audio capture
        if (audioProcessor) {
            audioProcessor.disconnect();
            audioProcessor = null;
        }

        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }

        // Stop backend capture
        await window.electronAPI.stopAudioCapture();
        await window.electronAPI.stopScreenshotCapture();

        console.log('✅ All capture stopped successfully');
    } catch (error) {
        console.error('❌ Failed to stop capture:', error);
        throw error;
    }
}

// Send text message
async function sendTextMessage(text) {
    try {
        console.log('📤 Sending text message:', text.substring(0, 50) + '...');
        const result = await window.electronAPI.sendTextMessage(text);
        console.log('✅ Text message sent successfully');
        return result;
    } catch (error) {
        console.error('❌ Failed to send text message:', error);
        throw error;
    }
}

// Initialize conversation storage
async function initConversationStorage() {
    try {
        console.log('💾 Initializing conversation storage...');
        const result = await window.electronAPI.initConversationStorage();
        console.log('✅ Conversation storage initialized');
        return result;
    } catch (error) {
        console.error('❌ Failed to initialize conversation storage:', error);
        throw error;
    }
}

// Save conversation session
async function saveConversationSession(sessionId, conversationHistory) {
    try {
        console.log('💾 Saving conversation session:', sessionId);
        const result = await ipcRenderer.invoke('save-conversation-session', {
            sessionId: sessionId,
            history: conversationHistory
        });
        console.log('✅ Conversation session saved');
        return result;
    } catch (error) {
        console.error('❌ Failed to save conversation session:', error);
        throw error;
    }
}

// Get conversation session
async function getConversationSession(sessionId) {
    try {
        console.log('📖 Getting conversation session:', sessionId);
        const result = await ipcRenderer.invoke('get-conversation-session', sessionId);
        console.log('✅ Conversation session retrieved');
        return result;
    } catch (error) {
        console.error('❌ Failed to get conversation session:', error);
        throw error;
    }
}

// Get all conversation sessions
async function getAllConversationSessions() {
    try {
        console.log('📚 Getting all conversation sessions...');
        const result = await ipcRenderer.invoke('get-all-conversation-sessions');
        console.log('✅ All conversation sessions retrieved');
        return result;
    } catch (error) {
        console.error('❌ Failed to get all conversation sessions:', error);
        throw error;
    }
}

// Handle keyboard shortcuts
function handleShortcut(shortcutKey) {
    console.log('⌨️ Keyboard shortcut pressed:', shortcutKey);
    
    switch (shortcutKey) {
        case 'CmdOrCtrl+Shift+S':
            captureScreenshot(currentImageQuality, true);
            break;
        case 'CmdOrCtrl+Shift+A':
            // Toggle audio capture
            break;
        default:
            console.log('Unknown shortcut:', shortcutKey);
    }
}

// Export functions for use in components
window.rendererUtils = {
    initializeGemini,
    startCapture,
    startAudioCapture,
    stopCapture,
    captureScreenshot,
    sendTextMessage,
    initConversationStorage,
    saveConversationSession,
    getConversationSession,
    getAllConversationSessions,
    handleShortcut,
    startFrontendAudioCapture
};

// Listen for AI responses from main process
// Note: We'll set up event listeners in the main HTML file instead

console.log('✅ Renderer utilities loaded successfully'); 