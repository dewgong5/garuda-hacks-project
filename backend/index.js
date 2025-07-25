// backend/index.js
const GeminiClient = require('./geminiClient');

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('Missing GEMINI_API_KEY');
        process.exit(1);
    }

    const gemini = new GeminiClient(apiKey);
    await gemini.startSession();

    const question = process.argv[2] || 'Tell me a joke';
    const response = await gemini.sendMessage(question);
    console.log('Gemini says:', response);

    await gemini.closeSession();
}

run().catch(console.error);
