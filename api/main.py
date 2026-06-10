from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="GTM Signal Intelligence Platform API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for free tier
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

@app.get("/signals")
async def get_signals(
    competitor: str = Query(None, description="Filter by competitor"),
    impact: str = Query(None, description="Filter by impact level (high, medium, low)"),
    limit: int = Query(20, description="Number of signals to return")
):
    """
    Get processed signals with optional filters.
    
    Query params:
    - competitor: Filter by competitor name (optional)
    - impact: Filter by impact level (optional)
    - limit: Number of results (default 20)
    """
    try:
        query = supabase.table("processed_signals").select("*, raw_signals(url)").order("created_at", desc=True)
        
        if competitor:
            query = query.eq("competitor", competitor)
        if impact:
            query = query.eq("impact", impact)
        
        response = query.limit(limit).execute()
        signals = response.data if response.data else []
        
        logger.info(f"Retrieved {len(signals)} signals (competitor={competitor}, impact={impact})")
        return {"signals": signals, "count": len(signals)}
    except Exception as e:
        logger.error(f"Error retrieving signals: {e}")
        return {"error": str(e), "signals": [], "count": 0}

@app.get("/stats")
async def get_stats():
    """
    Get platform statistics.
    
    Returns:
    - total_signals_today: Number of signals processed today
    - by_competitor: Breakdown by competitor
    - by_impact: Breakdown by impact level
    """
    try:
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time()).isoformat()
        
        # Get all signals from today
        response = supabase.table("processed_signals").select("*").gte("created_at", today_start).execute()
        signals = response.data if response.data else []
        
        # Breakdown by competitor
        by_competitor = {}
        for signal in signals:
            competitor = signal.get("competitor")
            by_competitor[competitor] = by_competitor.get(competitor, 0) + 1
        
        # Breakdown by impact
        by_impact = {"high": 0, "medium": 0, "low": 0}
        for signal in signals:
            impact = signal.get("impact", "low")
            by_impact[impact] = by_impact.get(impact, 0) + 1
        
        logger.info(f"Retrieved stats: {len(signals)} signals today")
        return {
            "total_signals_today": len(signals),
            "by_competitor": by_competitor,
            "by_impact": by_impact
        }
    except Exception as e:
        logger.error(f"Error retrieving stats: {e}")
        return {"error": str(e), "total_signals_today": 0, "by_competitor": {}, "by_impact": {}}

@app.get("/digest/latest")
async def get_latest_digest():
    """
    Get the latest 5 high+medium priority signals formatted as a digest.
    
    Returns:
    - digest: Plain text digest
    - signals: List of signals included
    """
    try:
        # Get high and medium priority signals
        response = supabase.table("processed_signals").select("*").in_("impact", ["high", "medium"]).order("created_at", desc=True).limit(5).execute()
        signals = response.data if response.data else []
        
        # Format digest
        if not signals:
            digest_text = "No high or medium priority signals available."
        else:
            date_str = datetime.now().strftime("%Y-%m-%d")
            digest_text = f"AI Coding Tools Digest — {date_str}\n\n"
            
            high_priority = [s for s in signals if s.get("impact") == "high"]
            medium_priority = [s for s in signals if s.get("impact") == "medium"]
            
            if high_priority:
                digest_text += "HIGH PRIORITY\n"
                for signal in high_priority:
                    digest_text += f"{signal.get('competitor')} — {signal.get('signal_type')}: {signal.get('summary')}. Why it matters: {signal.get('implication')}\n\n"
            
            if medium_priority:
                digest_text += "MEDIUM PRIORITY\n"
                for signal in medium_priority:
                    digest_text += f"{signal.get('competitor')} — {signal.get('signal_type')}: {signal.get('summary')}\n\n"
        
        logger.info(f"Retrieved latest digest with {len(signals)} signals")
        return {"digest": digest_text, "signals": signals}
    except Exception as e:
        logger.error(f"Error retrieving digest: {e}")
        return {"error": str(e), "digest": "", "signals": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
