# Deployment Guide

This guide details how to deploy the Pulse Video App using **Render** (Backend) and **Vercel** (Frontend).

## 1. Backend Deployment (Render)

1.  **Push Code to GitHub**: Ensure your project is pushed to a GitHub repository.
2.  **Create Web Service**:
    *   Go to [Render Dashboard](https://dashboard.render.com/).
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub repository.
3.  **Configure Service**:
    *   **Root Directory**: `backend` (Important!)
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    *   Add the following variables in the "Environment" tab:
        *   `MONGO_URI`: Your MongoDB Connection String.
        *   `JWT_SECRET`: A secure random string.
        *   `GEMINI_API_KEY`: Your Google Gemini API Key.
        *   `CLIENT_URL`: The URL of your Vercel frontend (e.g., `https://pulse-video-app.vercel.app`). *Add this after deploying frontend.*
5.  **Deploy**: Click **Create Web Service**. Wait for the specific URL (e.g., `https://pulse-backend.onrender.com`).

## 2. Frontend Deployment (Vercel)

1.  **Import Project**:
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **Add New...** -> **Project**.
    *   Import your GitHub repository.
2.  **Configure Project**:
    *   **Root Directory**: Click "Edit" and select `frontend`.
    *   **Framework Preset**: Vite (should be auto-detected).
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
3.  **Environment Variables**:
    *   Add the following variable:
        *   `VITE_API_URL`: The URL of your deployed Backend (e.g., `https://pulse-backend.onrender.com/api`).
4.  **Deploy**: Click **Deploy**.

## 3. Final Connection

1.  Once the Frontend is deployed, copy its URL (e.g., `https://pulse-video-app.vercel.app`).
2.  Go back to **Render** -> **Environment** and update `CLIENT_URL` with this value.
3.  **Redeploy** the backend (Manual Deploy -> Clear Cache & Deploy) to apply the CORS change.

Your app is now live!
