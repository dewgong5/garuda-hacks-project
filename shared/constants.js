// Shared constants for Cheating Mommy

export const PROFILES = {
    INTERVIEW: 'interview',
    EXAM: 'exam',
    HOMEWORK: 'homework',
    GENERAL: 'general'
};

export const LANGUAGES = {
    ENGLISH: 'en-US',
    SPANISH: 'es-ES',
    FRENCH: 'fr-FR',
    GERMAN: 'de-DE',
    CHINESE: 'zh-CN',
    JAPANESE: 'ja-JP'
};

export const SCREENSHOT_INTERVALS = {
    MANUAL: 'manual',
    FIVE_SECONDS: '5',
    TEN_SECONDS: '10',
    THIRTY_SECONDS: '30'
};

export const IMAGE_QUALITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

export const STATUS_MESSAGES = {
    READY: 'Ready',
    INITIALIZING: 'Initializing...',
    CONNECTING: 'Connecting...',
    LISTENING: 'Listening...',
    PROCESSING: 'Processing...',
    ERROR: 'Error',
    SESSION_CLOSED: 'Session closed'
};

export const AUDIO_CONFIG = {
    SAMPLE_RATE: 24000,
    BUFFER_SIZE: 4096,
    CHUNK_DURATION: 0.1,
    SILENCE_THRESHOLD: 0.01,
    SILENCE_DURATION_MS: 1000
};

export const UI_CONFIG = {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    MAX_RESPONSES: 50
}; 