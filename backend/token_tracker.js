// backend/token_tracker.js
class TokenTracker {
    constructor() {
        this.tokens = [];
        this.audioStartTime = null;
    }

    addTokens(count, type = 'image') {
        const now = Date.now();
        this.tokens.push({ timestamp: now, count, type });
        this.cleanOldTokens();
    }

    calculateImageTokens(width, height) {
        if (width <= 384 && height <= 384) return 258;
        const tilesX = Math.ceil(width / 768);
        const tilesY = Math.ceil(height / 768);
        return tilesX * tilesY * 258;
    }

    trackAudioTokens() {
        if (!this.audioStartTime) {
            this.audioStartTime = Date.now();
            return;
        }
        const now = Date.now();
        const elapsedSeconds = (now - this.audioStartTime) / 1000;
        const audioTokens = Math.floor(elapsedSeconds * 32);
        if (audioTokens > 0) {
            this.addTokens(audioTokens, 'audio');
            this.audioStartTime = now;
        }
    }

    cleanOldTokens() {
        const oneMinuteAgo = Date.now() - 60 * 1000;
        this.tokens = this.tokens.filter(token => token.timestamp > oneMinuteAgo);
    }

    getTokensInLastMinute() {
        this.cleanOldTokens();
        return this.tokens.reduce((total, token) => total + token.count, 0);
    }

    shouldThrottle() {
        // For now, return false since we don't have localStorage in main process
        // This can be enhanced later with proper configuration
        return false;
    }

    reset() {
        this.tokens = [];
        this.audioStartTime = null;
    }
}

module.exports = TokenTracker;
