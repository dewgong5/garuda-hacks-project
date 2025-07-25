// backend/conv_log.js
class ConversationLogger {
    constructor() {
        this.conversationDB = null;
    }

    async initConversationStorage() {
        // IndexedDB is not available in main process, so we'll use a simple in-memory storage
        console.log('💾 Initializing conversation storage (in-memory)...');
        this.conversationDB = {
            sessions: new Map(),
            addSession: (sessionId, data) => this.conversationDB.sessions.set(sessionId, data),
            getSession: (sessionId) => this.conversationDB.sessions.get(sessionId),
            getAllSessions: () => Array.from(this.conversationDB.sessions.values())
        };
        return this.conversationDB;
    }

    async saveConversationSession(sessionId, conversationHistory) {
        if (!this.conversationDB) await this.initConversationStorage();
        
        const sessionData = {
            sessionId,
            timestamp: parseInt(sessionId),
            conversationHistory,
            lastUpdated: Date.now()
        };
        
        this.conversationDB.addSession(sessionId, sessionData);
        console.log('💾 Conversation session saved:', sessionId);
        return sessionData;
    }

    async getConversationSession(sessionId) {
        if (!this.conversationDB) await this.initConversationStorage();
        const session = this.conversationDB.getSession(sessionId);
        console.log('📖 Conversation session retrieved:', sessionId);
        return session;
    }

    async getAllConversationSessions() {
        if (!this.conversationDB) await this.initConversationStorage();
        const sessions = this.conversationDB.getAllSessions();
        const sortedSessions = sessions.sort((a, b) => b.timestamp - a.timestamp);
        console.log('📚 All conversation sessions retrieved:', sortedSessions.length);
        return sortedSessions;
    }

    // For now, provide a simple file-based logging since IndexedDB is not available in main process
    async logConversation(sessionId, message, response) {
        console.log(`[${sessionId}] ${message} -> ${response}`);
        // In a real implementation, you'd save to a file or database
    }
}

module.exports = ConversationLogger;
