import logging
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from scrapers.cursor import scrape_cursor_signals
from scrapers.windsurf import scrape_windsurf_signals
from scrapers.copilot import scrape_copilot_signals
from scrapers.codeium import scrape_codeium_signals
from pipeline.extractor import batch_extract
from pipeline.scorer import batch_score
from alerts.telegram_bot import send_telegram_digest

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_all_signals():
    """
    Scrape signals from all competitors.
    
    Returns:
        List of raw signals
    """
    logger.info("Starting scraping pipeline...")
    all_signals = []
    
    try:
        logger.info("Scraping Cursor signals...")
        all_signals.extend(scrape_cursor_signals())
    except Exception as e:
        logger.error(f"Error scraping Cursor: {e}")
    
    try:
        logger.info("Scraping Windsurf signals...")
        all_signals.extend(scrape_windsurf_signals())
    except Exception as e:
        logger.error(f"Error scraping Windsurf: {e}")
    
    try:
        logger.info("Scraping GitHub Copilot signals...")
        all_signals.extend(scrape_copilot_signals())
    except Exception as e:
        logger.error(f"Error scraping GitHub Copilot: {e}")
    
    try:
        logger.info("Scraping Codeium signals...")
        all_signals.extend(scrape_codeium_signals())
    except Exception as e:
        logger.error(f"Error scraping Codeium: {e}")
    
    logger.info(f"Scraped {len(all_signals)} total signals")
    return all_signals

def store_raw_signals(signals):
    """
    Store raw signals in Supabase, using upsert to prevent duplicates.
    
    Args:
        signals: List of raw signal dicts
    
    Returns:
        List of stored signal IDs
    """
    logger.info(f"Storing {len(signals)} raw signals in Supabase...")
    stored_ids = []
    
    for signal in signals:
        try:
            # Upsert on url field to prevent duplicates
            response = supabase.table("raw_signals").upsert({
                "competitor": signal.get("competitor"),
                "source": signal.get("source"),
                "url": signal.get("url"),
                "title": signal.get("title"),
                "content": signal.get("content"),
                "processed": False
            }, on_conflict="url").execute()
            
            if response.data:
                stored_ids.append(response.data[0]["id"])
        except Exception as e:
            logger.error(f"Error storing signal {signal.get('url')}: {e}")
    
    logger.info(f"Stored {len(stored_ids)} raw signals")
    return stored_ids

def get_unprocessed_signals():
    """
    Get unprocessed signals from Supabase.
    
    Returns:
        List of unprocessed signal dicts
    """
    try:
        response = supabase.table("raw_signals").select("*").eq("processed", False).execute()
        signals = response.data if response.data else []
        logger.info(f"Retrieved {len(signals)} unprocessed signals")
        return signals
    except Exception as e:
        logger.error(f"Error retrieving unprocessed signals: {e}")
        return []

def process_signals(raw_signals):
    """
    Process raw signals through extraction and scoring.
    
    Args:
        raw_signals: List of raw signal dicts
    
    Returns:
        List of processed signal dicts
    """
    logger.info(f"Processing {len(raw_signals)} signals...")
    
    # Extract insights using LLM
    extracted = batch_extract(raw_signals, max_calls=50)
    logger.info(f"Extracted insights from {len(extracted)} signals")
    
    # Score by impact
    scored = batch_score(extracted)
    logger.info(f"Scored {len(scored)} signals")
    
    return scored

def store_processed_signals(processed_signals):
    """
    Store processed signals in Supabase.
    
    Args:
        processed_signals: List of processed signal dicts
    
    Returns:
        List of stored processed signal IDs
    """
    logger.info(f"Storing {len(processed_signals)} processed signals...")
    stored_ids = []
    
    for signal in processed_signals:
        try:
            response = supabase.table("processed_signals").insert({
                "raw_signal_id": signal.get("id"),
                "competitor": signal.get("competitor"),
                "signal_type": signal.get("signal_type"),
                "summary": signal.get("summary"),
                "implication": signal.get("implication"),
                "impact": signal.get("impact"),
                "tags": signal.get("tags", [])
            }).execute()
            
            if response.data:
                stored_ids.append(response.data[0]["id"])
                
                # Mark raw signal as processed
                supabase.table("raw_signals").update({"processed": True}).eq("id", signal.get("id")).execute()
        except Exception as e:
            logger.error(f"Error storing processed signal: {e}")
    
    logger.info(f"Stored {len(stored_ids)} processed signals")
    return stored_ids

def run_pipeline():
    """
    Run the complete pipeline: scrape → extract → score → store → alert.
    """
    logger.info("=" * 60)
    logger.info("Starting GTM Signal Intelligence Pipeline")
    logger.info("=" * 60)
    
    try:
        # Step 1: Scrape signals
        raw_signals = scrape_all_signals()
        if not raw_signals:
            logger.warning("No signals scraped. Exiting.")
            return
        
        # Step 2: Store raw signals
        store_raw_signals(raw_signals)
        
        # Step 3: Get unprocessed signals
        unprocessed = get_unprocessed_signals()
        if not unprocessed:
            logger.warning("No unprocessed signals. Exiting.")
            return
        
        # Step 4: Process signals
        processed = process_signals(unprocessed)
        if not processed:
            logger.warning("No signals processed. Exiting.")
            return
        
        # Step 5: Store processed signals
        store_processed_signals(processed)
        
        # Step 6: Send Telegram digest
        try:
            send_telegram_digest(processed)
        except Exception as e:
            logger.error(f"Error sending Telegram digest: {e}")
        
        logger.info("=" * 60)
        logger.info("Pipeline completed successfully")
        logger.info(f"Processed {len(processed)} signals")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise

if __name__ == "__main__":
    run_pipeline()
