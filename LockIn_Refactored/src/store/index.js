const EventEmitter = require('events');

class Store extends EventEmitter {
    constructor() {
        super();
        this.state = {
            session: {
                isActive: false,
                isInitializing: false,
                status: 'Ready',
                error: null,
                startTime: null
            },
            conversation: {
                currentSessionId: null,
                history: [],
                responses: [],
                currentResponseIndex: 0
            },
            settings: {
                profile: 'exam',
                language: 'en-US',
                screenshotInterval: 5,
                imageQuality: 'medium',
                advancedMode: false,
                contentProtection: true
            },
            ui: {
                currentView: 'assistant',
                isRecording: false,
                isMinimized: false,
                compactLayout: false
            }
        };
        
        this.subscribers = new Map();
    }

    // Get state
    getState() {
        return this.state;
    }

    // Get specific state slice
    getStateSlice(slice) {
        return this.state[slice];
    }

    // Subscribe to state changes
    subscribe(slice, callback) {
        if (!this.subscribers.has(slice)) {
            this.subscribers.set(slice, new Set());
        }
        this.subscribers.get(slice).add(callback);
        
        // Return unsubscribe function
        return () => {
            const sliceSubscribers = this.subscribers.get(slice);
            if (sliceSubscribers) {
                sliceSubscribers.delete(callback);
            }
        };
    }

    // Update state
    updateState(updates) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        
        // Deep merge updates
        this.state = this.deepMerge(this.state, updates);
        
        // Emit change event
        this.emit('stateChanged', this.state, oldState);
        
        // Notify specific slice subscribers
        Object.keys(updates).forEach(slice => {
            if (this.subscribers.has(slice)) {
                this.subscribers.get(slice).forEach(callback => {
                    try {
                        callback(this.state[slice], oldState[slice]);
                    } catch (error) {
                        console.error('Error in state subscriber callback:', error);
                    }
                });
            }
        });
    }

    // Update specific slice
    updateSlice(slice, updates) {
        this.updateState({ [slice]: updates });
    }

    // Deep merge utility
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    // Session actions
    setSessionActive(isActive) {
        this.updateSlice('session', { 
            isActive,
            startTime: isActive ? Date.now() : null,
            error: null
        });
    }

    setSessionStatus(status) {
        this.updateSlice('session', { status });
    }

    setSessionError(error) {
        this.updateSlice('session', { error });
    }

    setSessionInitializing(isInitializing) {
        this.updateSlice('session', { isInitializing });
    }

    // Conversation actions
    setCurrentSessionId(sessionId) {
        this.updateSlice('conversation', { currentSessionId: sessionId });
    }

    addResponse(response) {
        const { responses } = this.state.conversation;
        const newResponses = [...responses, response];
        this.updateSlice('conversation', { 
            responses: newResponses,
            currentResponseIndex: newResponses.length - 1
        });
    }

    setCurrentResponseIndex(index) {
        this.updateSlice('conversation', { currentResponseIndex: index });
    }

    addToHistory(turn) {
        const { history } = this.state.conversation;
        this.updateSlice('conversation', { 
            history: [...history, turn]
        });
    }

    clearConversation() {
        this.updateSlice('conversation', {
            history: [],
            responses: [],
            currentResponseIndex: 0
        });
    }

    // Settings actions
    updateSettings(settings) {
        this.updateSlice('settings', settings);
    }

    setProfile(profile) {
        this.updateSlice('settings', { profile });
    }

    setLanguage(language) {
        this.updateSlice('settings', { language });
    }

    setScreenshotInterval(interval) {
        this.updateSlice('settings', { screenshotInterval: interval });
    }

    setImageQuality(quality) {
        this.updateSlice('settings', { imageQuality: quality });
    }

    setAdvancedMode(enabled) {
        this.updateSlice('settings', { advancedMode: enabled });
    }

    setContentProtection(enabled) {
        this.updateSlice('settings', { contentProtection: enabled });
    }

    // UI actions
    setCurrentView(view) {
        this.updateSlice('ui', { currentView: view });
    }

    setRecording(isRecording) {
        this.updateSlice('ui', { isRecording });
    }

    setMinimized(isMinimized) {
        this.updateSlice('ui', { isMinimized });
    }

    setCompactLayout(compact) {
        this.updateSlice('ui', { compactLayout: compact });
    }

    // Reset all state
    reset() {
        this.state = {
            session: {
                isActive: false,
                isInitializing: false,
                status: 'Ready',
                error: null,
                startTime: null
            },
            conversation: {
                currentSessionId: null,
                history: [],
                responses: [],
                currentResponseIndex: 0
            },
            settings: {
                profile: 'exam',
                language: 'en-US',
                screenshotInterval: 5,
                imageQuality: 'medium',
                advancedMode: false,
                contentProtection: true
            },
            ui: {
                currentView: 'assistant',
                isRecording: false,
                isMinimized: false,
                compactLayout: false
            }
        };
        
        this.emit('stateChanged', this.state, {});
    }
}

// Create singleton instance
const store = new Store();

module.exports = store; 