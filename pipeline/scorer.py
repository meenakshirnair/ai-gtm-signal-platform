import logging
logger = logging.getLogger(__name__)

NEGATIVE_KEYWORDS = ["bug", "broken", "slow", "expensive", "cancelled", "disappointing",
                     "worse", "failed", "down", "outage", "complaint", "issue", "problem"]

HIGH_KEYWORDS = ["launch", "release", "major", "new feature", "pricing", "acqui",
                 "partnership", "enterprise", "raises", "funding", "free tier", "unlimited"]

def score_signal(signal):
    signal_type = signal.get("signal_type", "other")
    source      = signal.get("source", "")
    content     = (signal.get("content", "") + " " + signal.get("summary", "")).lower()

    # HIGH: pricing changes always matter
    if signal_type == "pricing_change":
        return "high"

    # HIGH: partnerships always significant
    if signal_type == "partnership":
        return "high"

    # HIGH: feature launches from official changelogs only
    if signal_type == "feature_launch" and source in ["changelog", "blog"]:
        return "high"

    # MEDIUM: feature launches from community (unverified)
    if signal_type == "feature_launch":
        return "medium"

    # MEDIUM: negative community sentiment only (positive chatter = low)
    if signal_type == "community_sentiment":
        if any(kw in content for kw in NEGATIVE_KEYWORDS):
            return "medium"
        return "low"

    # MEDIUM: 'other' only if high-signal keywords present
    if signal_type == "other":
        if any(kw in content for kw in HIGH_KEYWORDS):
            return "medium"
        return "low"

    return "low"

def score_signals(signals):
    scored = []
    for signal in signals:
        impact = score_signal(signal)
        signal["impact"] = impact
        scored.append(signal)
    logger.info(f"Scored {len(scored)} signals")
    return scored

# Alias for backward compatibility
batch_score = score_signals
