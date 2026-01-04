const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');

dotenv.config({ path: path.join(__dirname, '../.env') });

const clearData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Delete all videos from DB
        const result = await Video.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} videos from Database.`);

        // Delete files from uploads directory
        const uploadsDir = path.join(__dirname, '../uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                if (file === '.gitkeep') continue; // Optional: keep .gitkeep
                fs.unlinkSync(path.join(uploadsDir, file));
                console.log(`Deleted file: ${file}`);
            }
            console.log('🗑️  Cleared uploads directory.');
        }

        process.exit();
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
