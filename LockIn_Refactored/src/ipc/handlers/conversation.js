const { ipcBridge, CHANNELS } = require('../bridge');
const ConversationService = require('../../services/ConversationService');

class ConversationIpcHandlers {
    constructor(conversationService, store) {
        this.conversationService = conversationService;
        this.store = store;
        this.setupCallbacks();
    }

    setupCallbacks() {
        // Set up Conversation service callbacks
        this.conversationService.setCallbacks(
            // onConversationSaved
            (sessionData) => {
                ipcBridge.sendToRenderer(CHANNELS.EVENTS.CONVERSATION_SAVED, sessionData);
            },
            // onConversationLoaded
            (sessionData) => {
                if (sessionData) {
                    this.store.updateSlice('conversation', {
                        history: sessionData.conversationHistory || []
                    });
                }
            },
            // onError
            (error) => {
                console.error('Conversation service error:', error);
            }
        );
    }

    setupHandlers() {
        // Initialize conversation storage
        ipcBridge.handle(CHANNELS.CONVERSATION.INIT_STORAGE, async () => {
            try {
                console.log('💾 Initializing conversation storage via IPC...');
                const result = await this.conversationService.initConversationStorage();
                console.log('✅ Conversation storage initialized via IPC');
                return { success: true, result };
            } catch (error) {
                console.error('❌ Failed to initialize conversation storage via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Save conversation session
        ipcBridge.handle(CHANNELS.CONVERSATION.SAVE_SESSION, async (event, { sessionId, history }) => {
            try {
                console.log('💾 Saving conversation session via IPC:', sessionId);
                const result = await this.conversationService.saveConversationSession(sessionId, history);
                console.log('✅ Conversation session saved via IPC');
                return { success: true, result };
            } catch (error) {
                console.error('❌ Failed to save conversation session via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Get conversation session
        ipcBridge.handle(CHANNELS.CONVERSATION.GET_SESSION, async (event, sessionId) => {
            try {
                console.log('📖 Getting conversation session via IPC:', sessionId);
                const result = await this.conversationService.getConversationSession(sessionId);
                console.log('✅ Conversation session retrieved via IPC');
                return { success: true, result };
            } catch (error) {
                console.error('❌ Failed to get conversation session via IPC:', error);
                return { success: false, error: error.message };
            }
        });

        // Get all conversation sessions
        ipcBridge.handle(CHANNELS.CONVERSATION.GET_ALL_SESSIONS, async () => {
            try {
                console.log('📚 Getting all conversation sessions via IPC...');
                const result = await this.conversationService.getAllConversationSessions();
                console.log('✅ All conversation sessions retrieved via IPC');
                return { success: true, result };
            } catch (error) {
                console.error('❌ Failed to get all conversation sessions via IPC:', error);
                return { success: false, error: error.message };
            }
        });
    }

    removeHandlers() {
        // Remove all Conversation IPC handlers
        Object.values(CHANNELS.CONVERSATION).forEach(channel => {
            ipcBridge.removeHandler(channel);
        });
    }

    // Save conversation turn (called from Gemini service)
    async saveConversationTurn(sessionId, transcription, aiResponse) {
        try {
            const turn = await this.conversationService.saveConversationTurn(sessionId, transcription, aiResponse);
            this.store.addToHistory(turn);
            return turn;
        } catch (error) {
            console.error('Failed to save conversation turn:', error);
            throw error;
        }
    }

    // Set current session
    setCurrentSession(sessionId) {
        this.conversationService.setCurrentSession(sessionId);
        this.store.setCurrentSessionId(sessionId);
    }

    // Clear current session
    clearCurrentSession() {
        this.conversationService.clearCurrentSession();
        this.store.clearConversation();
    }
}

module.exports = ConversationIpcHandlers; 