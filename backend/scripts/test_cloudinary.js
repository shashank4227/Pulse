const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

console.log("Checking Cloudinary Config...");
console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`API Key: ${process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing'}`);
console.log(`API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing'}`);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testConnection() {
    try {
        console.log("Attempting to upload a test file...");
        // Create a dummy file
        const testFile = 'test_upload.txt';
        fs.writeFileSync(testFile, 'This is a test file to verify Cloudinary config.');

        const result = await cloudinary.uploader.upload(testFile, { 
            resource_type: 'auto',
            folder: 'test_folder' 
        });

        console.log("✅ Upload Successful!");
        console.log("Public ID:", result.public_id);
        console.log("URL:", result.secure_url);

        // Cleanup
        await cloudinary.uploader.destroy(result.public_id);
        console.log("✅ Cleanup Successful!");
        fs.unlinkSync(testFile);

    } catch (error) {
        console.error("❌ Cloudinary Error:", error);
    }
}

testConnection();
