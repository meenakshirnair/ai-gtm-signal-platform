# Setup and Deployment Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+ (or SQLite for development)
- Google Gemini API key
- Telegram Bot token (optional, for alerts)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/meenakshirnair/ai-gtm-signal-platform.git
cd ai-gtm-signal-platform
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/gtm_signal_db
# Or for SQLite (development):
DATABASE_URL=sqlite:///gtm_signal.db

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Telegram Bot Configuration (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your_secret_key_here
```

#### Initialize Database

```bash
python -c "from src.backend.models import init_db; init_db('sqlite:///gtm_signal.db')"
```

#### Run Backend Server

```bash
python -m src.backend.app
```

The backend will be available at `http://localhost:5000`

### 3. Frontend Setup

#### Navigate to Frontend Directory

```bash
cd src/frontend
```

#### Install Dependencies

```bash
npm install
# or
pnpm install
```

#### Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` if needed (default points to localhost:5000)

#### Run Development Server

```bash
npm run dev
# or
pnpm dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Competitors

- `GET /api/competitors` - Get all competitors
- `POST /api/competitors` - Add a new competitor
- `GET /api/competitors/<id>/updates` - Get updates for a competitor

### Scraping

- `POST /api/scrape/competitors/<id>` - Trigger scraping for a competitor
- `POST /api/scrape/market-trends` - Trigger market trend scraping

### Processing

- `POST /api/process/competitor-updates` - Process unprocessed updates with LLM

### Alerts

- `GET /api/alerts` - Get recent alerts
- `GET /api/statistics` - Get platform statistics

### Health

- `GET /health` - Health check endpoint

## Telegram Bot

### Setup Telegram Bot

1. Create a bot with BotFather on Telegram
2. Get your bot token
3. Get your chat ID (send a message to your bot and check updates)
4. Add to `.env`:

```env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Run Telegram Bot

```bash
python -m src.backend.telegram_bot
```

### Available Commands

- `/start` - Start the bot
- `/help` - Show help
- `/status` - Get platform status
- `/latest_alerts` - Get latest alerts
- `/competitors` - List competitors
- `/statistics` - Get statistics

## Deployment

### Docker Deployment

Create `Dockerfile` in project root:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "-m", "src.backend.app"]
```

Build and run:

```bash
docker build -t gtm-signal-platform .
docker run -p 5000:5000 --env-file .env gtm-signal-platform
```

### Azure Deployment

#### Deploy Backend to Azure App Service

```bash
# Install Azure CLI
# az login

# Create resource group
az group create --name gtm-signal-rg --location eastus

# Create App Service plan
az appservice plan create --name gtm-signal-plan --resource-group gtm-signal-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group gtm-signal-rg --plan gtm-signal-plan --name gtm-signal-api --runtime "PYTHON|3.11"

# Deploy code
az webapp deployment source config-zip --resource-group gtm-signal-rg --name gtm-signal-api --src deployment.zip
```

#### Deploy Frontend to Azure Static Web Apps

```bash
# Build frontend
cd src/frontend
npm run build

# Deploy to Static Web Apps
az staticwebapp create --name gtm-signal-dashboard --resource-group gtm-signal-rg --source . --location eastus
```

### Environment Variables for Production

Ensure these are set in your deployment environment:

```env
DATABASE_URL=postgresql://user:password@host:5432/db
GEMINI_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
FLASK_ENV=production
SECRET_KEY=your_secure_key
```

## Database Migrations

For production PostgreSQL setup:

```bash
# Create database
createdb gtm_signal_db

# Run initialization
python -c "from src.backend.models import init_db; init_db('postgresql://user:password@localhost:5432/gtm_signal_db')"
```

## Monitoring and Logging

### View Logs

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs (in browser console)
```

### Health Check

```bash
curl http://localhost:5000/health
```

## Troubleshooting

### Backend Connection Issues

- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify Gemini API key is valid

### Frontend API Errors

- Check backend is running on port 5000
- Verify CORS is enabled in Flask
- Check browser console for detailed errors

### Telegram Bot Not Sending Alerts

- Verify TELEGRAM_BOT_TOKEN is correct
- Ensure TELEGRAM_CHAT_ID is set
- Check bot has permission to send messages

## Performance Optimization

### Caching

Implement Redis caching for frequently accessed data:

```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis'})
```

### Database Indexing

Add indexes for common queries:

```sql
CREATE INDEX idx_competitor_updates_competitor_id ON competitor_updates(competitor_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
```

### Batch Processing

Process updates in batches to improve efficiency:

```python
updates = db_service.get_unprocessed_competitor_updates(limit=50)
processed = insight_extractor.batch_process_updates(updates)
```

## Next Steps

1. Add more data sources (Twitter, Product Hunt, etc.)
2. Implement advanced filtering and search
3. Add user authentication and multi-tenancy
4. Create scheduled scraping jobs
5. Implement real-time WebSocket updates
6. Add export functionality (PDF, CSV)
7. Build mobile app
8. Integrate with CRM systems

## Support

For issues or questions, please create an issue on GitHub or contact the development team.
