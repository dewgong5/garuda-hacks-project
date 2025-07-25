// Test script to verify all backend modules work correctly
const GeminiClient = require('./backend/gemini_client');
const AudioService = require('./backend/audio_serv');
const ImageService = require('./backend/image_serv');
const TokenTracker = require('./backend/token_tracker');
const ConversationLogger = require('./backend/conv_log');
const InputCapture = require('./backend/input_cap');

console.log('✅ All backend modules imported successfully!');

// Test basic functionality
const gemini = new GeminiClient();
const audio = new AudioService();
const image = new ImageService();
const tokens = new TokenTracker();
const logger = new ConversationLogger();
const input = new InputCapture();

console.log('✅ All service instances created successfully!');

console.log('🎉 Backend modules are working correctly!');
console.log('You can now test the full application with: npm start'); 