const { contextBridge, ipcRenderer } = require('electron');
const { CHANNELS } = require('./ipc/channels');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Gemini methods
    initializeGemini: (apiKey, customPrompt, profile, language) => 
        ipcRenderer.invoke(CHANNELS.GEMINI.INITIALIZE, apiKey, customPrompt, profile, language),
    closeSession: () => ipcRenderer.invoke(CHANNELS.GEMINI.CLOSE_SESSION),
    sendTextMessage: (text) => ipcRenderer.invoke(CHANNELS.GEMINI.SEND_TEXT, text),
    sendAudioContent: (audioData) => ipcRenderer.invoke(CHANNELS.GEMINI.SEND_AUDIO, audioData),
    sendImageContent: (imageData) => ipcRenderer.invoke(CHANNELS.GEMINI.SEND_IMAGE, imageData),
    getCurrentSession: () => ipcRenderer.invoke(CHANNELS.GEMINI.GET_CURRENT_SESSION),
    startNewSession: () => ipcRenderer.invoke(CHANNELS.GEMINI.START_NEW_SESSION),

    // Audio methods
    startAudioCapture: (options) => ipcRenderer.invoke(CHANNELS.AUDIO.START_CAPTURE, options),
    stopAudioCapture: () => ipcRenderer.invoke(CHANNELS.AUDIO.STOP_CAPTURE),
    processAudioChunk: (audioData) => ipcRenderer.invoke(CHANNELS.AUDIO.PROCESS_CHUNK, audioData),
    startMacOSAudio: () => ipcRenderer.invoke(CHANNELS.AUDIO.START_MACOS),
    stopMacOSAudio: () => ipcRenderer.invoke(CHANNELS.AUDIO.STOP_MACOS),

    // Screenshot methods
    captureScreenshot: (options) => ipcRenderer.invoke(CHANNELS.SCREENSHOT.CAPTURE, options),
    startScreenshotCapture: (interval, quality) => 
        ipcRenderer.invoke(CHANNELS.SCREENSHOT.START_AUTO, { interval, quality }),
    stopScreenshotCapture: () => ipcRenderer.invoke(CHANNELS.SCREENSHOT.STOP_AUTO),

    // Conversation methods
    initConversationStorage: () => ipcRenderer.invoke(CHANNELS.CONVERSATION.INIT_STORAGE),
    saveConversationSession: (sessionId, history) => 
        ipcRenderer.invoke(CHANNELS.CONVERSATION.SAVE_SESSION, { sessionId, history }),
    getConversationSession: (sessionId) => ipcRenderer.invoke(CHANNELS.CONVERSATION.GET_SESSION, sessionId),
    getAllConversationSessions: () => ipcRenderer.invoke(CHANNELS.CONVERSATION.GET_ALL_SESSIONS),

    // Window methods
    minimizeWindow: () => ipcRenderer.invoke(CHANNELS.WINDOW.MINIMIZE),
    maximizeWindow: () => ipcRenderer.invoke(CHANNELS.WINDOW.MAXIMIZE),
    closeWindow: () => ipcRenderer.invoke(CHANNELS.WINDOW.CLOSE),
    toggleWindowVisibility: () => ipcRenderer.invoke(CHANNELS.WINDOW.TOGGLE_VISIBILITY),
    updateContentProtection: (enabled) => ipcRenderer.invoke(CHANNELS.WINDOW.UPDATE_CONTENT_PROTECTION, enabled),

    // App methods
    quitApplication: () => ipcRenderer.invoke(CHANNELS.APP.QUIT),
    openExternal: (url) => ipcRenderer.invoke(CHANNELS.APP.OPEN_EXTERNAL, url),
    getRandomDisplayName: () => ipcRenderer.invoke(CHANNELS.APP.GET_RANDOM_DISPLAY_NAME),
    debugLogLatency: (responseTime) => ipcRenderer.invoke(CHANNELS.APP.DEBUG_LATENCY, responseTime),
    testResponse: () => ipcRenderer.invoke(CHANNELS.APP.TEST_RESPONSE),

    // Event listeners
    on: (channel, callback) => {
        // Whitelist channels
        const validChannels = [
            CHANNELS.EVENTS.UPDATE_STATUS,
            CHANNELS.EVENTS.UPDATE_RESPONSE,
            CHANNELS.EVENTS.SESSION_INITIALIZING,
            CHANNELS.EVENTS.CONVERSATION_SAVED,
            CHANNELS.EVENTS.SAVE_CONVERSATION_TURN,
            CHANNELS.EVENTS.VOICE_END_TIME
        ];
        
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },

    removeListener: (channel, callback) => {
        ipcRenderer.removeListener(channel, callback);
    },

    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
