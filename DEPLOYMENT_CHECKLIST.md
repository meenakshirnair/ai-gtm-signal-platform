# Deployment Checklist

Follow this checklist to deploy the GTM Signal Intelligence Platform to production.

## Pre-Deployment

- [ ] Clone repository locally
- [ ] Create `.env` file with all required API keys
- [ ] Test pipeline locally: `python pipeline/runner.py`
- [ ] Test FastAPI backend: `uvicorn api.main:app --reload`
- [ ] Test React dashboard: `cd dashboard && npm run dev`

## Supabase Setup

- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy project URL and anon key
- [ ] Run SQL schema creation (see SETUP.md Part 2.2)
- [ ] Verify tables created: `raw_signals` and `processed_signals`
- [ ] Create indexes for performance
- [ ] Test connection: `python -c "from supabase import create_client; create_client('URL', 'KEY')"`

## Backend Deployment (Render)

- [ ] Create Render account at [render.com](https://render.com)
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Configure:
  - Name: `gtm-signal-platform-api`
  - Environment: Python 3
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
  - Plan: Free tier
- [ ] Add environment variables:
  - `GEMINI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `TELEGRAM_BOT_TOKEN` (optional)
  - `TELEGRAM_CHAT_ID` (optional)
  - `REDDIT_CLIENT_ID` (optional)
  - `REDDIT_CLIENT_SECRET` (optional)
  - `REDDIT_USER_AGENT` (optional)
- [ ] Deploy and wait for success
- [ ] Test health endpoint: `curl https://your-render-url/health`
- [ ] Test signals endpoint: `curl https://your-render-url/signals`
- [ ] Copy Render API URL for frontend configuration

## Frontend Deployment (Vercel)

- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Import GitHub repository
- [ ] Configure:
  - Framework: Vite
  - Root Directory: `dashboard`
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] Add environment variable:
  - `VITE_API_URL`: Your Render API URL
- [ ] Deploy and wait for success
- [ ] Visit dashboard URL and verify it loads
- [ ] Test filtering and data fetching
- [ ] Copy Vercel dashboard URL

## GitHub Actions Setup

- [ ] Go to repository Settings → Secrets and variables → Actions
- [ ] Add all required secrets:
  - `GEMINI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `TELEGRAM_BOT_TOKEN` (optional)
  - `TELEGRAM_CHAT_ID` (optional)
  - `REDDIT_CLIENT_ID` (optional)
  - `REDDIT_CLIENT_SECRET` (optional)
  - `REDDIT_USER_AGENT` (optional)
- [ ] Create `.github/workflows/daily_pipeline.yml` (see SETUP.md for content)
- [ ] Commit and push workflow file
- [ ] Go to Actions tab and verify workflow appears
- [ ] Manually trigger workflow: "Run workflow"
- [ ] Check logs for successful execution
- [ ] Verify signals in Supabase dashboard

## Telegram Bot Setup (Optional)

- [ ] Create bot with @BotFather on Telegram
- [ ] Copy bot token
- [ ] Get chat ID by sending message to bot and checking API
- [ ] Add to environment variables (all 3 places)
- [ ] Test by manually running pipeline: `python pipeline/runner.py`
- [ ] Verify digest message received in Telegram

## Reddit API Setup (Optional)

- [ ] Go to [reddit.com/prefs/apps](https://reddit.com/prefs/apps)
- [ ] Create new app (select "script")
- [ ] Copy Client ID and Client Secret
- [ ] Add to environment variables (all 3 places)
- [ ] Test Reddit scraper locally: `python -c "from scrapers.reddit_scraper import scrape_subreddit; print(scrape_subreddit('Test', 'python', 5))"`

## Google Gemini API Setup

- [ ] Go to [ai.google.dev](https://ai.google.dev)
- [ ] Create API key
- [ ] Add to environment variables
- [ ] Test extraction locally: `python -c "from pipeline.extractor import extract_insights; print(extract_insights('Test', 'test', 'Test content'))"`

## Post-Deployment Testing

- [ ] Dashboard loads at Vercel URL
- [ ] Filters work (competitor, impact)
- [ ] Stats display correctly
- [ ] API endpoints respond:
  - [ ] `GET /health` → 200 OK
  - [ ] `GET /signals` → 200 with signals
  - [ ] `GET /stats` → 200 with stats
  - [ ] `GET /digest/latest` → 200 with digest
- [ ] GitHub Actions workflow runs daily at 08:00 UTC
- [ ] Supabase tables populate with new signals
- [ ] Telegram digest received (if configured)

## Monitoring

- [ ] Set up Render alerts for service downtime
- [ ] Set up Vercel alerts for deployment failures
- [ ] Monitor Supabase usage (storage, API calls)
- [ ] Check GitHub Actions workflow logs regularly
- [ ] Monitor Gemini API quota (1,500 requests/day)

## Troubleshooting

### Dashboard shows "No signals available"

1. Check Render API URL in Vercel environment variables
2. Verify CORS is enabled in FastAPI
3. Check browser console for errors
4. Test API directly: `curl https://render-url/signals`

### Pipeline fails to run

1. Check GitHub Actions secrets are set
2. Verify Supabase credentials are correct
3. Check Gemini API key is valid
4. Review GitHub Actions logs for specific error

### Supabase connection fails

1. Verify URL and key are correct
2. Check network connectivity
3. Ensure tables are created
4. Test connection: `python -c "from supabase import create_client; create_client('URL', 'KEY').table('raw_signals').select('*').limit(1).execute()"`

### Telegram bot not sending messages

1. Verify bot token is correct
2. Verify chat ID is correct
3. Check that bot has permission to send messages
4. Test manually: `python -c "from alerts.telegram_bot import send_telegram_message; send_telegram_message('Test')"`

## Rollback Plan

If deployment fails:

1. **Render:** Revert to previous deployment in Render dashboard
2. **Vercel:** Revert to previous deployment in Vercel dashboard
3. **GitHub:** Revert commit: `git revert <commit-hash> && git push`
4. **Supabase:** Restore from backup (if available)

## Documentation

- [ ] Update README.md with live URLs
- [ ] Add dashboard URL to portfolio
- [ ] Add GitHub repository link to LinkedIn
- [ ] Document any custom configurations
- [ ] Create runbook for maintenance

## Success Criteria

✅ Dashboard is live and accessible
✅ API endpoints respond correctly
✅ Pipeline runs daily at 08:00 UTC
✅ Signals are collected and processed
✅ Telegram digest is sent (if configured)
✅ No errors in logs
✅ All environment variables are set
✅ Database is populated with signals

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Notes:** _______________
