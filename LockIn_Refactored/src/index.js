if (require('electron-squirrel-startup')) {
    process.exit(0);
}

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { createWindow } = require('./utils/window');

// Import services
const GeminiService = require('./services/GeminiService');
const AudioService = require('./services/AudioService');
const ScreenshotService = require('./services/ScreenshotService');
const ConversationService = require('./services/ConversationService');

// Import state management
const store = require('./store');

// Import IPC handlers
const GeminiIpcHandlers = require('./ipc/handlers/gemini');
const AudioIpcHandlers = require('./ipc/handlers/audio');
const ScreenshotIpcHandlers = require('./ipc/handlers/screenshot');
const ConversationIpcHandlers = require('./ipc/handlers/conversation');
const WindowIpcHandlers = require('./ipc/handlers/window');

// Import IPC utilities
const { ipcBridge, CHANNELS } = require('./ipc/bridge');

// Service instances
let geminiService = null;
let audioService = null;
let screenshotService = null;
let conversationService = null;

// IPC handler instances
let geminiIpcHandlers = null;
let audioIpcHandlers = null;
let screenshotIpcHandlers = null;
let conversationIpcHandlers = null;
let windowIpcHandlers = null;

let mainWindow = null;

function createMainWindow() {
    mainWindow = createWindow(ipcBridge.sendToRenderer, { current: null });
    
    // Set the main window reference for window IPC handlers
    if (windowIpcHandlers) {
        windowIpcHandlers.setMainWindow(mainWindow);
    }
    
    return mainWindow;
}

function initializeServices() {
    console.log('🚀 Initializing services...');
    
    // Initialize services
    geminiService = new GeminiService();
    audioService = new AudioService();
    screenshotService = new ScreenshotService();
    conversationService = new ConversationService();
    
    // Initialize IPC handlers
    geminiIpcHandlers = new GeminiIpcHandlers(geminiService, store);
    audioIpcHandlers = new AudioIpcHandlers(audioService, geminiService, store);
    screenshotIpcHandlers = new ScreenshotIpcHandlers(screenshotService, geminiService, store);
    conversationIpcHandlers = new ConversationIpcHandlers(conversationService, store);
    windowIpcHandlers = new WindowIpcHandlers(store);
    
    // Set up IPC handlers
    geminiIpcHandlers.setupHandlers();
    audioIpcHandlers.setupHandlers();
    screenshotIpcHandlers.setupHandlers();
    conversationIpcHandlers.setupHandlers();
    windowIpcHandlers.setupHandlers();
    
    // Set up general IPC handlers
    setupGeneralIpcHandlers();
    
    console.log('✅ Services initialized successfully');
}

function setupGeneralIpcHandlers() {
    // Quit application
    ipcBridge.handle(CHANNELS.APP.QUIT, async () => {
        try {
            await cleanupServices();
            app.quit();
            return { success: true };
        } catch (error) {
            console.error('Error quitting application:', error);
            return { success: false, error: error.message };
        }
    });

    // Open external URL
    ipcBridge.handle(CHANNELS.APP.OPEN_EXTERNAL, async (event, url) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            console.error('Error opening external URL:', error);
            return { success: false, error: error.message };
        }
    });

    // Get random display name
    ipcBridge.handle(CHANNELS.APP.GET_RANDOM_DISPLAY_NAME, async () => {
        try {
            return { success: true, name: 'System Monitor' };
        } catch (error) {
            console.error('Error getting random display name:', error);
            return { success: false, name: 'System Monitor' };
        }
    });

    // Debug latency
    ipcBridge.handle(CHANNELS.APP.DEBUG_LATENCY, async (event, responseTime) => {
        if (global.lastTranscriptionEndTime) {
            const delaySec = ((responseTime - global.lastTranscriptionEndTime) / 1000).toFixed(2);
            console.log(`🧪 Gemini response latency: ${delaySec} seconds`);
        } else {
            console.log('No transcription end time recorded.');
        }
        return { success: true };
    });

    // Test response
    ipcBridge.handle(CHANNELS.APP.TEST_RESPONSE, async () => {
        console.log('🧪 Testing response system...');
        ipcBridge.sendToRenderer(CHANNELS.EVENTS.UPDATE_RESPONSE, 'This is a test response from the main process!');
        return { success: true };
    });
}

async function cleanupServices() {
    console.log('🧹 Cleaning up services...');
    
    try {
        // Stop all audio capture
        if (audioIpcHandlers) {
            audioIpcHandlers.stopAllAudioCapture();
        }
        
        // Stop all screenshot capture
        if (screenshotIpcHandlers) {
            screenshotIpcHandlers.stopAllScreenshotCapture();
        }
        
        // Close Gemini session
        if (geminiService) {
            await geminiService.closeSession();
        }
        
        // Remove all IPC handlers
        if (geminiIpcHandlers) geminiIpcHandlers.removeHandlers();
        if (audioIpcHandlers) audioIpcHandlers.removeHandlers();
        if (screenshotIpcHandlers) screenshotIpcHandlers.removeHandlers();
        if (conversationIpcHandlers) conversationIpcHandlers.removeHandlers();
        if (windowIpcHandlers) windowIpcHandlers.removeHandlers();
        
        console.log('✅ Services cleaned up successfully');
    } catch (error) {
        console.error('❌ Error during service cleanup:', error);
    }
}

app.whenReady().then(async () => {
    initializeServices();
    createMainWindow();
});

app.on('window-all-closed', async () => {
    await cleanupServices();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', async () => {
    await cleanupServices();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// Export services for potential external use
module.exports = {
    geminiService,
    audioService,
    screenshotService,
    conversationService,
    store
};
