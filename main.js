const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

// Import backend modules
const GeminiClient = require('./backend/gemini_client');
const AudioService = require('./backend/audio_serv');
const ImageService = require('./backend/image_serv');
const TokenTracker = require('./backend/token_tracker');
const ConversationLogger = require('./backend/conv_log');
const InputCapture = require('./backend/input_cap');

let mainWindow = null;
let geminiClient = null;
let audioService = null;
let imageService = null;
let tokenTracker = null;
let conversationLogger = null;
let inputCapture = null;

function createWindow() {
    console.log('🪟 Creating Cheating Mommy window...');
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hidden',
        frame: false,
        resizable: true,
        minimizable: true,
        maximizable: true,
        show: false
    });

    console.log('🔧 Opening DevTools for development...');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();

    console.log('📄 Loading frontend HTML...');
    // mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));
    mainWindow.loadURL('http://localhost:3000');


    mainWindow.once('ready-to-show', () => {
        console.log('✅ Window ready to show');
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        console.log('🔌 Window closed');
        mainWindow = null;
    });
}

function setupServices() {
    console.log('🔧 Setting up backend services...');
    
    // Initialize services
    tokenTracker = new TokenTracker();
    conversationLogger = new ConversationLogger();
    inputCapture = new InputCapture();
    
    // Initialize Gemini client when API key is provided
    geminiClient = new GeminiClient();
    audioService = new AudioService();
    imageService = new ImageService();
    
    console.log('✅ All backend services initialized');
}

function setupIpcHandlers() {
    // Gemini session management
    ipcMain.handle('initialize-gemini', async (event, apiKey, customPrompt, profile, language) => {
        try {
            await geminiClient.initialize(apiKey, customPrompt, profile, language);
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Gemini:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('close-session', async () => {
        try {
            await geminiClient.closeSession();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Audio handling
    ipcMain.handle('start-audio-capture', async (event, options) => {
        try {
            console.log('🎤 Starting audio capture via IPC...');
            await audioService.startCapture(options);
            console.log('✅ Audio capture started via IPC');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to start audio capture via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('stop-audio-capture', async () => {
        try {
            console.log('🛑 Stopping audio capture via IPC...');
            await audioService.stopCapture();
            console.log('✅ Audio capture stopped via IPC');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to stop audio capture via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    // Process audio chunks from frontend
    ipcMain.handle('process-audio-chunk', async (event, audioData) => {
        try {
            console.log('🎵 Processing audio chunk from frontend...');
            await audioService.processAudioChunk(audioData);
            console.log('✅ Audio chunk processed successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to process audio chunk:', error);
            return { success: false, error: error.message };
        }
    });

    // Image/screenshot handling
    ipcMain.handle('capture-screenshot', async (event, options) => {
        try {
            console.log('📸 Capturing screenshot via IPC...');
            const result = await imageService.captureScreenshot(options);
            console.log('✅ Screenshot captured via IPC');
            return { success: true, data: result };
        } catch (error) {
            console.error('❌ Failed to capture screenshot via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('start-screenshot-capture', async (event, { interval, quality }) => {
        try {
            console.log('📸 Starting screenshot capture via IPC...');
            imageService.startAutomaticCapture(interval);
            console.log('✅ Screenshot capture started via IPC');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to start screenshot capture via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('stop-screenshot-capture', async () => {
        try {
            console.log('🛑 Stopping screenshot capture via IPC...');
            imageService.stopAutomaticCapture();
            console.log('✅ Screenshot capture stopped via IPC');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to stop screenshot capture via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    // Text message sending
    ipcMain.handle('send-text-message', async (event, text) => {
        if (!geminiClient || !geminiClient.isConnected()) {
            console.log('❌ No active Gemini session for text message');
            return { success: false, error: 'No active Gemini session' };
        }

        try {
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                console.log('❌ Invalid text message received');
                return { success: false, error: 'Invalid text message' };
            }

            console.log('📤 Sending text message via IPC:', text.substring(0, 50) + '...');
            const response = await geminiClient.sendMessage(text.trim());
            console.log('✅ Text message sent successfully via IPC');
            return { success: true, response };
        } catch (error) {
            console.error('❌ Failed to send text message via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    // Audio content sending
    ipcMain.handle('send-audio-content', async (event, audioData) => {
        if (!geminiClient || !geminiClient.isConnected()) {
            console.log('❌ No active Gemini session for audio content');
            return { success: false, error: 'No active Gemini session' };
        }

        try {
            if (!audioData || !audioData.data) {
                console.log('❌ Invalid audio data received');
                return { success: false, error: 'Invalid audio data' };
            }

            console.log('🎤 Sending audio content via IPC...');
            const response = await geminiClient.sendAudio(audioData);
            console.log('✅ Audio content sent successfully via IPC');
            return { success: true, response };
        } catch (error) {
            console.error('❌ Failed to send audio content via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    // Image content sending
    ipcMain.handle('send-image-content', async (event, imageData) => {
        if (!geminiClient || !geminiClient.isConnected()) {
            console.log('❌ No active Gemini session for image content');
            return { success: false, error: 'No active Gemini session' };
        }

        try {
            if (!imageData || !imageData.data) {
                console.log('❌ Invalid image data received');
                return { success: false, error: 'Invalid image data' };
            }

            console.log('📸 Sending image content via IPC...');
            const response = await geminiClient.sendImage(imageData);
            console.log('✅ Image content sent successfully via IPC');
            return { success: true, response };
        } catch (error) {
            console.error('❌ Failed to send image content via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    // Window management
    ipcMain.handle('minimize-window', () => {
        mainWindow?.minimize();
    });

    ipcMain.handle('maximize-window', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow?.maximize();
        }
    });

    ipcMain.handle('close-window', () => {
        mainWindow?.close();
    });

    // External links
    ipcMain.handle('open-external', async (event, url) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Conversation storage handlers
    ipcMain.handle('init-conversation-storage', async () => {
        try {
            console.log('💾 Initializing conversation storage via IPC...');
            const result = await conversationLogger.initConversationStorage();
            console.log('✅ Conversation storage initialized via IPC');
            return { success: true, result };
        } catch (error) {
            console.error('❌ Failed to initialize conversation storage via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('save-conversation-session', async (event, { sessionId, history }) => {
        try {
            console.log('💾 Saving conversation session via IPC:', sessionId);
            const result = await conversationLogger.saveConversationSession(sessionId, history);
            console.log('✅ Conversation session saved via IPC');
            return { success: true, result };
        } catch (error) {
            console.error('❌ Failed to save conversation session via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-conversation-session', async (event, sessionId) => {
        try {
            console.log('📖 Getting conversation session via IPC:', sessionId);
            const result = await conversationLogger.getConversationSession(sessionId);
            console.log('✅ Conversation session retrieved via IPC');
            return { success: true, result };
        } catch (error) {
            console.error('❌ Failed to get conversation session via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-all-conversation-sessions', async () => {
        try {
            console.log('📚 Getting all conversation sessions via IPC...');
            const result = await conversationLogger.getAllConversationSessions();
            console.log('✅ All conversation sessions retrieved via IPC');
            return { success: true, result };
        } catch (error) {
            console.error('❌ Failed to get all conversation sessions via IPC:', error);
            return { success: false, error: error.message };
        }
    });

    // Status updates to renderer
    function sendToRenderer(channel, data) {
        if (mainWindow && !mainWindow.isDestroyed()) {
            console.log('📤 Sending to renderer:', channel, data);
            mainWindow.webContents.send(channel, data);
        } else {
            console.log('⚠️ Cannot send to renderer - window not available');
        }
    }

    // Expose sendToRenderer to backend modules
    global.sendToRenderer = sendToRenderer;
    
    // Expose tokenTracker to backend modules
    global.tokenTracker = tokenTracker;
    
    // Expose geminiClient to backend modules
    global.geminiClient = geminiClient;
    
    // Test IPC handler for debugging
    ipcMain.handle('test-response', async () => {
        console.log('🧪 Testing response system...');
        sendToRenderer('update-response', 'This is a test response from the main process!');
        return { success: true };
    });
}

app.whenReady().then(() => {
    console.log('🚀 Electron app ready, initializing...');
    setupServices();
    setupIpcHandlers();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}).catch(error => {
    console.error('❌ Error during app initialization:', error);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

app.on('before-quit', async () => {
    // Cleanup
    if (geminiClient) {
        await geminiClient.closeSession();
    }
    if (audioService) {
        await audioService.stopCapture();
    }
});
