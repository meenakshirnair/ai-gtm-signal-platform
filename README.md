# AI-Powered GTM Signal Intelligence Platform

A lean, free-tier platform that monitors AI coding tool competitors, extracts structured insights using an LLM, scores them by impact, and delivers a daily digest via Telegram + a public web dashboard.

## 🎯 Problem Statement

Staying ahead in the fast-evolving AI coding tool market requires constant monitoring of competitor moves and market sentiment. Manual tracking is inefficient and often misses critical signals.

## ✨ Solution

This platform automates the intelligence gathering process:

1.  **Automated Data Collection**: Continuously scrapes competitor changelogs, blogs, Reddit, and Hacker News.
2.  **AI-Powered Analysis**: Uses Google Gemini 2.0 Flash to extract features, sentiment, and strategic implications.
3.  **Impact Scoring**: Ranks signals by business impact (High, Medium, Low).
4.  **Daily Digest & Dashboard**: Delivers insights via Telegram and a public web dashboard.

## 🚀 Key Features

### Data Collection
-   Monitors 4 AI coding tool competitors: Cursor, Windsurf, Codeium, GitHub Copilot.
-   Collects signals from changelogs, blogs, Reddit (using PRAW), and Hacker News (using Algolia API).

### AI-Powered Insights
-   Extracts `signal_type`, `summary`, `implication`, `tags`, and `is_material` using Gemini 2.0 Flash.
-   Robust error handling for LLM calls.

### Impact Scoring
-   Rule-based scoring for `high`, `medium`, and `low` impact signals.

### Alerting & Dashboard
-   Daily digest delivered via Telegram.
-   Public web dashboard displaying processed signals with filters and statistics.

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend API | FastAPI |
| Database | Supabase (PostgreSQL) |
| Database Client | `supabase-py` |
| LLM | Google Gemini 2.0 Flash |
| Scraping | `httpx`, `BeautifulSoup`, `PRAW` (for Reddit), `hn.algolia.com` API |
| Frontend | React, Vite, Tailwind CSS |
| Scheduler | GitHub Actions cron workflow |
| Alerting | Telegram Bot API |
| Deployment (Backend) | Render (free tier) |
| Deployment (Frontend) | Vercel (free tier) |

## 📋 Prerequisites

-   Python 3.11+
-   Node.js 18+
-   Supabase project (PostgreSQL database)
-   Google Gemini API key
-   Telegram Bot token and Chat ID (optional, for alerts)

## 🚀 Quick Start (Local Development)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/meenakshirnair/ai-gtm-signal-platform.git
    cd ai-gtm-signal-platform
    ```

2.  **Backend Setup**
    ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    GEMINI_API_KEY=your_gemini_api_key
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_KEY=your_supabase_anon_key
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token
    TELEGRAM_CHAT_ID=your_telegram_chat_id
    ```

4.  **Run the Pipeline (Manual)**
    ```bash
    python pipeline/runner.py
    ```

5.  **Run FastAPI Backend**
    ```bash
    uvicorn api.main:app --host 0.0.0.0 --port 8000
    ```

6.  **Frontend Setup**
    ```bash
    cd dashboard
    npm install
    npm run dev
    ```

## 📊 Supabase Schema

### `raw_signals` table
-   `id` (uuid, primary key, default `gen_random_uuid()`)
-   `competitor` (text)
-   `source` (text) — e.g., `reddit`, `changelog`, `hackernews`
-   `url` (text, unique) — used for deduplication
-   `title` (text)
-   `content` (text)
-   `scraped_at` (timestamptz, default `now()`)
-   `processed` (boolean, default `false`)

### `processed_signals` table
-   `id` (uuid, primary key)
-   `raw_signal_id` (uuid, foreign key → `raw_signals.id`)
-   `competitor` (text)
-   `signal_type` (text) — `feature_launch`, `pricing_change`, `partnership`, `community_sentiment`, `other`
-   `summary` (text)
-   `implication` (text)
-   `impact` (text) — `high`, `medium`, `low`
-   `tags` (text[])
-   `created_at` (timestamptz, default `now()`)

## ⚙️ Deployment

-   **Backend (FastAPI)**: Deploy to [Render](https://render.com) (free tier)
-   **Frontend (React)**: Deploy to [Vercel](https://vercel.com) (free tier)
-   **Database**: [Supabase](https://supabase.com) (free tier)
-   **Scheduler**: GitHub Actions cron workflow

See [SETUP.md](SETUP.md) (coming soon) for detailed deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

-   Google Gemini API
-   Supabase
-   Render
-   Vercel
-   Telegram Bot API
-   PRAW
-   Hacker News Algolia API

---

**Live Dashboard:** [Your Vercel URL]
**Telegram Bot:** [Your Telegram Bot Link]

**Built with ❤️ for GTM teams who want to stay ahead of the competition.**
