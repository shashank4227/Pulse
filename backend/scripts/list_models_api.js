const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * List available Gemini models using the REST API
 * This will show exactly which models are available for your API key
 */
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        }).on('error', reject);
    });
}

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_api_key_here') {
        console.error("❌ GEMINI_API_KEY not configured in .env file");
        return;
    }

    console.log("🔑 Fetching available models from Gemini API...\n");

    // Try both v1 and v1beta endpoints
    const endpoints = [
        { url: `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, version: 'v1' },
        { url: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, version: 'v1beta' }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Trying ${endpoint.version} API...`);
            
            const data = await makeRequest(endpoint.url);
            
            if (data.models && Array.isArray(data.models)) {
                console.log(`\n✅ Found ${data.models.length} models in ${endpoint.version}:\n`);
                
                // Filter for models that support generateContent
                const generateContentModels = data.models.filter(model => 
                    model.supportedGenerationMethods && 
                    model.supportedGenerationMethods.includes('generateContent')
                );
                
                console.log("📋 Models supporting generateContent:");
                generateContentModels.forEach(model => {
                    const name = model.name.replace('models/', '');
                    console.log(`   ✅ ${name}`);
                    if (model.displayName) {
                        console.log(`      Display: ${model.displayName}`);
                    }
                });
                
                // Check for video-capable models
                const videoModels = generateContentModels.filter(model => 
                    model.name.includes('1.5') || 
                    model.name.includes('flash') ||
                    model.name.includes('pro')
                );
                
                if (videoModels.length > 0) {
                    console.log("\n🎥 Recommended models for video analysis:");
                    videoModels.forEach(model => {
                        const name = model.name.replace('models/', '');
                        console.log(`   💡 ${name}`);
                        console.log(`      Set in .env: GEMINI_MODEL_NAME=${name}`);
                    });
                }
                
                return; // Success, exit
            } else if (data.error) {
                console.log(`❌ API Error: ${data.error.message}`);
            }
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}`);
        }
    }
    
    console.log("\n⚠️  Could not fetch models list. Testing individual models...");
    
    // Manual test with common model names
    const testModels = [
        'gemini-1.5-pro',
        'gemini-1.5-flash', 
        'gemini-pro',
        'gemini-pro-vision'
    ];
    
    console.log("\n🧪 Testing model access directly:");
    for (const modelName of testModels) {
        try {
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}?key=${apiKey}`;
            const data = await makeRequest(testUrl);
            
            if (data.name) {
                console.log(`✅ ${modelName} - Available`);
                if (data.supportedGenerationMethods) {
                    console.log(`   Methods: ${data.supportedGenerationMethods.join(', ')}`);
                }
            } else if (data.error) {
                console.log(`❌ ${modelName} - ${data.error.message}`);
            }
        } catch (error) {
            console.log(`❌ ${modelName} - ${error.message}`);
        }
    }
}

listModels().catch(console.error);

