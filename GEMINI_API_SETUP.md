# Gemini API Setup Guide

## Issue: Model Not Found Error

If you're seeing errors like:
```
[404 Not Found] models/gemini-1.5-pro is not found for API version v1beta
```

This guide will help you resolve it.

## Solution

### 1. Check Your API Key

Ensure your `GEMINI_API_KEY` in `.env` is valid and has access to Gemini models:
- Get your API key from: https://aistudio.google.com/app/apikey
- Make sure the API key is enabled for Gemini API

### 2. Use the Correct Model Name

The code now automatically tries multiple model names:
- `gemini-1.5-pro-latest` (recommended)
- `gemini-1.5-flash-latest` (faster)
- `gemini-1.5-pro` (fallback)
- `gemini-pro` (legacy)

### 3. Configure Model Name (Optional)

You can specify a model name in your `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL_NAME=gemini-1.5-pro-latest
```

### 4. List Available Models

Run the script to check which models are available for your API key:

```bash
cd backend
node scripts/list_models_api.js
```

This will:
- Query the Gemini API to list all available models
- Show which models support `generateContent`
- Recommend models for video analysis
- Provide the exact model name to use in `.env`

### 5. Common Issues

#### Issue: All models return 404
**Solution**: 
- Verify your API key is correct and active
- Check if your API key has access to Gemini 1.5 models
- Some API keys may only have access to older models
- **Important**: Make sure your API key is created from https://aistudio.google.com/app/apikey
- The API key must have "Generative Language API" enabled in Google Cloud Console
- Run `node scripts/list_models_api.js` to see exactly which models your key can access

#### Issue: "API key not configured"
**Solution**: 
- Create a `.env` file in the `backend/` directory
- Add: `GEMINI_API_KEY=your_actual_api_key`

#### Issue: Video analysis not working
**Solution**:
- Ensure you're using a model that supports video analysis (Gemini 1.5 Pro/Flash)
- Check file size limits (Gemini has file size restrictions)
- Verify the video file is in a supported format

## Environment Variables

Add these to your `backend/.env` file:

```env
# Required
GEMINI_API_KEY=your_api_key_here

# Optional - specify model name
GEMINI_MODEL_NAME=gemini-1.5-pro-latest
```

## Testing

After setting up, test the API connection:

```bash
cd backend
node scripts/list_available_models.js
```

If models are working, you should see:
```
✅ gemini-1.5-pro-latest - WORKING
```

## Fallback Behavior

If all Gemini models fail, the application will automatically:
1. Log the error
2. Fall back to simulated analysis
3. Continue processing the video

This ensures the application continues to work even if the API is unavailable.

## Support

For more information:
- Gemini API Documentation: https://ai.google.dev/docs
- Model Availability: https://ai.google.dev/models/gemini
- API Status: https://status.cloud.google.com/

