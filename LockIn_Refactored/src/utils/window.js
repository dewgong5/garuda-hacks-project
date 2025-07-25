const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('os');

let mouseEventsIgnored = false;

function ensureDataDirectories() {
    const homeDir = os.homedir();
    const cheddarDir = path.join(homeDir, 'cheddar');
    const dataDir = path.join(cheddarDir, 'data');
    const imageDir = path.join(dataDir, 'image');
    const audioDir = path.join(dataDir, 'audio');

    [cheddarDir, dataDir, imageDir, audioDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    return { imageDir, audioDir };
}

function createWindow(sendToRenderer, geminiSessionRef) {
    // Get layout preference (default to 'normal')
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: windowWidth, height: windowHeight } = primaryDisplay.workAreaSize;

    const mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        frame: false,
        transparent: true,
        hasShadow: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        hiddenInMissionControl: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // TODO: change to true
            backgroundThrottling: false,
            enableBlinkFeatures: 'GetDisplayMedia',
            webSecurity: true,
            allowRunningInsecureContent: false,
        },
        backgroundColor: '#00000000',
    });

    const { session, desktopCapturer } = require('electron');
    session.defaultSession.setDisplayMediaRequestHandler(
        (request, callback) => {
            desktopCapturer.getSources({ types: ['screen'] }).then(sources => {
                callback({ video: sources[0], audio: 'loopback' });
            });
        },
        { useSystemPicker: true }
    );

    mainWindow.setResizable(false);
    mainWindow.setContentProtection(true);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // Center window at the top of the screen
    const { width: screenWidth } = primaryDisplay.workAreaSize;
    const x = Math.floor((screenWidth - windowWidth) / 2);
    const y = 0;
    mainWindow.setPosition(x, y);

    if (process.platform === 'win32') {
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    }

    mainWindow.loadFile(path.join(__dirname, '../index.html'));

    // Set default window title
    mainWindow.setTitle('System Monitor');

    // After window is created, apply content protection setting
    mainWindow.webContents.once('dom-ready', () => {
        setTimeout(async () => {
            // Apply content protection setting via IPC handler
            try {
                const contentProtection = await mainWindow.webContents.executeJavaScript('cheddar.getContentProtection()');
                mainWindow.setContentProtection(contentProtection);
                console.log('Content protection loaded from settings:', contentProtection);
            } catch (error) {
                console.error('Error loading content protection:', error);
                mainWindow.setContentProtection(true);
            }
        }, 150);
    });

    setupWindowIpcHandlers(mainWindow, sendToRenderer, geminiSessionRef);

    return mainWindow;
}

function setupWindowIpcHandlers(mainWindow, sendToRenderer, geminiSessionRef) {
    // View change handler - this will be handled by the WindowIpcHandlers class now
    ipcMain.on('view-changed', (event, view) => {
        if (view !== 'assistant' && !mainWindow.isDestroyed()) {
            mainWindow.setIgnoreMouseEvents(false);
        }
    });
}

module.exports = {
    ensureDataDirectories,
    createWindow,
    setupWindowIpcHandlers,
};