const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Gemini session management
    initializeGeminiSession: (apiKey, customPrompt, profile, language) => 
        ipcRenderer.invoke('initialize-gemini', apiKey, customPrompt, profile, language),
    closeSession: () => ipcRenderer.invoke('close-session'),
    
    // Audio capture
    startAudioCapture: (options) => ipcRenderer.invoke('start-audio-capture', options),
    stopAudioCapture: () => ipcRenderer.invoke('stop-audio-capture'),
    sendAudioContent: (audioData) => ipcRenderer.invoke('send-audio-content', audioData),
    processAudioChunk: (audioData) => ipcRenderer.invoke('process-audio-chunk', audioData),
    
    // Screenshot capture
    captureScreenshot: (options) => ipcRenderer.invoke('capture-screenshot', options),
    startScreenshotCapture: (interval, quality) => ipcRenderer.invoke('start-screenshot-capture', { interval, quality }),
    stopScreenshotCapture: () => ipcRenderer.invoke('stop-screenshot-capture'),
    sendImageContent: (imageData) => ipcRenderer.invoke('send-image-content', imageData),
    
    // Text messaging
    sendTextMessage: (text) => ipcRenderer.invoke('send-text-message', text),
    
    // Conversation storage
    initConversationStorage: () => ipcRenderer.invoke('init-conversation-storage'),
    saveConversationSession: (sessionId, history) => ipcRenderer.invoke('save-conversation-session', { sessionId, history }),
    getConversationSession: (sessionId) => ipcRenderer.invoke('get-conversation-session', sessionId),
    getAllConversationSessions: () => ipcRenderer.invoke('get-all-conversation-sessions'),
    
    // Window management
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    
    // External links
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    
    // Test functions
    testResponse: () => ipcRenderer.invoke('test-response'),
    
    // Event listeners
    on: (channel, callback) => {
        // Whitelist channels
        const validChannels = [
            'update-status',
            'update-response',
            'session-initializing',
            'conversation-saved'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },
    
    removeAllListeners: (channel) => {
        const validChannels = [
            'update-status',
            'update-response',
            'session-initializing',
            'conversation-saved'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    }
});
