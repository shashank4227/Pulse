const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { getVideoStream } = require('../controllers/video.controller');
const Video = require('../models/Video');

dotenv.config();

// Mock Response
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        console.log(`[Response Status]: ${code}`);
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        console.log(`[Response JSON]:`, data);
        return res;
    };
    res.redirect = (url) => {
        console.log(`[Response Redirect]: ${url}`);
        res.redirectedUrl = url;
    };
    return res;
};

// Mock Request
const mockReq = (videoId, userOrg) => ({
    params: { id: videoId },
    user: { organization: userOrg },
    headers: {}
});

async function verifyCloudinaryLogic() {
    console.log("🚀 Starting Cloudinary Logic Verification...");
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Custom DB Connected");

        // 1. Create a dummy video with a CLOUDINARY URL
        const fakeUrl = 'https://res.cloudinary.com/demo/video/upload/v123456789/sample.mp4';
        const video = await Video.create({
            title: 'Cloudinary Test',
            description: 'Testing redirect logic',
            filename: 'sample_public_id',
            path: fakeUrl,
            size: 12345,
            mimetype: 'video/mp4',
            uploadedBy: new mongoose.Types.ObjectId(),
            organization: 'test-org',
            processingStatus: 'completed'
        });
        
        console.log(`📝 Created dummy video: ${video._id} with path: ${fakeUrl}`);

        // 2. Call controller method
        const req = mockReq(video._id, 'test-org');
        const res = mockRes();

        console.log("▶️ Calling getVideoStream...");
        await getVideoStream(req, res);

        // 3. Verify Result
        if (res.redirectedUrl === fakeUrl) {
            console.log("\n✅ SUCCESS: Controller redirected to Cloudinary URL.");
        } else {
            console.error(`\n❌ FAILURE: Expected redirect to ${fakeUrl}, got ${res.redirectedUrl}`);
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

verifyCloudinaryLogic();
