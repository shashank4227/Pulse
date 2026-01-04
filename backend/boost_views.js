const mongoose = require('mongoose');
const path = require('path');
const Video = require('./models/Video');

const boostVideo = async () => {
    try {
        const uri = 'mongodb://localhost:27017/pulse-video-app';
        console.log("Connecting to:", uri);
        await mongoose.connect(uri);
        const videos = await Video.find();
        
        if (videos.length > 0) {
            // Reset all videos to 0 views
            for (const video of videos) {
                video.views = 0;
                await video.save();
            }
            console.log(`Reset all ${videos.length} videos to 0 views.`);
        } else {
            console.log('No videos found.');
        }
        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

boostVideo();
