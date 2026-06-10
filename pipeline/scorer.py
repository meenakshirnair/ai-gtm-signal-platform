import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

NEGATIVE_KEYWORDS = [
    "bug", "outage", "security", "vulnerability", "crash", "failure",
    "deprecated", "removed", "discontinued", "shutdown", "complaint",
    "negative", "poor", "bad", "terrible", "awful"
]

def score_signal(signal):
    """
    Score a signal by impact level based on rule-based logic.
    
    Args:
        signal: dict with signal_type, source, content, etc.
    
    Returns:
        str: 'high', 'medium', or 'low'
    """
    signal_type = signal.get("signal_type", "other")
    source = signal.get("source", "")
    content = signal.get("content", "").lower()
    upvotes = signal.get("upvotes", 0)
    
    # Rule 1: Pricing changes are always high impact
    if signal_type == "pricing_change":
        logger.debug(f"Scoring {signal.get('title', 'unknown')}: HIGH (pricing_change)")
        return "high"
    
    # Rule 2: Feature launches with high Reddit engagement
    if signal_type == "feature_launch" and source == "reddit" and upvotes > 50:
        logger.debug(f"Scoring {signal.get('title', 'unknown')}: HIGH (feature_launch + high engagement)")
        return "high"
    
    # Rule 3: General feature launches
    if signal_type == "feature_launch":
        logger.debug(f"Scoring {signal.get('title', 'unknown')}: MEDIUM (feature_launch)")
        return "medium"
    
    # Rule 4: Partnerships
    if signal_type == "partnership":
        logger.debug(f"Scoring {signal.get('title', 'unknown')}: MEDIUM (partnership)")
        return "medium"
    
    # Rule 5: Negative community sentiment
    if signal_type == "community_sentiment":
        has_negative = any(keyword in content for keyword in NEGATIVE_KEYWORDS)
        if has_negative:
            logger.debug(f"Scoring {signal.get('title', 'unknown')}: MEDIUM (negative sentiment)")
            return "medium"
    
    # Default: Low impact
    logger.debug(f"Scoring {signal.get('title', 'unknown')}: LOW (default)")
    return "low"

def batch_score(signals):
    """
    Score multiple signals.
    
    Args:
        signals: List of signal dicts
    
    Returns:
        List of signals with 'impact' field added
    """
    scored = []
    for signal in signals:
        impact = score_signal(signal)
        signal["impact"] = impact
        scored.append(signal)
    
    logger.info(f"Scored {len(scored)} signals")
    return scored

if __name__ == "__main__":
    # Test scoring
    test_signals = [
        {
            "title": "Cursor raises pricing",
            "signal_type": "pricing_change",
            "source": "changelog",
            "content": "Cursor Pro pricing increased from $10 to $15/month"
        },
        {
            "title": "Windsurf launches multi-file editing",
            "signal_type": "feature_launch",
            "source": "reddit",
            "content": "Windsurf now supports editing multiple files simultaneously",
            "upvotes": 150
        },
        {
            "title": "GitHub Copilot outage reported",
            "signal_type": "community_sentiment",
            "source": "reddit",
            "content": "Many users reporting GitHub Copilot is down and not working",
            "upvotes": 45
        }
    ]
    
    scored = batch_score(test_signals)
    for s in scored:
        print(f"{s['title']}: {s['impact']}")
