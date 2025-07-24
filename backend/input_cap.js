// backend/input_cap.js
class InputCapture {
    constructor() {
        this.isCapturing = false;
        this.captureInterval = null;
    }

    startCapture(options = {}) {
        if (this.isCapturing) {
            throw new Error('Input capture already running');
        }

        this.isCapturing = true;
        console.log('Input capture started');
        return true;
    }

    stopCapture() {
        if (!this.isCapturing) {
            return;
        }

        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }

        this.isCapturing = false;
        console.log('Input capture stopped');
    }

    isActive() {
        return this.isCapturing;
    }
}

module.exports = InputCapture;
