const { ipcBridge, CHANNELS } = require('../bridge');
const { BrowserWindow } = require('electron');

class WindowIpcHandlers {
    constructor(store) {
        this.store = store;
        this.mainWindow = null;
    }

    setMainWindow(window) {
        this.mainWindow = window;
    }

    setupHandlers() {
        // Window minimize
        ipcBridge.handle(CHANNELS.WINDOW.MINIMIZE, async () => {
            try {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.minimize();
                    this.store.setMinimized(true);
                    return { success: true };
                } else {
                    return { success: false, error: 'Window not available' };
                }
            } catch (error) {
                console.error('❌ Failed to minimize window via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Window maximize
        ipcBridge.handle(CHANNELS.WINDOW.MAXIMIZE, async () => {
            try {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    if (this.mainWindow.isMaximized()) {
                        this.mainWindow.unmaximize();
                    } else {
                        this.mainWindow.maximize();
                    }
                    return { success: true };
                } else {
                    return { success: false, error: 'Window not available' };
                }
            } catch (error) {
                console.error('❌ Failed to maximize window via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Window close
        ipcBridge.handle(CHANNELS.WINDOW.CLOSE, async () => {
            try {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.close();
                    return { success: true };
                } else {
                    return { success: false, error: 'Window not available' };
                }
            } catch (error) {
                console.error('❌ Failed to close window via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Toggle window visibility
        ipcBridge.handle(CHANNELS.WINDOW.TOGGLE_VISIBILITY, async () => {
            try {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    if (this.mainWindow.isVisible()) {
                        this.mainWindow.hide();
                        this.store.setMinimized(true);
                    } else {
                        this.mainWindow.showInactive();
                        this.store.setMinimized(false);
                    }
                    return { success: true };
                } else {
                    return { success: false, error: 'Window not available' };
                }
            } catch (error) {
                console.error('❌ Failed to toggle window visibility via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Update content protection
        ipcBridge.handle(CHANNELS.WINDOW.UPDATE_CONTENT_PROTECTION, async (event, contentProtection) => {
            try {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.setContentProtection(contentProtection);
                    this.store.setContentProtection(contentProtection);
                    console.log('Content protection updated:', contentProtection);
                    return { success: true };
                } else {
                    return { success: false, error: 'Window not available' };
                }
            } catch (error) {
                console.error('❌ Failed to update content protection via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Open React app in separate window
        ipcBridge.handle(CHANNELS.WINDOW.OPEN_REACT_APP, async () => {
            try {
                // Check if React app window already exists
                if (this.reactAppWindow && !this.reactAppWindow.isDestroyed()) {
                    this.reactAppWindow.focus();
                    return { success: true };
                }

                // Create new React app window
                this.reactAppWindow = new BrowserWindow({
                    width: 400,
                    height: 400,
                    frame: false,
                    transparent: true,
                    alwaysOnTop: true,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        webSecurity: true,
                    },
                    title: 'React App',
                    resizable: true,
                });

                // Load the React app from localhost:3000
                await this.reactAppWindow.loadURL('http://localhost:3000');

                // Handle window closed
                this.reactAppWindow.on('closed', () => {
                    this.reactAppWindow = null;
                });

                return { success: true };
            } catch (error) {
                console.error('❌ Failed to open React app window:', error);
                return { success: false, error: error.message };
            }
        });

        // Toggle drawing mode
        ipcBridge.handle(CHANNELS.WINDOW.TOGGLE_DRAWING, async () => {
            try {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    // Execute JavaScript in the renderer process to toggle drawing
                    const result = await this.mainWindow.webContents.executeJavaScript(`
                        if (window.canvasDrawing && typeof window.canvasDrawing.toggle === 'function') {
                            window.canvasDrawing.toggle();
                            console.log('Drawing mode toggled via IPC');
                            true;
                        } else {
                            console.error('canvasDrawing not available');
                            false;
                        }
                    `);
                    return { success: result };
                } else {
                    return { success: false, error: 'Window not available' };
                }
            } catch (error) {
                console.error('❌ Failed to toggle drawing mode via IPC:', error);
                return { success: false, error: error.message };
            }
        });
    }

    removeHandlers() {
        // Remove all Window IPC handlers
        Object.values(CHANNELS.WINDOW).forEach(channel => {
            ipcBridge.removeHandler(channel);
        });
    }

    // Handle view changes
    handleViewChange(view) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            if (view !== 'assistant') {
                this.mainWindow.setIgnoreMouseEvents(false);
            }
        }
        this.store.setCurrentView(view);
    }
}

module.exports = WindowIpcHandlers;
