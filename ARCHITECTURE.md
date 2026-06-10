# Architecture Overview

## System Design

The GTM Signal Intelligence Platform is built as a modular, serverless-ready system with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│              Deployed on Vercel (Free Tier)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                       │
│              Deployed on Render (Free Tier)                 │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ /signals     │ /stats       │ /digest/latest       │    │
│  │ /health      │ (3 endpoints)                        │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            Supabase (PostgreSQL + Auth)                     │
│              Free Tier (500MB storage)                      │
│  ┌──────────────────────────────────────────────────┐      │
│  │ raw_signals (unprocessed scraped data)           │      │
│  │ processed_signals (AI-extracted insights)        │      │
│  └──────────────────────────────────────────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │ Python SDK
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         Data Pipeline (Scheduled via GitHub Actions)        │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. Scrapers (6 sources)                          │      │
│  │ 2. LLM Extraction (Gemini 2.0 Flash)             │      │
│  │ 3. Impact Scoring (Rule-based)                   │      │
│  │ 4. Telegram Alerts (Optional)                    │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Frontend (React + Vite + Tailwind)

**Location:** `dashboard/`

**Components:**
- `App.jsx` - Main application container with state management
- `SignalFeed.jsx` - Displays list of signals with details
- `CompetitorFilter.jsx` - Filter buttons for competitor selection
- `ImpactBadge.jsx` - Visual indicator for signal impact level
- `StatsBar.jsx` - Dashboard statistics (totals, breakdowns, last update)

**Features:**
- Real-time data fetching from FastAPI backend
- Client-side filtering by competitor and impact
- Responsive design (mobile-first)
- Loading states and error handling

**Deployment:** Vercel (free tier)

### 2. Backend API (FastAPI)

**Location:** `api/main.py`

**Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check for monitoring |
| GET | `/signals` | Fetch processed signals with optional filters |
| GET | `/stats` | Get daily statistics (breakdown by competitor/impact) |
| GET | `/digest/latest` | Get formatted digest of top 5 signals |

**Features:**
- CORS enabled for frontend integration
- Query parameter validation
- Supabase integration for data persistence
- Comprehensive error handling
- Logging for debugging

**Deployment:** Render (free tier, Python 3)

### 3. Data Pipeline

**Location:** `pipeline/`, `scrapers/`, `alerts/`

**Workflow:**

1. **Scraping** (`scrapers/`)
   - `cursor.py` - Cursor changelog + Reddit
   - `windsurf.py` - Codeium blog + Reddit
   - `copilot.py` - GitHub blog + Hacker News
   - `codeium.py` - Codeium changelog + Reddit
   - `web_scraper.py` - Generic web scraping
   - `reddit_scraper.py` - PRAW-based Reddit scraping
   - `hn_scraper.py` - Hacker News Algolia API

2. **Extraction** (`pipeline/extractor.py`)
   - Uses Google Gemini 2.0 Flash API
   - Extracts: signal_type, summary, implication, tags, is_material
   - Hard cap: 50 API calls per run (free tier limit: 1500/day)
   - Robust JSON parsing with markdown fence stripping

3. **Scoring** (`pipeline/scorer.py`)
   - Rule-based impact scoring (no LLM cost)
   - Rules:
     - Pricing changes → HIGH
     - Feature launches with 50+ Reddit upvotes → HIGH
     - General feature launches → MEDIUM
     - Partnerships → MEDIUM
     - Negative sentiment → MEDIUM
     - Everything else → LOW

4. **Storage** (`pipeline/runner.py`)
   - Upsert to `raw_signals` (deduplication on URL)
   - Insert to `processed_signals`
   - Mark raw signals as processed

5. **Alerting** (`alerts/telegram_bot.py`)
   - Formats digest (max 5 signals, high priority first)
   - Sends via Telegram Bot API
   - Optional (skipped if bot token not configured)

**Scheduling:** GitHub Actions (cron: 0 8 * * * = 08:00 UTC daily)

### 4. Database (Supabase PostgreSQL)

**Schema:**

**raw_signals table:**
```sql
id (UUID, PK)
competitor (TEXT)
source (TEXT) — 'reddit', 'changelog', 'hackernews', 'blog', 'blog_tag'
url (TEXT, UNIQUE) — deduplication key
title (TEXT)
content (TEXT)
scraped_at (TIMESTAMPTZ, default now())
processed (BOOLEAN, default false)
```

**processed_signals table:**
```sql
id (UUID, PK)
raw_signal_id (UUID, FK → raw_signals.id)
competitor (TEXT)
signal_type (TEXT) — 'feature_launch', 'pricing_change', 'partnership', 'community_sentiment', 'other'
summary (TEXT)
implication (TEXT)
impact (TEXT) — 'high', 'medium', 'low'
tags (TEXT[])
created_at (TIMESTAMPTZ, default now())
```

**Indexes:**
- `raw_signals(processed)` - Fast filtering for unprocessed signals
- `processed_signals(impact, created_at DESC)` - Fast dashboard queries
- `processed_signals(competitor)` - Fast filtering by competitor

## Data Flow

### Daily Pipeline Execution

```
1. GitHub Actions triggers at 08:00 UTC
   ↓
2. Scrapers collect signals from 6 sources
   ↓
3. Raw signals stored in Supabase (upsert on URL)
   ↓
4. Unprocessed signals retrieved
   ↓
5. Gemini 2.0 Flash extracts insights (max 50 calls)
   ↓
6. Rule-based scorer assigns impact level
   ↓
7. Processed signals stored in Supabase
   ↓
8. Telegram digest sent (if configured)
   ↓
9. Raw signals marked as processed
```

### User Dashboard Interaction

```
1. User visits dashboard (Vercel)
   ↓
2. React app loads and fetches from FastAPI
   ↓
3. User selects filters (competitor, impact)
   ↓
4. Frontend queries FastAPI with parameters
   ↓
5. FastAPI queries Supabase
   ↓
6. Results displayed in real-time
```

## Technology Choices

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | React + Vite | Fast builds, HMR, modern tooling |
| Styling | Tailwind CSS | Utility-first, responsive, no CSS overhead |
| Backend | FastAPI | Fast, async, auto-docs, minimal setup |
| Database | Supabase | PostgreSQL + free tier, no ops |
| LLM | Gemini 2.0 Flash | Fast, cheap, free tier (1500 req/day) |
| Scraping | httpx + BeautifulSoup | Simple, no browser overhead |
| Reddit | PRAW | Official SDK, no scraping needed |
| Telegram | Telegram Bot API | Simple HTTP, no SDK needed |
| Deployment | Render + Vercel | Free tier, auto-deploy from GitHub |
| Scheduling | GitHub Actions | Free, built-in, no infrastructure |

## Cost Breakdown (Monthly)

| Service | Free Tier | Cost |
|---------|-----------|------|
| Supabase | 500MB storage, unlimited API calls | $0 |
| Render | 750 free hours/month | $0 |
| Vercel | Unlimited deployments, 100GB bandwidth | $0 |
| Gemini API | 1,500 requests/day | $0 (free tier) |
| GitHub Actions | 2,000 minutes/month | $0 |
| Telegram Bot API | Unlimited | $0 |
| **Total** | | **$0** |

## Scalability Considerations

### Current Limits

- **Gemini API:** 1,500 requests/day (hard-capped at 50/run)
- **Supabase:** 500MB storage (raw signals ~1KB each, processed ~2KB each)
- **Render:** 750 hours/month (sufficient for daily runs + API)
- **Vercel:** 100GB bandwidth/month (dashboard is static, minimal traffic)

### Upgrade Path

1. **More signals:** Increase scraper sources, add new competitors
2. **More frequent runs:** Change cron schedule (currently daily)
3. **More processing:** Upgrade Gemini to paid tier (scales linearly)
4. **More storage:** Upgrade Supabase to paid tier
5. **More API traffic:** Upgrade Render to paid tier

## Security Considerations

### Current Implementation

- Environment variables for all secrets (GitHub Actions, Render, local)
- CORS enabled for Vercel domain only (can be restricted)
- Supabase RLS not enabled (optional for free tier)
- No authentication required (public dashboard)

### Production Hardening

1. Enable Supabase RLS policies
2. Restrict CORS to specific domains
3. Add API rate limiting
4. Implement dashboard authentication
5. Encrypt sensitive data at rest
6. Add request signing for webhook validation

## Error Handling

### Scraper Failures

- Individual scraper failures don't stop the pipeline
- Errors logged and skipped
- Pipeline continues with remaining sources

### LLM Failures

- JSON parsing errors logged
- Signal skipped if extraction fails
- Pipeline continues with next signal

### Database Failures

- Upsert on duplicate URL prevents data loss
- Connection errors logged
- Pipeline fails gracefully with error message

### Telegram Failures

- Optional component (skipped if token not configured)
- Errors logged but don't stop pipeline

## Monitoring & Observability

### Logs

- **Local:** Console output with timestamps
- **Render:** Service logs in dashboard
- **GitHub Actions:** Workflow logs in repository

### Metrics

- Signals scraped per run
- Signals processed per run
- API response times
- Database query times
- Gemini API call count

### Alerts

- GitHub Actions workflow failures
- Render service downtime
- Supabase quota warnings

## Future Enhancements

1. **Multi-tenancy:** Support multiple organizations
2. **Custom sources:** User-configurable scrapers
3. **Advanced analytics:** Trend analysis, predictive scoring
4. **Email digests:** Alternative to Telegram
5. **Webhooks:** Integrate with Slack, Discord, etc.
6. **Mobile app:** Native iOS/Android app
7. **API authentication:** OAuth2 for third-party integrations
8. **Data export:** CSV, JSON exports
9. **Advanced filtering:** Date ranges, keyword search
10. **Competitor comparison:** Side-by-side analysis

## Development Workflow

### Local Setup

```bash
# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload

# Frontend
cd dashboard && npm install && npm run dev
```

### Testing Pipeline

```bash
# Manual run
python pipeline/runner.py

# With logging
python -c "import logging; logging.basicConfig(level=logging.DEBUG); from pipeline.runner import run_pipeline; run_pipeline()"
```

### Deployment

```bash
# Push to GitHub (auto-deploys to Render + Vercel)
git push origin main

# Manual Render redeploy
# (via Render dashboard)

# Manual Vercel redeploy
# (via Vercel dashboard)
```

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions](https://github.com/features/actions)
