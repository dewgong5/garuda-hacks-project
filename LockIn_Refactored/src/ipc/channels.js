// IPC Channel definitions for better organization and type safety

const CHANNELS = {
    // Gemini-related channels
    GEMINI: {
        INITIALIZE: 'initialize-gemini',
        CLOSE_SESSION: 'close-session',
        SEND_TEXT: 'send-text-message',
        SEND_AUDIO: 'send-audio-content',
        SEND_IMAGE: 'send-image-content',
        GET_CURRENT_SESSION: 'get-current-session',
        START_NEW_SESSION: 'start-new-session'
    },

    // Audio-related channels
    AUDIO: {
        START_CAPTURE: 'start-audio-capture',
        STOP_CAPTURE: 'stop-audio-capture',
        PROCESS_CHUNK: 'process-audio-chunk',
        START_MACOS: 'start-macos-audio',
        STOP_MACOS: 'stop-macos-audio'
    },

    // Screenshot-related channels
    SCREENSHOT: {
        CAPTURE: 'capture-screenshot',
        START_AUTO: 'start-screenshot-capture',
        STOP_AUTO: 'stop-screenshot-capture'
    },

    // Conversation-related channels
    CONVERSATION: {
        INIT_STORAGE: 'init-conversation-storage',
        SAVE_SESSION: 'save-conversation-session',
        GET_SESSION: 'get-conversation-session',
        GET_ALL_SESSIONS: 'get-all-conversation-sessions'
    },

    // Window management channels
    WINDOW: {
        MINIMIZE: 'window-minimize',
        MAXIMIZE: 'window-maximize',
        CLOSE: 'window-close',
        TOGGLE_VISIBILITY: 'window-toggle-visibility',
        UPDATE_CONTENT_PROTECTION: 'window-update-content-protection',
        OPEN_REACT_APP: 'window-open-react-app',
        SHOW_MAIN: 'window-show-main',
        TOGGLE_DRAWING: 'window-toggle-drawing',
    },

    // General application channels
    APP: {
        QUIT: 'quit-application',
        OPEN_EXTERNAL: 'open-external',
        GET_RANDOM_DISPLAY_NAME: 'get-random-display-name',
        DEBUG_LATENCY: 'debug-log-latency',
        TEST_RESPONSE: 'test-response'
    },

    // Renderer events (sent from main to renderer)
    EVENTS: {
        UPDATE_STATUS: 'update-status',
        UPDATE_RESPONSE: 'update-response',
        SESSION_INITIALIZING: 'session-initializing',
        CONVERSATION_SAVED: 'conversation-saved',
        SAVE_CONVERSATION_TURN: 'save-conversation-turn',
        VOICE_END_TIME: 'voice-end-time'
    }
};

// Channel validation
function isValidChannel(channel) {
    const allChannels = [];
    
    // Flatten all channels
    Object.values(CHANNELS).forEach(category => {
        if (typeof category === 'object') {
            Object.values(category).forEach(ch => allChannels.push(ch));
        } else {
            allChannels.push(category);
        }
    });
    
    return allChannels.includes(channel);
}

// Channel categorization
function getChannelCategory(channel) {
    for (const [category, channels] of Object.entries(CHANNELS)) {
        if (typeof channels === 'object') {
            if (Object.values(channels).includes(channel)) {
                return category;
            }
        }
    }
    return 'UNKNOWN';
}

module.exports = {
    CHANNELS,
    isValidChannel,
    getChannelCategory
};
