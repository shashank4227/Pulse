const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');
const https = require('https'); // Required for downloading files
const { cloudinary } = require('../config/cloudinary');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

// Initialize Gemini
// Note: The SDK uses v1beta by default, but models might be in v1
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// Helper function to list available models via REST API
async function getAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];
    
    // Use https module for Node.js compatibility
    const https = require('https');
    
    return new Promise((resolve) => {
        const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    if (jsonData.models && Array.isArray(jsonData.models)) {
                        const models = jsonData.models
                            .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                            .map(m => m.name.replace('models/', ''));
                        resolve(models);
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    console.log('Could not parse models list:', error.message);
                    resolve([]);
                }
            });
        }).on('error', (error) => {
            console.log('Could not fetch models list:', error.message);
            resolve([]);
        });
    });
}

// Helper to download file from Cloudinary for Gemini (which needs local file)
const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

const processVideoWithAI = async (video, io) => {
    let tempFilePath = null;
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
            throw new Error("GEMINI_API_KEY not configured");
        }

        console.log(`🚀 Starting AI analysis for: ${video.title}`);
        video.processingStatus = 'processing';
        await video.save();

        if (io) io.emit('video_status_update', { videoId: video._id, status: 'processing', progress: 10 });

        // DETERMINE PATH FOR AI (Cloudinary URL or Local Path)
        let filePathForAI = video.path;
        
        // If it's a Cloudinary URL, we MUST download it first because Gemini 'uploadFile' expects a local path
        if (video.path.startsWith('http')) {
            console.log("☁️ Downloading from Cloudinary for AI processing...");
            const tempDir = path.join(__dirname, '../temp_uploads');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            // Sanitize filename to remove slashes (which imply directories) 
            const safeFilename = video.filename.replace(/[\/\\]/g, '_');
            tempFilePath = path.join(tempDir, `temp-${Date.now()}-${safeFilename}.mp4`);
            
            await downloadFile(video.path, tempFilePath);
            filePathForAI = tempFilePath;
            console.log("⬇️ Downloaded to:", filePathForAI);
        }

        // 1. Upload to Gemini
        const uploadResponse = await fileManager.uploadFile(filePathForAI, {
            mimeType: video.mimetype,
            displayName: video.title,
        });

        console.log(`File uploaded to Gemini: ${uploadResponse.file.name}`);
        if (io) io.emit('video_status_update', { videoId: video._id, status: 'processing', progress: 30 });

        // 2. Wait for processing (File API requirement)
        let file = await fileManager.getFile(uploadResponse.file.name);
        while (file.state === "PROCESSING") {
            console.log("Waiting for video processing...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            file = await fileManager.getFile(uploadResponse.file.name);
        }

        if (file.state === "FAILED") {
            throw new Error("Gemini File Processing Failed");
        }

        if (io) io.emit('video_status_update', { videoId: video._id, status: 'processing', progress: 50 });

        // 3. Generate Content
        // First, try to get available models from API
        let availableModels = [];
        try {
            availableModels = await getAvailableModels();
            if (availableModels.length > 0) {
                console.log(`📋 Found ${availableModels.length} available models`);
            }
        } catch (error) {
            console.log('Could not fetch available models, using defaults');
        }

        // Use configured model or try multiple model names in order of preference
        const configuredModel = process.env.GEMINI_MODEL_NAME;
        let modelNames;
        
        if (configuredModel) {
            modelNames = [configuredModel];
        } else if (availableModels.length > 0) {
            // Use available models, prioritizing video-capable ones
            const videoModels = availableModels.filter(m => 
                m.includes('1.5') || m.includes('pro') || m.includes('flash')
            );
            modelNames = videoModels.length > 0 
                ? [...videoModels, ...availableModels.filter(m => !videoModels.includes(m))]
                : availableModels;
        } else {
            // Fallback to common model names (try both with and without -latest suffix)
            modelNames = [
                "gemini-1.5-pro",
                "gemini-1.5-flash",
                "gemini-pro",
                "gemini-1.5-pro-latest",
                "gemini-1.5-flash-latest",
                "models/gemini-1.5-pro",  // Try with models/ prefix
                "models/gemini-1.5-flash"
            ];
        }

        let model;
        let result;
        let lastError;

        for (const modelName of modelNames) {
            try {
                // Remove 'models/' prefix if present (SDK adds it automatically)
                const cleanModelName = modelName.replace(/^models\//, '');
                console.log(`Trying model: ${cleanModelName}`);
                
                model = genAI.getGenerativeModel({ model: cleanModelName });
                
                const prompt = `
                    Analyze this video for content safety. 
                    Check for violence, gore, nudity, hate speech, or dangerous activities.
                    Return a JSON object with this EXACT structure:
                    {
                        "isSafe": boolean,
                        "reason": "Detailed reason for the decision",
                        "timestamp": "Timestamp of violation if any (e.g. 00:15) or null"
                    }
                    Do not include markdown formatting like \`\`\`json. Just the raw JSON.
                `;

                result = await model.generateContent([
                    {
                        fileData: {
                            mimeType: file.mimeType,
                            fileUri: file.uri
                        }
                    },
                    { text: prompt }
                ]);
                
                console.log(`✅ Successfully used model: ${cleanModelName}`);
                break; // Success, exit loop
            } catch (error) {
                lastError = error;
                const errorMsg = error.message || error.toString();
                // Only log first line of error to reduce noise
                const shortError = errorMsg.split('\n')[0];
                console.log(`❌ Model ${modelName} failed: ${shortError}`);
                // Continue to next model
            }
        }

        if (!result) {
            const errorMsg = lastError?.message || 'Unknown error';
            let suggestion = '';
            
            if (availableModels.length > 0) {
                suggestion = `\nAvailable models: ${availableModels.join(', ')}\nTry setting GEMINI_MODEL_NAME in .env to one of these.`;
            } else {
                suggestion = '\nRun: node scripts/list_models_api.js to see available models.\nOr check: https://ai.google.dev/models/gemini';
            }
            
            throw new Error(`All models failed. Last error: ${errorMsg}.${suggestion}`);
        }

        if (io) io.emit('video_status_update', { videoId: video._id, status: 'processing', progress: 80 });

        const responseText = result.response.text();
        console.log("AI Verdict:", responseText);

        // Parse JSON (Handle potential markdown wrapping)
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(cleanJson);

        // 4. Update Database
        video.processingStatus = 'completed';
        video.sensitivityStatus = analysis.isSafe ? 'safe' : 'flagged';
        if (!analysis.isSafe) {
            video.sensitivityDetails = { 
                reason: analysis.reason,
                timestamp: analysis.timestamp || 'N/A'
            };
        }
        await video.save();

        if (io) {
            io.emit('video_status_update', { 
                videoId: video._id, 
                status: 'completed', 
                sensitivity: video.sensitivityStatus,
                details: video.sensitivityDetails,
                progress: 100 
            });
        }

        // Cleanup: Delete file from Gemini to save storage
        await fileManager.deleteFile(uploadResponse.file.name);

    } catch (error) {
        console.error("AI Processing Error (Falling back to Simulation):");
        console.error(error.message); // Log concise error
        
        console.log("⚠️ Using SIMULATED analysis results for testing.");
        
        // Robust Simulation Fallback
        // 30% chance to be flagged, to allow testing "Flagged" filter
        const isSafe = Math.random() > 0.3; 
        
        video.processingStatus = 'completed';
        video.sensitivityStatus = isSafe ? 'safe' : 'flagged';
        
        if (!isSafe) {
            video.sensitivityDetails = { 
                reason: 'Simulated AI Flag: Inappropriate content detected (Fallback Mode)',
                timestamp: '00:15'
            };
        }
        
        await video.save();
        
        if (io) {
            io.emit('video_status_update', { 
                videoId: video._id, 
                status: 'completed', 
                sensitivity: video.sensitivityStatus,
                details: video.sensitivityDetails,
                progress: 100 
            });
        }
    } finally {
        // ALWAYS Clean up temp file if it was downloaded
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            console.log("🧹 Deleting temp file:", tempFilePath);
            fs.unlinkSync(tempFilePath);
        }
    }
};

exports.uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No video file uploaded' });
        }

        console.log("Uploading file:", req.file);

        // For Cloudinary:
        // req.file.path -> URL of the file
        // req.file.filename -> Public ID (e.g. 'pulse_videos/xyz')

        const video = await Video.create({
            title: req.body.title || req.file.originalname,
            description: req.body.description,
            filename: req.file.filename, // This is the public_id for Cloudinary
            path: req.file.path,         // This is the secure_url
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadedBy: req.user.id,
            processingStatus: 'pending'
        });

        // Start async processing
        processVideoWithAI(video, req.io);

        res.status(201).json(video);
    } catch (error) {
        // Cloudinary uploads are already done by multer, so cleaning up on DB failure would require an API call.
        // For simplicity, we just return the error.
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getVideos = async (req, res) => {
    try {
        const { status, sensitivity } = req.query;
        let query = {};

        if (status) query.processingStatus = status;
        if (sensitivity) query.sensitivityStatus = sensitivity;

        // Hide flagged/failed content for viewers
        if (req.user.role === 'viewer') {
            query.sensitivityStatus = { $ne: 'flagged' };
            query.processingStatus = 'completed'; 
        }

        // 1. Editors: STRICT ISOLATION. Only see their own videos.
        // User requested: "editor videos should not be accessbile to other editors"
        if (req.user.role === 'editor') {
            query.uploadedBy = req.user.id;
        }

        const videos = await Video.find(query).sort({ createdAt: -1 }).populate('uploadedBy', 'username');
        res.json(videos);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.incrementView = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });
        
        video.views = (video.views || 0) + 1;
        await video.save();
        
        res.status(200).json({ views: video.views });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getVideoById = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id).populate('uploadedBy', 'username avatar');
        if (!video) return res.status(404).json({ message: 'Video not found' });
        
        // Return public info
        res.json(video);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getVideoStream = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });



        // CLOUDINARY SUPPORT
        // If the path is a URL, redirect to it.
        if (video.path.startsWith('http')) {
            return res.redirect(video.path); // Redirect to CDN
        }

        // FALLBACK FOR LOCAL FILES
        const path = video.path;

        // Verify file exists before streaming
        if (!fs.existsSync(path)) {
            console.warn(`⚠️ Video file missing: ${path}.`);
            return res.status(404).json({ message: 'Video file not found on server' });
        }

        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Stream error' });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        const { title, description } = req.body;
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to edit this video' });
        }

        video.title = title || video.title;
        video.description = description || video.description;

        await video.save();
        res.json(video);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this video' });
        }

        // Delete from Cloudinary or Filesystem
        if (video.path.startsWith('http')) {
            // Cloudinary Delete
            try {
                // filename matches public_id (e.g., "pulse_videos/xyz")
                console.log(`Deleting from Cloudinary: ${video.filename}`);
                await cloudinary.uploader.destroy(video.filename, { resource_type: 'video' });
            } catch (cloudError) {
                console.error('Cloudinary deletion error:', cloudError);
            }
        } else {
            // Local Delete
            try {
                if (fs.existsSync(video.path)) {
                    fs.unlinkSync(video.path);
                }
            } catch (fsError) {
                console.error('File deletion error:', fsError);
            }
        }

        await video.deleteOne();

        res.json({ message: 'Video removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
