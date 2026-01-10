const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Video = require('../models/Video');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        console.log('🗑️  Clearing all videos...');
        await Video.deleteMany({});
        
        console.log('✅ All video data cleared successfully!');
        process.exit();
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
