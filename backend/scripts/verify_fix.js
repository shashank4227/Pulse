const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { getVideoStream } = require('../controllers/video.controller');
const Video = require('../models/Video');

dotenv.config();

// Simple mock for Express Response
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        console.log(`[Response Status]: ${code}`);
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        console.log(`[Response JSON]:`, data);
        res.body = data;
        return res;
    };
    res.writeHead = (code, headers) => {
        console.log(`[Response Headers]: ${code}`, headers);
    };
    return res;
};

// Mock Request
const mockReq = (videoId, userOrg) => ({
    params: { id: videoId },
    user: { organization: userOrg },
    headers: {}
});

async function verifyFix() {
    console.log("🚀 Starting Verification Script...");
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Custom DB Connected");

        // 1. Create a dummy video with a MISSING file path
        const fakePath = './uploads/non_existent_file_' + Date.now() + '.mp4';
        const video = await Video.create({
            title: 'Test Missing File',
            description: 'This video file does not exist',
            filename: 'fake.mp4',
            path: fakePath,
            size: 12345,
            mimetype: 'video/mp4',
            uploadedBy: new mongoose.Types.ObjectId(), // Fake User ID
            organization: 'test-org',
            processingStatus: 'completed'
        });
        
        console.log(`📝 Created dummy video: ${video._id} with path: ${fakePath}`);

        // 2. Call controller method
        const req = mockReq(video._id, 'test-org');
        const res = mockRes();

        console.log("▶️ Calling getVideoStream...");
        await getVideoStream(req, res);

        // 3. Verify Result
        if (res.statusCode === 404) {
            console.log("\n✅ SUCCESS: Controller returned 404 for missing file.");
        } else {
            console.error(`\n❌ FAILURE: Expected 404, got ${res.statusCode}`);
        }

        // Cleanup
        await Video.findByIdAndDelete(video._id);
        console.log("🧹 Cleaned up test video");

    } catch (error) {
        console.error("❌ Unexpected Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

verifyFix();
