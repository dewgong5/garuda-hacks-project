class ScreenshotService {
    constructor() {
        this.mediaStream = null;
        this.hiddenVideo = null;
        this.offscreenCanvas = null;
        this.offscreenContext = null;
        this.screenshotInterval = null;
        this.currentImageQuality = 'medium';
        
        // Callbacks
        this.onScreenshotCaptured = null;
        this.onScreenshotError = null;
    }

    setCallbacks(onScreenshotCaptured, onScreenshotError) {
        this.onScreenshotCaptured = onScreenshotCaptured;
        this.onScreenshotError = onScreenshotError;
    }

    calculateImageTokens(width, height) {
        if (width <= 384 && height <= 384) return 258;
        return Math.ceil(width / 768) * Math.ceil(height / 768) * 258;
    }

    setMediaStream(stream) {
        this.mediaStream = stream;
    }

    setImageQuality(quality) {
        this.currentImageQuality = quality;
    }

    async captureScreenshot(imageQuality = null) {
        try {
            const quality = imageQuality || this.currentImageQuality;
            console.log('📸 Capturing screenshot with quality:', quality);
            
            // Create a simple test image (1x1 pixel) for now
            // In a real implementation, this would capture the actual screen
            const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            const tokens = this.calculateImageTokens(1920, 1080); // Example dimensions
            
            console.log('✅ Screenshot captured successfully');
            console.log('📊 Screenshot stats - Size:', testImageData.length, 'bytes, Tokens:', tokens);
            
            const result = {
                success: true,
                data: testImageData,
                tokens: tokens,
                quality: quality
            };
            
            this.onScreenshotCaptured?.(result);
            return result;
        } catch (error) {
            console.error('❌ Screenshot capture failed:', error.message);
            const errorResult = {
                success: false,
                error: error.message
            };
            this.onScreenshotError?.(errorResult);
            return errorResult;
        }
    }

    startAutomaticCapture(interval) {
        if (this.screenshotInterval) {
            console.log('🔄 Clearing existing screenshot interval');
            clearInterval(this.screenshotInterval);
        }

        if (interval && interval !== 'manual') {
            console.log('📸 Starting automatic screenshot capture every', interval, 'seconds');
            this.screenshotInterval = setInterval(async () => {
                console.log('🔄 Auto-capturing screenshot...');
                try {
                    await this.captureScreenshot();
                } catch (error) {
                    console.error('❌ Auto-capture failed:', error);
                }
            }, parseInt(interval) * 1000);
        } else {
            console.log('ℹ️ Screenshot capture set to manual mode');
        }
    }

    stopAutomaticCapture() {
        if (this.screenshotInterval) {
            console.log('🛑 Stopping automatic screenshot capture');
            clearInterval(this.screenshotInterval);
            this.screenshotInterval = null;
        } else {
            console.log('ℹ️ No automatic screenshot capture to stop');
        }
    }

    isCapturing() {
        return this.screenshotInterval !== null;
    }

    reset() {
        this.stopAutomaticCapture();
        this.mediaStream = null;
        this.hiddenVideo = null;
        this.offscreenCanvas = null;
        this.offscreenContext = null;
    }
}

module.exports = ScreenshotService; 