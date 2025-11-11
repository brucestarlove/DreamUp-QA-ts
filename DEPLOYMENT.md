# Deployment Guide

This project has two parts:
1. **Frontend Dashboard** (Next.js) - Deployed to Vercel
2. **CLI Service** (Bun API Server) - Deployed to Railway

## Quick Start ✅

1. **Deploy CLI Service to Railway:**
   ```bash
   railway up --service humorous-consideration
   ```

2. **Configure Environment Variables in Railway Dashboard:**
   - Go to: https://railway.app → Your Project → Variables
   - Add:
     - `PORT=3001`
     - `OPENAI_API_KEY=your_key`
     - `RESULTS_DIR=/app/results`

3. **Deploy Frontend to Vercel:**
   - Push your code to GitHub
   - Import project in Vercel Dashboard
   - Add environment variable:
     - `CLI_API_URL=https://humorous-consideration-production.up.railway.app`
   - Deploy!

That's it! Railway uses Nixpacks to auto-detect Bun and install Playwright browsers.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Vercel    │────────▶│  CLI Service │────────▶│   Browser   │
│  (Frontend)  │  HTTP   │ (Railway/etc)│  Stagehand│  (Tests)   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                         │
      │                         │
      └───────── Results ───────┘
              (HTTP GET)
```

## Detailed Steps

### Step 1: Deploy CLI Service to Railway

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Deploy:**
   ```bash
   railway init
   railway up --service humorous-consideration
   ```

3. **Set Environment Variables in Dashboard:**
   - Go to https://railway.app
   - Select your project
   - Go to Variables tab
   - Add:
     - `PORT=3001`
     - `OPENAI_API_KEY=your_key`
     - `RESULTS_DIR=/app/results`

4. **Get your Railway URL:**
   ```bash
   railway domain
   ```
   - Copy the URL (e.g., `https://humorous-consideration-production.up.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Push to GitHub** (if not already)

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to: Settings → Environment Variables
   - Add: `CLI_API_URL` = `https://humorous-consideration-production.up.railway.app`

4. **Redeploy** to apply the environment variable

## How It Works

1. **User triggers test** in Vercel dashboard
2. **Vercel calls** `CLI_API_URL` (your Railway service)
3. **Railway runs test** using Stagehand + Playwright
4. **Results saved** to Railway's filesystem
5. **Vercel fetches results** via `/results/{sessionId}/output.json` endpoint

## Testing Locally

1. **Start CLI Service:**
   ```bash
   bun run src/api-server.ts
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Set local env:**
   ```bash
   export CLI_API_URL=http://localhost:3001
   ```

## Troubleshooting

### Vercel can't reach CLI service
- Check `CLI_API_URL` is set correctly
- Ensure CLI service has CORS enabled (already done)
- Check Railway/Render logs for errors

### Results not showing
- CLI service writes results to its filesystem
- Vercel fetches via `/results/{sessionId}/output.json` endpoint
- Check CLI service logs to see if tests are running

### Browser automation fails
- Check Railway build logs - Playwright browsers should be installed via `nixpacks.toml`
- Verify Stagehand configuration
- Review Railway service logs: `railway logs`

## Environment Variables

### Railway (CLI Service)
- `PORT` - Server port (default: 3001, auto-set by Railway)
- `RESULTS_DIR` - Where to store results (default: `/app/results`)
- `OPENAI_API_KEY` - For LLM evaluation (optional)
- `GOOGLE_API_KEY` - For Gemini models (optional)

### Vercel (Frontend)
- `CLI_API_URL` - URL of your Railway service (e.g., `https://humorous-consideration-production.up.railway.app`)

## Key Files

### Railway Deployment
- `railway.json` - Tells Railway to use Nixpacks builder
- `nixpacks.toml` - Configures Bun + Playwright installation
- `src/api-server.ts` - CLI service HTTP API

### Vercel Deployment
- `.vercelignore` - Excludes CLI files from Vercel build
- `app/` - Next.js frontend application

