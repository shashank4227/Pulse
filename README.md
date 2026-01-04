# Pulse Video Application

A comprehensive full-stack video management platform with real-time content analysis and streaming capabilities.

## 🎯 Project Objectives

### Core Functionality
1. ✅ **Full-Stack Architecture**: Node.js + Express + MongoDB (backend) and React + Vite (frontend)
2. ✅ **Video Management**: Complete video upload and secure storage system
3. ✅ **Content Analysis**: Process videos for sensitivity detection (safe/flagged classification)
4. ✅ **Real-Time Updates**: Display live processing progress to users via Socket.io
5. ✅ **Streaming Service**: Enable video playback using HTTP range requests
6. ✅ **Access Control**: Multi-tenant architecture with role-based permissions (Admin/Editor/Viewer)

## Features
- **Video Upload**: Progress tracking, file validation, and secure storage
- **Sensitivity Analysis**: Real-time content moderation (Flagged/Safe detection)
- **Streaming**: Secure HTTP Range Request streaming with seek support
- **Real-time**: Live status updates via Socket.io (upload & processing progress)
- **RBAC**: Admin/Editor/Viewer roles with multi-tenant isolation
- **Authentication**: JWT-based secure authentication

## Tech Stack
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Frontend**: React, Vite, TailwindCSS
- **Storage**: Local filesystem (uploads/)

## Prerequisites
- Node.js (v14+)
- MongoDB (Running locally on port 27017)

## Setup & Run

### 1. Backend
```bash
cd backend
npm install
# Create .env file if missing (Sample provided)
npm run start
# Server runs on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## User Roles
- **Admin**: Full access - upload, view, and manage all videos
- **Editor**: Upload and view videos within organization
- **Viewer**: Read-only access - view videos only

## 📚 Documentation

- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Detailed implementation overview and architecture
- [IMPLEMENTATION_VERIFICATION.md](./IMPLEMENTATION_VERIFICATION.md) - ✅ Complete verification of all 6 core functionalities
- [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) - Gemini API configuration and troubleshooting

## 🔧 Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb://localhost:27017/pulse-video
JWT_SECRET=your-secret-key-here
PORT=5000
CLIENT_URL=http://localhost:5173

# Gemini API (for video content analysis)
GEMINI_API_KEY=your_gemini_api_key_here
# Optional: Specify model name (default: tries multiple models)
GEMINI_MODEL_NAME=gemini-1.5-pro-latest
```

**Note**: If `GEMINI_API_KEY` is not set, the app will use simulated analysis. See [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) for troubleshooting.

## 🚀 Quick Start

1. **Start MongoDB** (if not running)
2. **Backend**: `cd backend && npm install && npm start`
3. **Frontend**: `cd frontend && npm install && npm run dev`
4. **Access**: http://localhost:5173

## 📡 API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/videos/upload` - Upload video (Admin/Editor)
- `GET /api/videos` - List videos (organization-scoped)
- `GET /api/videos/stream/:id` - Stream video (HTTP Range Request)
