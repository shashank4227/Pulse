const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function check() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Checking key starting with:", key ? key.substring(0, 5) : "UNDEFINED");
    
    if (!key) {
        console.error("No API Key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    
    // Try to get a model and run it
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
    
    for (const modelName of modelsToTry) {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello!");
            console.log(`✅ SUCCESS: ${modelName} is working!`);
            console.log("Response:", result.response.text());
            return; // We found a working one!
        } catch (e) {
            console.log(`❌ FAILED: ${modelName}`);
            console.log(`Error: ${e.message}`);
        }
    }
}

check();
