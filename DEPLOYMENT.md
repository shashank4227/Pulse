# Deployment Guide

## 1. Backend Deployment (Render/Heroku/Railway)
1.  **Environment Variables**:
    - `MONGO_URI`: Connection string to MongoDB Atlas.
    - `JWT_SECRET`: Strong secret key.
    - `CLIENT_URL`: URL of your deployed frontend (e.g., https://pulse-app.vercel.app).
2.  **Build Command**: `npm install`
3.  **Start Command**: `node server.js`

## 2. Frontend Deployment (Vercel/Netlify)
1.  **Build Command**: `npm run build`
2.  **Output Directory**: `dist`
3.  **Environment Variables**:
    - Update `src/utils/api.js` to point to your production Backend URL instead of localhost.

## 3. Storage
- **Current**: Local filesystem (`uploads/`).
- **Production**: For persistent storage on serverless platforms (like Heroku/Vercel), you MUST switch to cloud storage (AWS S3 or Cloudinary).
    - *Note*: The current `multer.diskStorage` configuration is for local/VPS deployment only.

## 4. Database
- Create a free cluster on MongoDB Atlas.
- Allow access from 0.0.0.0/0 (for demo purposes) or specific IPs.
