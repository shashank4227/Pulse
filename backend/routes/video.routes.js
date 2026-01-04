const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadVideo, getVideos, getVideoStream, updateVideo, incrementView, deleteVideo } = require('../controllers/video.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'))
    },
    filename: function (req, file, cb) {
        // Sanitize filename to avoid issues with special characters
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + safeName)
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only videos are allowed'));
        }
    }
});

// Routes
router.post('/upload', protect, authorize('admin', 'editor'), upload.single('video'), uploadVideo);
router.get('/', protect, getVideos); // All roles can list (scoped to tenant)
router.get('/stream/:id', protect, getVideoStream); 
router.put('/:id', protect, authorize('admin', 'editor'), updateVideo); 
router.delete('/:id', protect, authorize('admin', 'editor'), deleteVideo); 
router.post('/:id/view', protect, incrementView); 

module.exports = router;
