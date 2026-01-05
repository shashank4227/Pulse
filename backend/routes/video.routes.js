const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadVideo, getVideos, getVideoStream, updateVideo, incrementView, deleteVideo, getVideoById } = require('../controllers/video.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const fs = require('fs');

const { storage } = require('../config/cloudinary');

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    // fileFilter check is handled partly by allowed_formats in storage, but we can keep additional checks if needed.
    // CloudinaryStorage doesn't support fileFilter in the same way, but multer does.
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
router.get('/:id', protect, getVideoById);
router.put('/:id', protect, authorize('admin', 'editor'), updateVideo); 
router.delete('/:id', protect, authorize('admin', 'editor'), deleteVideo); 
router.post('/:id/view', protect, incrementView); 

module.exports = router;
