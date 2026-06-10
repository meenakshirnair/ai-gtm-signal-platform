# Technical Architecture

## System Overview

The AI-Powered GTM Signal Intelligence Platform is a full-stack application designed to monitor competitors and market trends, extract actionable insights using LLMs, and deliver alerts to GTM teams.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  React + Vite + Tailwind CSS (Dashboard, Real-time Updates)     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────────┐
│                      API Layer                                   │
│  Flask/FastAPI (REST Endpoints, CORS, Authentication)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌─────▼──────┐  ┌─────▼──────────┐
│  Scraping    │  │ LLM        │  │  Database      │
│  Engine      │  │ Processing │  │  Service       │
│              │  │            │  │                │
│ • Apify      │  │ • Gemini   │  │ • SQLAlchemy   │
│ • Playwright │  │ • Prompts  │  │ • PostgreSQL   │
│ • BeautifulSoup│ │ • Analysis │  │ • SQLite       │
└──────┬───────┘  └─────┬──────┘  └─────┬──────────┘
       │                │               │
       └────────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐  ┌─────▼──────┐  ┌────▼────────┐
│  Data        │  │ Alert      │  │ Telegram    │
│  Storage     │  │ Generator  │  │ Bot         │
│              │  │            │  │             │
│ Raw Data     │  │ Priority   │  │ Commands    │
│ Insights     │  │ Formatting │  │ Alerts      │
│ Alerts       │  │ Filtering  │  │ Monitoring  │
└──────────────┘  └────────────┘  └─────────────┘
```

## Core Components

### 1. Data Ingestion Layer

**Scrapers** (`src/scrapers/`)

- **CompetitorScraper**: Collects data from competitor websites
  - Changelog parsing
  - Blog post extraction
  - Website metadata collection
  - Supports multiple data sources per competitor

- **MarketTrendScraper**: Monitors industry signals
  - Reddit subreddit monitoring
  - Hacker News trending posts
  - Dev.to community posts
  - News API integration

**Key Features**:
- Error handling and retry logic
- Rate limiting awareness
- Structured data extraction
- Timestamp tracking

### 2. LLM Processing Layer

**InsightExtractor** (`src/llm_processing/insight_extractor.py`)

Uses Google Gemini API to process unstructured text:

- **Feature Extraction**: Identifies new features, pricing changes, strategic implications
- **Summarization**: Condenses long content into actionable summaries
- **Sentiment Analysis**: Determines tone and confidence scores
- **Theme Extraction**: Identifies common patterns across multiple sources
- **Strategic Alerts**: Generates business-focused alert messages

**Prompt Engineering**:
- JSON-structured responses for easy parsing
- Context-aware analysis
- Business-focused language
- Configurable detail levels

**AlertGenerator** (`src/llm_processing/alert_generator.py`)

Creates and categorizes alerts:

- **Priority Determination**: Based on keywords and impact levels
- **Alert Types**: Competitor updates, market trends, opportunities
- **Formatting**: Telegram-optimized, dashboard-ready formats
- **Filtering**: By priority level and relevance

### 3. Data Storage Layer

**Database Models** (`src/backend/models.py`)

- **Competitor**: Monitored companies with URLs
- **CompetitorUpdate**: Scraped updates with processing status
- **MarketTrend**: Industry signals and discussions
- **Alert**: Generated alerts with delivery status
- **ScrapingLog**: Audit trail of data collection activities

**Supported Databases**:
- PostgreSQL (production)
- SQLite (development)
- Extensible to other SQL databases via SQLAlchemy

**DatabaseService** (`src/backend/database.py`)

CRUD operations and business logic:
- Competitor management
- Update tracking and processing
- Alert generation and delivery
- Statistics and reporting

### 4. Backend API Layer

**Flask Application** (`src/backend/app.py`)

RESTful endpoints:

```
GET  /health                          - Health check
GET  /api/competitors                 - List competitors
POST /api/competitors                 - Add competitor
GET  /api/competitors/<id>/updates    - Get competitor updates
POST /api/scrape/competitors/<id>     - Trigger competitor scrape
POST /api/scrape/market-trends        - Trigger market trend scrape
POST /api/process/competitor-updates  - Process with LLM
GET  /api/alerts                      - Get recent alerts
GET  /api/statistics                  - Get platform statistics
```

**Features**:
- CORS enabled for frontend
- Error handling and logging
- Request validation
- Response formatting

### 5. Frontend Layer

**React Dashboard** (`src/frontend/`)

**Components**:
- **App**: Main application shell
- **Sidebar**: Navigation menu
- **Dashboard**: Statistics and alerts display

**Features**:
- Real-time data updates
- Priority-based alert visualization
- Quick action buttons
- Responsive design
- Dark theme optimized for long viewing

**API Service** (`src/frontend/src/services/api.js`):
- Centralized API communication
- Error handling
- Request/response formatting

### 6. Alerting Layer

**Telegram Bot** (`src/backend/telegram_bot.py`)

Interactive bot with commands:
- `/status` - Platform status
- `/latest_alerts` - Recent alerts
- `/competitors` - Monitored companies
- `/statistics` - Platform metrics

**Features**:
- Real-time alert delivery
- Interactive commands
- Formatted messages with emojis
- Error handling

## Data Flow

### Scraping Pipeline

```
1. Trigger Scrape
   └─> Scraper fetches data from sources
       └─> Parse HTML/JSON
           └─> Extract structured data
               └─> Store in database (raw_content)
                   └─> Mark as unprocessed
```

### Processing Pipeline

```
1. Get Unprocessed Updates
   └─> Send to Gemini API
       └─> Extract features, sentiment, implications
           └─> Generate summary
               └─> Store processed insights
                   └─> Create alerts
                       └─> Send to Telegram/Dashboard
```

### Alert Delivery

```
1. Generate Alert
   └─> Determine priority
       └─> Format for channel
           └─> Send to Telegram
               └─> Store in database
                   └─> Display on dashboard
                       └─> Mark as sent
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI framework |
| Frontend Build | Vite | Fast development server |
| Styling | Tailwind CSS | Utility-first CSS |
| Backend | Flask | Web framework |
| Database ORM | SQLAlchemy | Database abstraction |
| Database | PostgreSQL/SQLite | Data persistence |
| LLM | Google Gemini API | AI processing |
| Web Scraping | BeautifulSoup, Playwright | Data collection |
| Task Queue | APScheduler | Scheduled jobs |
| Messaging | Telegram Bot API | Alert delivery |
| Deployment | Azure | Cloud hosting |

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: Can run multiple instances behind load balancer
- **Database Connection Pooling**: Manage concurrent connections
- **Async Processing**: Use Celery for long-running tasks

### Vertical Scaling

- **Caching Layer**: Redis for frequently accessed data
- **Database Indexing**: Optimize query performance
- **Batch Processing**: Process updates in larger batches

### Performance Optimization

- **API Response Caching**: Cache statistics for 30 seconds
- **Database Indexes**: On competitor_id, created_at
- **Pagination**: Limit alert/update queries
- **Lazy Loading**: Load dashboard data progressively

## Security Considerations

### API Security

- CORS configuration for frontend domain
- Input validation on all endpoints
- Rate limiting on scraping endpoints
- Error messages don't expose system details

### Data Security

- Environment variables for sensitive keys
- Database connection encryption
- Secure password hashing (if user auth added)
- HTTPS in production

### API Key Management

- Gemini API key in environment variables
- Telegram bot token in environment variables
- No hardcoded secrets in code
- Key rotation support

## Extensibility

### Adding New Data Sources

1. Create new scraper in `src/scrapers/`
2. Implement data extraction logic
3. Add API endpoint in `src/backend/app.py`
4. Update database models if needed

### Adding New Alert Channels

1. Implement channel in `src/backend/`
2. Add formatting method in AlertGenerator
3. Integrate with alert delivery pipeline
4. Add configuration in .env

### Adding New LLM Providers

1. Implement provider in `src/llm_processing/`
2. Maintain same interface as InsightExtractor
3. Update configuration in app.py
4. Test with existing prompts

## Monitoring and Observability

### Logging

- Application logs in `logs/` directory
- Structured logging for debugging
- Error tracking and alerting

### Metrics

- Scraping success/failure rates
- Processing latency
- Alert generation frequency
- API response times

### Health Checks

- `/health` endpoint for uptime monitoring
- Database connectivity checks
- API availability monitoring

## Future Enhancements

1. **Real-time Updates**: WebSocket for live alerts
2. **Advanced Analytics**: Trend analysis and predictions
3. **User Management**: Multi-user support with roles
4. **Custom Workflows**: User-defined alert rules
5. **Mobile App**: Native iOS/Android applications
6. **CRM Integration**: Salesforce, HubSpot sync
7. **Advanced NLP**: Custom models for domain-specific analysis
8. **Competitor Benchmarking**: Comparative analysis
9. **Revenue Impact Modeling**: Quantify competitive threats
10. **Automated Response**: Trigger actions based on alerts

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Azure Static Web Apps           │
│         (Frontend - React)              │
└────────────────────┬────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────▼────────────────────┐
│      Azure App Service                  │
│      (Backend - Flask)                  │
│      • Scaling: Auto-scale              │
│      • Monitoring: Application Insights │
└────────────────────┬────────────────────┘
                     │
                     │ Connection String
                     │
┌────────────────────▼────────────────────┐
│      Azure PostgreSQL Database          │
│      • Backup: Daily                    │
│      • Replication: Geo-redundant       │
└─────────────────────────────────────────┘
```

## Performance Benchmarks

- **API Response Time**: < 200ms (p95)
- **Scraping Latency**: 5-30 seconds per source
- **LLM Processing**: 2-5 seconds per update
- **Alert Delivery**: < 1 second to Telegram
- **Dashboard Load**: < 2 seconds

## Conclusion

The architecture is designed for scalability, maintainability, and extensibility. It separates concerns across layers, uses proven technologies, and provides clear integration points for future enhancements.
