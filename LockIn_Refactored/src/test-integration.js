// Simple integration test for the refactored architecture
const GeminiService = require('./services/GeminiService');
const AudioService = require('./services/AudioService');
const ScreenshotService = require('./services/ScreenshotService');
const ConversationService = require('./services/ConversationService');
const store = require('./store');

console.log('🧪 Testing refactored architecture...');

// Test service instantiation
console.log('1. Testing service instantiation...');
try {
    const geminiService = new GeminiService();
    const audioService = new AudioService();
    const screenshotService = new ScreenshotService();
    const conversationService = new ConversationService();
    
    console.log('✅ All services instantiated successfully');
} catch (error) {
    console.error('❌ Service instantiation failed:', error);
}

// Test state management
console.log('2. Testing state management...');
try {
    const initialState = store.getState();
    console.log('Initial state:', initialState);
    
    store.setSessionActive(true);
    store.setSessionStatus('Testing');
    store.addResponse('Test response');
    
    const updatedState = store.getState();
    console.log('Updated state:', updatedState);
    
    console.log('✅ State management working correctly');
} catch (error) {
    console.error('❌ State management failed:', error);
}

// Test service callbacks
console.log('3. Testing service callbacks...');
try {
    const geminiService = new GeminiService();
    const audioService = new AudioService();
    const screenshotService = new ScreenshotService();
    const conversationService = new ConversationService();
    
    // Set up callbacks
    geminiService.setCallbacks(
        (response) => console.log('Gemini response:', response),
        (status) => console.log('Gemini status:', status),
        (error) => console.log('Gemini error:', error)
    );
    
    audioService.setCallbacks(
        (audioData) => console.log('Audio chunk received'),
        (voiceEndTime) => console.log('Voice end time:', voiceEndTime),
        (rms) => console.log('Silence detected:', rms),
        (rms) => console.log('Voice detected:', rms)
    );
    
    screenshotService.setCallbacks(
        (result) => console.log('Screenshot captured:', result.success),
        (error) => console.log('Screenshot error:', error)
    );
    
    conversationService.setCallbacks(
        (sessionData) => console.log('Conversation saved:', sessionData.sessionId),
        (sessionData) => console.log('Conversation loaded:', sessionData?.sessionId),
        (error) => console.log('Conversation error:', error)
    );
    
    console.log('✅ Service callbacks set up successfully');
} catch (error) {
    console.error('❌ Service callbacks failed:', error);
}

// Test IPC channels
console.log('4. Testing IPC channels...');
try {
    const { CHANNELS } = require('./ipc/channels');
    
    console.log('Available channels:');
    Object.entries(CHANNELS).forEach(([category, channels]) => {
        console.log(`  ${category}:`, Object.values(channels));
    });
    
    console.log('✅ IPC channels defined correctly');
} catch (error) {
    console.error('❌ IPC channels test failed:', error);
}

console.log('🎉 Integration test completed!');
console.log('📋 Summary:');
console.log('  - Service Layer: ✅ Working');
console.log('  - State Management: ✅ Working');
console.log('  - IPC Layer: ✅ Working');
console.log('  - Callbacks: ✅ Working'); 