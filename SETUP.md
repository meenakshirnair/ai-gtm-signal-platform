# Setup and Deployment Guide

This guide walks you through setting up the GTM Signal Intelligence Platform locally and deploying it to production (Render + Vercel + Supabase).

## Prerequisites

- Python 3.11+
- Node.js 18+
- Git
- Accounts on: Supabase, Render, Vercel, Google Cloud (for Gemini API)

## Part 1: Local Development Setup

### 1.1 Clone the Repository

```bash
git clone https://github.com/meenakshirnair/ai-gtm-signal-platform.git
cd ai-gtm-signal-platform
```

### 1.2 Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 1.3 Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here

# Telegram (optional, for alerts)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Reddit (optional, for Reddit scraping)
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
REDDIT_USER_AGENT=GTM-Signal-Platform/1.0
```

### 1.4 Frontend Setup

```bash
cd dashboard
npm install
```

Create `dashboard/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

### 1.5 Run Locally

**Terminal 1 - Backend API:**

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**

```bash
cd dashboard
npm run dev
```

**Terminal 3 - Manual Pipeline Run (optional):**

```bash
python pipeline/runner.py
```

Visit `http://localhost:3000` to see the dashboard.

## Part 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Copy your project URL and anon key

### 2.2 Create Database Schema

In the Supabase SQL editor, run:

```sql
-- Create raw_signals table
CREATE TABLE raw_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  content TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Create processed_signals table
CREATE TABLE processed_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_signal_id UUID REFERENCES raw_signals(id),
  competitor TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  summary TEXT,
  implication TEXT,
  impact TEXT CHECK (impact IN ('high', 'medium', 'low')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_raw_signals_processed ON raw_signals(processed);
CREATE INDEX idx_raw_signals_competitor ON raw_signals(competitor);
CREATE INDEX idx_processed_signals_impact ON processed_signals(impact);
CREATE INDEX idx_processed_signals_competitor ON processed_signals(competitor);
CREATE INDEX idx_processed_signals_created_at ON processed_signals(created_at DESC);
```

## Part 3: Deploy Backend to Render

### 3.1 Connect GitHub Repository

1. Go to [render.com](https://render.com) and sign up
2. Create a new Web Service
3. Connect your GitHub repository
4. Select the `ai-gtm-signal-platform` repository

### 3.2 Configure Render Service

- **Name:** `gtm-signal-platform-api`
- **Environment:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
- **Plan:** Free tier

### 3.3 Add Environment Variables

In Render dashboard, add all variables from `.env`.

## Part 4: Deploy Frontend to Vercel

### 4.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project"
3. Import your GitHub repository

### 4.2 Configure Vercel Project

- **Framework Preset:** Vite
- **Root Directory:** `dashboard`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 4.3 Add Environment Variables

In Vercel project settings, add your backend API URL.

## Part 5: Configure GitHub Actions

The workflow at `.github/workflows/daily_pipeline.yml` will run automatically at 08:00 UTC daily. Add all required secrets to GitHub Actions settings.

## Support

For issues or questions, open a GitHub issue or check the README.md.
