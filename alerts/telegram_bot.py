import os
from dotenv import load_dotenv
import httpx
import json
from datetime import datetime
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

def format_digest(signals):
    """
    Format processed signals into a GTM digest.
    
    Args:
        signals: List of processed signal dicts
    
    Returns:
        str: Formatted digest text
    """
    if not signals:
        return "No signals to report today."
    
    # Separate by impact level
    high_priority = [s for s in signals if s.get("impact") == "high"]
    medium_priority = [s for s in signals if s.get("impact") == "medium"]
    
    # Limit to 5 signals total, high priority first
    digest_signals = (high_priority + medium_priority)[:5]
    
    date_str = datetime.now().strftime("%Y-%m-%d")
    digest = f"AI Coding Tools Digest — {date_str}\n\n"
    
    if high_priority:
        digest += "HIGH PRIORITY\n"
        for signal in high_priority[:3]:  # Max 3 high priority
            digest += f"{signal.get('competitor')} — {signal.get('signal_type')}: {signal.get('summary')}. Why it matters: {signal.get('implication')}\n\n"
    
    if medium_priority:
        digest += "MEDIUM PRIORITY\n"
        for signal in medium_priority[:2]:  # Max 2 medium priority
            digest += f"{signal.get('competitor')} — {signal.get('signal_type')}: {signal.get('summary')}\n\n"
    
    return digest.strip()

def send_telegram_message(message):
    """
    Send a message to Telegram.
    
    Args:
        message: str, message text
    
    Returns:
        bool: True if sent successfully, False otherwise
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram bot token or chat ID not configured. Skipping Telegram alert.")
        return False
    
    try:
        url = f"{TELEGRAM_API_URL}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        
        response = httpx.post(url, json=payload)
        response.raise_for_status()
        logger.info("Telegram message sent successfully")
        return True
    except Exception as e:
        logger.error(f"Error sending Telegram message: {e}")
        return False

def send_telegram_digest(signals):
    """
    Send a formatted digest of signals via Telegram.
    
    Args:
        signals: List of processed signal dicts
    """
    digest = format_digest(signals)
    send_telegram_message(digest)

if __name__ == "__main__":
    # Test digest formatting
    test_signals = [
        {
            "competitor": "Cursor",
            "signal_type": "pricing_change",
            "summary": "Cursor Pro pricing increased from $10 to $15/month",
            "implication": "Potential revenue increase but may impact user acquisition",
            "impact": "high"
        },
        {
            "competitor": "Windsurf",
            "signal_type": "feature_launch",
            "summary": "Windsurf launches multi-file editing",
            "implication": "Competitive feature parity with Cursor",
            "impact": "medium"
        }
    ]
    
    digest = format_digest(test_signals)
    print(digest)
