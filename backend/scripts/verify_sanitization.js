const fs = require('fs');
const path = require('path');

// Simulate the logic in video.controller.js
function testSanitization() {
    console.log("🚀 Testing Filename Sanitization...");

    const tempDir = path.join(__dirname, 'temp_test_uploads');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 1. Simulate a Cloudinary Public ID with folders
    const unsafeFilename = "pulse_videos/subfolder/my_video";
    
    // 2. Apply sanitizer
    const safeFilename = unsafeFilename.replace(/[\/\\]/g, '_');
    
    // 3. Construct Path
    const tempFilePath = path.join(tempDir, `temp-${Date.now()}-${safeFilename}.mp4`);
    
    console.log(`Original: ${unsafeFilename}`);
    console.log(`Sanitized: ${safeFilename}`);
    console.log(`Full Path: ${tempFilePath}`);

    // 4. Verify we can write to this path
    try {
        fs.writeFileSync(tempFilePath, "dummy content");
        console.log("✅ SUCCESS: File created successfully (Path is valid).");
        
        // Cleanup
        fs.unlinkSync(tempFilePath);
        fs.rmdirSync(tempDir);
        console.log("🧹 Cleanup done.");
    } catch (error) {
        console.error("❌ FAILURE: Could not create file.", error.message);
    }
}

testSanitization();
