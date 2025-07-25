const { ipcBridge, CHANNELS } = require('../bridge');
const ScreenshotService = require('../../services/ScreenshotService');

class ScreenshotIpcHandlers {
    constructor(screenshotService, geminiService, store) {
        this.screenshotService = screenshotService;
        this.geminiService = geminiService;
        this.store = store;
        this.setupCallbacks();
    }

    setupCallbacks() {
        // Set up Screenshot service callbacks
        this.screenshotService.setCallbacks(
            // onScreenshotCaptured
            async (result) => {
                if (result.success && this.geminiService.isConnected()) {
                    try {
                        await this.geminiService.sendImage({
                            data: result.data,
                            mimeType: 'image/png'
                        });
                        console.log('📸 Screenshot sent to Gemini');
                    } catch (error) {
                        console.error('Failed to send screenshot to Gemini:', error);
                    }
                }
            },
            // onScreenshotError
            (error) => {
                console.error('Screenshot error:', error);
            }
        );
    }

    setupHandlers() {
        // Capture screenshot
        ipcBridge.handle(CHANNELS.SCREENSHOT.CAPTURE, async (event, options) => {
            try {
                console.log('📸 Capturing screenshot via IPC...');
                const result = await this.screenshotService.captureScreenshot(options?.quality);
                console.log('✅ Screenshot captured via IPC');
                return result;
            } catch (error) {
                console.error('❌ Failed to capture screenshot via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Start automatic screenshot capture
        ipcBridge.handle(CHANNELS.SCREENSHOT.START_AUTO, async (event, { interval, quality }) => {
            try {
                console.log('📸 Starting screenshot capture via IPC...');
                this.screenshotService.setImageQuality(quality);
                this.screenshotService.startAutomaticCapture(interval);
                console.log('✅ Screenshot capture started via IPC');
                return { success: true };
            } catch (error) {
                console.error('❌ Failed to start screenshot capture via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Stop automatic screenshot capture
        ipcBridge.handle(CHANNELS.SCREENSHOT.STOP_AUTO, async () => {
            try {
                console.log('🛑 Stopping screenshot capture via IPC...');
                this.screenshotService.stopAutomaticCapture();
                console.log('✅ Screenshot capture stopped via IPC');
                return { success: true };
            } catch (error) {
                console.error('❌ Failed to stop screenshot capture via IPC:', error);
                return { success: false, error: error.message };
            }
        });
    }

    removeHandlers() {
        // Remove all Screenshot IPC handlers
        Object.values(CHANNELS.SCREENSHOT).forEach(channel => {
            ipcBridge.removeHandler(channel);
        });
    }

    // Stop all screenshot capture (for cleanup)
    stopAllScreenshotCapture() {
        try {
            this.screenshotService.stopAutomaticCapture();
            console.log('✅ All screenshot capture stopped');
        } catch (error) {
            console.error('❌ Error stopping screenshot capture:', error);
        }
    }
}

module.exports = ScreenshotIpcHandlers; 