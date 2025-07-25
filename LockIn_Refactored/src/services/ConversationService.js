class ConversationService {
    constructor() {
        this.conversationDB = null;
        this.currentSessionId = null;
        this.conversationHistory = [];
        
        // Callbacks
        this.onConversationSaved = null;
        this.onConversationLoaded = null;
        this.onError = null;
    }

    setCallbacks(onConversationSaved, onConversationLoaded, onError) {
        this.onConversationSaved = onConversationSaved;
        this.onConversationLoaded = onConversationLoaded;
        this.onError = onError;
    }

    async initConversationStorage() {
        try {
            console.log('💾 Initializing conversation storage...');
            
            // For now, use in-memory storage since IndexedDB is not available in main process
            this.conversationDB = {
                sessions: new Map(),
                addSession: (sessionId, data) => this.conversationDB.sessions.set(sessionId, data),
                getSession: (sessionId) => this.conversationDB.sessions.get(sessionId),
                getAllSessions: () => Array.from(this.conversationDB.sessions.values())
            };
            
            console.log('✅ Conversation storage initialized');
            return this.conversationDB;
        } catch (error) {
            console.error('❌ Failed to initialize conversation storage:', error);
            this.onError?.(error);
            throw error;
        }
    }

    async saveConversationSession(sessionId, conversationHistory) {
        try {
            if (!this.conversationDB) {
                await this.initConversationStorage();
            }
            
            const sessionData = {
                sessionId,
                timestamp: parseInt(sessionId),
                conversationHistory,
                lastUpdated: Date.now()
            };
            
            this.conversationDB.addSession(sessionId, sessionData);
            console.log('💾 Conversation session saved:', sessionId);
            
            this.onConversationSaved?.(sessionData);
            return sessionData;
        } catch (error) {
            console.error('❌ Failed to save conversation session:', error);
            this.onError?.(error);
            throw error;
        }
    }

    async getConversationSession(sessionId) {
        try {
            if (!this.conversationDB) {
                await this.initConversationStorage();
            }
            
            const session = this.conversationDB.getSession(sessionId);
            console.log('📖 Conversation session retrieved:', sessionId);
            
            this.onConversationLoaded?.(session);
            return session;
        } catch (error) {
            console.error('❌ Failed to get conversation session:', error);
            this.onError?.(error);
            throw error;
        }
    }

    async getAllConversationSessions() {
        try {
            if (!this.conversationDB) {
                await this.initConversationStorage();
            }
            
            const sessions = this.conversationDB.getAllSessions();
            const sortedSessions = sessions.sort((a, b) => b.timestamp - a.timestamp);
            console.log('📚 All conversation sessions retrieved:', sortedSessions.length);
            
            return sortedSessions;
        } catch (error) {
            console.error('❌ Failed to get all conversation sessions:', error);
            this.onError?.(error);
            throw error;
        }
    }

    async saveConversationTurn(sessionId, transcription, aiResponse) {
        try {
            const conversationTurn = {
                timestamp: Date.now(),
                transcription: transcription.trim(),
                ai_response: aiResponse.trim(),
            };

            // Get existing session or create new one
            let session = await this.getConversationSession(sessionId);
            if (!session) {
                session = {
                    sessionId,
                    timestamp: parseInt(sessionId),
                    conversationHistory: [],
                    lastUpdated: Date.now()
                };
            }

            // Add the new turn
            session.conversationHistory.push(conversationTurn);
            session.lastUpdated = Date.now();

            // Save the updated session
            await this.saveConversationSession(sessionId, session.conversationHistory);
            
            console.log('💾 Conversation turn saved:', conversationTurn);
            return conversationTurn;
        } catch (error) {
            console.error('❌ Failed to save conversation turn:', error);
            this.onError?.(error);
            throw error;
        }
    }

    setCurrentSession(sessionId) {
        this.currentSessionId = sessionId;
        console.log('📝 Current session set to:', sessionId);
    }

    getCurrentSessionId() {
        return this.currentSessionId;
    }

    async logConversation(sessionId, message, response) {
        try {
            console.log(`[${sessionId}] ${message} -> ${response}`);
            await this.saveConversationTurn(sessionId, message, response);
        } catch (error) {
            console.error('❌ Failed to log conversation:', error);
            this.onError?.(error);
        }
    }

    clearCurrentSession() {
        this.currentSessionId = null;
        this.conversationHistory = [];
        console.log('🗑️ Current session cleared');
    }

    reset() {
        this.currentSessionId = null;
        this.conversationHistory = [];
        this.conversationDB = null;
    }
}

module.exports = ConversationService; 