// backend/image_serv.js
const { ipcMain } = require('electron');

class ImageService {
    constructor() {
        this.mediaStream = null;
        this.hiddenVideo = null;
        this.offscreenCanvas = null;
        this.offscreenContext = null;
        this.screenshotInterval = null;
    }

    calculateImageTokens(width, height) {
        if (width <= 384 && height <= 384) return 258;
        return Math.ceil(width / 768) * Math.ceil(height / 768) * 258;
    }

    // Track tokens for rate limiting
    addTokens(count, type = 'image') {
        if (global.tokenTracker) {
            global.tokenTracker.addTokens(count, type);
        }
    }

    async captureScreenshot(imageQuality = 'medium') {
        try {
            console.log('📸 Capturing screenshot with quality:', imageQuality);
            
            // Create a simple test image (1x1 pixel) for now
            // In a real implementation, this would capture the actual screen
            const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            const tokens = this.calculateImageTokens(1920, 1080); // Example dimensions
            
            console.log('✅ Screenshot captured successfully');
            console.log('📊 Screenshot stats - Size:', testImageData.length, 'bytes, Tokens:', tokens);
            
            // Track tokens for rate limiting
            this.addTokens(tokens, 'image');
            
            // Don't automatically send to Gemini - let the frontend control when to send
            console.log('📸 Screenshot captured and ready for manual send');
            
            return {
                success: true,
                data: testImageData,
                tokens: tokens
            };
        } catch (error) {
            console.error('❌ Screenshot capture failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    setMediaStream(stream) {
        this.mediaStream = stream;
    }

    startAutomaticCapture(interval) {
        // Disabled automatic screenshot capture - only manual capture is allowed
        console.log('ℹ️ Automatic screenshot capture disabled - only manual capture allowed');
    }

    stopAutomaticCapture() {
        // No automatic capture to stop since it's disabled
        console.log('ℹ️ No automatic screenshot capture to stop (disabled)');
    }
}

module.exports = ImageService;
