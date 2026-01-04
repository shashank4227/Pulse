const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Script to list all available Gemini models
 * This helps identify which models are available for your API key
 */
async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    
    if (!key || key === 'your_api_key_here') {
        console.error("❌ GEMINI_API_KEY not configured in .env file");
        console.log("Please set GEMINI_API_KEY in your .env file");
        return;
    }

    console.log("🔑 API Key found (starts with:", key.substring(0, 10) + "...)");
    console.log("\n📋 Fetching available models...\n");

    try {
        const genAI = new GoogleGenerativeAI(key);
        
        // Note: The SDK doesn't have a direct listModels method in v0.24.1
        // We'll try common model names and see which ones work
        
        const modelsToTest = [
            "gemini-1.5-pro-latest",
            "gemini-1.5-flash-latest", 
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-pro",
            "gemini-pro-vision"
        ];

        const workingModels = [];
        const failedModels = [];

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Try a simple test call
                const result = await model.generateContent("Say 'test'");
                const response = result.response.text();
                
                if (response) {
                    workingModels.push(modelName);
                    console.log(`✅ ${modelName} - WORKING`);
                }
            } catch (error) {
                failedModels.push({ name: modelName, error: error.message });
                console.log(`❌ ${modelName} - ${error.message.split('\n')[0]}`);
            }
        }

        console.log("\n" + "=".repeat(60));
        console.log("📊 Summary:");
        console.log(`✅ Working models: ${workingModels.length}`);
        console.log(`❌ Failed models: ${failedModels.length}`);
        
        if (workingModels.length > 0) {
            console.log("\n💡 Recommended: Set GEMINI_MODEL_NAME in .env to one of:");
            workingModels.forEach(m => console.log(`   - ${m}`));
        } else {
            console.log("\n⚠️  No working models found. Possible issues:");
            console.log("   1. API key may not have access to these models");
            console.log("   2. API key may be invalid");
            console.log("   3. Models may require different API version");
            console.log("\n   Check: https://ai.google.dev/models/gemini");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

listModels();

