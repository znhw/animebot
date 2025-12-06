# Vercel Deployment Guide

This project is configured to deploy to Vercel with both a React frontend and Node.js serverless API.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Your `GEMINI_API_KEY` environment variable

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel will auto-detect the configuration
5. Add environment variable:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key
6. Click "Deploy"

### Option 2: Deploy via CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Set environment variable:
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   (Enter your API key when prompted)

4. Deploy:
   ```bash
   vercel
   ```

5. For production deployment:
   ```bash
   vercel --prod
   ```

## Project Structure

- `tweet-a-nime/` - React frontend application
- `api/chat.js` - Vercel serverless function (replaces Express server)
- `vercel.json` - Vercel configuration

## Environment Variables

Required:
- `GEMINI_API_KEY` - Your Google Gemini API key

## Local Development

For local development, you can still use the Express server:

1. Start the backend:
   ```bash
   cd anime-chatbot-server
   npm install
   npm start
   ```

2. Set `REACT_APP_API_URL=http://localhost:3001/api/chat` in `tweet-a-nime/.env.local`

3. Start the frontend:
   ```bash
   cd tweet-a-nime
   npm install
   npm start
   ```

## Notes

- The frontend uses relative API paths (`/api/chat`) which work automatically on Vercel
- The serverless function handles CORS automatically
- Quotes are cached at the module level for better performance

