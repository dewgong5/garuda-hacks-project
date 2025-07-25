const { ipcRenderer, ipcMain } = require('electron');
const { CHANNELS, isValidChannel } = require('./channels');

// IPC Bridge utilities for better communication

class IpcBridge {
    constructor() {
        this.isMain = typeof ipcMain !== 'undefined';
        this.isRenderer = typeof ipcRenderer !== 'undefined';
        
        if (!this.isMain && !this.isRenderer) {
            throw new Error('IpcBridge must be used in Electron main or renderer process');
        }
    }

    // Send message from renderer to main
    send(channel, data) {
        if (!this.isRenderer) {
            throw new Error('send() can only be used in renderer process');
        }
        
        if (!isValidChannel(channel)) {
            throw new Error(`Invalid channel: ${channel}`);
        }
        
        return ipcRenderer.invoke(channel, data);
    }

    // Send message from main to renderer
    sendToRenderer(channel, data) {
        if (!this.isMain) {
            throw new Error('sendToRenderer() can only be used in main process');
        }
        
        if (!isValidChannel(channel)) {
            throw new Error(`Invalid channel: ${channel}`);
        }
        
        // Get all windows and send to the first one
        const { BrowserWindow } = require('electron');
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            windows[0].webContents.send(channel, data);
        }
    }

    // Listen for messages (renderer)
    on(channel, callback) {
        if (!this.isRenderer) {
            throw new Error('on() can only be used in renderer process');
        }
        
        if (!isValidChannel(channel)) {
            throw new Error(`Invalid channel: ${channel}`);
        }
        
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }

    // Remove listener (renderer)
    removeListener(channel, callback) {
        if (!this.isRenderer) {
            throw new Error('removeListener() can only be used in renderer process');
        }
        
        ipcRenderer.removeListener(channel, callback);
    }

    // Remove all listeners (renderer)
    removeAllListeners(channel) {
        if (!this.isRenderer) {
            throw new Error('removeAllListeners() can only be used in renderer process');
        }
        
        ipcRenderer.removeAllListeners(channel);
    }

    // Handle messages (main)
    handle(channel, handler) {
        if (!this.isMain) {
            throw new Error('handle() can only be used in main process');
        }
        
        if (!isValidChannel(channel)) {
            throw new Error(`Invalid channel: ${channel}`);
        }
        
        ipcMain.handle(channel, handler);
    }

    // Remove handler (main)
    removeHandler(channel) {
        if (!this.isMain) {
            throw new Error('removeHandler() can only be used in main process');
        }
        
        ipcMain.removeHandler(channel);
    }
}

// Create singleton instance
const ipcBridge = new IpcBridge();

// Utility functions for common IPC patterns
const ipcUtils = {
    // Send with error handling
    async sendWithErrorHandling(channel, data) {
        try {
            const result = await ipcBridge.send(channel, data);
            return { success: true, data: result };
        } catch (error) {
            console.error(`IPC error on channel ${channel}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Send to renderer with error handling
    sendToRendererWithErrorHandling(channel, data) {
        try {
            ipcBridge.sendToRenderer(channel, data);
            return { success: true };
        } catch (error) {
            console.error(`IPC error sending to renderer on channel ${channel}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Create a promise-based wrapper for IPC calls
    createPromiseWrapper(channel) {
        return (data) => ipcUtils.sendWithErrorHandling(channel, data);
    },

    // Batch multiple IPC calls
    async batchSend(calls) {
        const results = [];
        for (const { channel, data } of calls) {
            const result = await ipcUtils.sendWithErrorHandling(channel, data);
            results.push({ channel, result });
        }
        return results;
    }
};

module.exports = {
    ipcBridge,
    ipcUtils,
    CHANNELS
}; 