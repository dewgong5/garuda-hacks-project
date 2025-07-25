// Test Gemini service with hardcoded API key
const GeminiService = require('./services/GeminiService');

async function testGeminiService() {
    console.log('🧪 Testing Gemini service with hardcoded API key...');
    
    const geminiService = new GeminiService();
    
    // Set up callbacks
    geminiService.setCallbacks(
        (response) => console.log('✅ Response received:', response),
        (status) => console.log('📊 Status:', status),
        (error) => console.log('❌ Error:', error)
    );
    
    try {
        console.log('🚀 Initializing Gemini service...');
        const success = await geminiService.initialize();
        
        if (success) {
            console.log('✅ Gemini service initialized successfully');
            
            // Test sending a simple message
            console.log('📤 Testing message sending...');
            const result = await geminiService.sendMessage('Hello, this is a test message');
            console.log('✅ Message sent successfully:', result);
            
            // Close the session
            await geminiService.closeSession();
            console.log('✅ Session closed successfully');
        } else {
            console.log('❌ Failed to initialize Gemini service');
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testGeminiService(); 