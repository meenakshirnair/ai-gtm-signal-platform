import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY must be set in .env")

genai.configure(api_key=GEMINI_API_KEY)

EXTRACTION_PROMPT = """
You are a GTM intelligence analyst. Extract structured data from this content.

Competitor: {competitor}
Source: {source}
Content: {content}

Return ONLY valid JSON with no markdown, no explanation, no code fences:
{{
  "signal_type": "feature_launch|pricing_change|partnership|community_sentiment|other",
  "summary": "1-2 sentence factual summary of what happened",
  "implication": "1 sentence on what this means for GTM teams",
  "tags": ["tag1", "tag2"],
  "is_material": true or false
}}
"""

def extract_insights(competitor, source, content, max_retries=2):
    """
    Extract structured insights from raw content using Gemini 2.0 Flash.
    
    Args:
        competitor: Competitor name
        source: Source type (reddit, changelog, hackernews, etc.)
        content: Raw content to analyze
        max_retries: Number of retries on JSON parse failure
    
    Returns:
        dict with extracted insights or None if extraction fails
    """
    try:
        prompt = EXTRACTION_PROMPT.format(
            competitor=competitor,
            source=source,
            content=content[:2000]  # Limit content to 2000 chars for API efficiency
        )
        
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        
        if not response.text:
            logger.warning(f"Empty response from Gemini for {competitor}/{source}")
            return None
        
        # Strip markdown code fences if present
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]  # Remove ```json
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]  # Remove ```
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]  # Remove trailing ```
        raw_text = raw_text.strip()
        
        # Parse JSON
        try:
            insights = json.loads(raw_text)
            return insights
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error for {competitor}/{source}: {e}")
            logger.error(f"Raw response: {raw_text[:200]}")
            return None
            
    except Exception as e:
        logger.error(f"Error extracting insights for {competitor}/{source}: {e}")
        return None

def batch_extract(signals, max_calls=50):
    """
    Batch extract insights from multiple signals.
    
    Args:
        signals: List of raw signal dicts
        max_calls: Hard cap on Gemini API calls (free tier limit: 1500/day)
    
    Returns:
        List of processed signals with extracted insights
    """
    processed = []
    call_count = 0
    
    for signal in signals:
        if call_count >= max_calls:
            logger.warning(f"Reached max API calls limit ({max_calls}). Skipping remaining signals.")
            break
        
        insights = extract_insights(
            signal.get("competitor"),
            signal.get("source"),
            signal.get("content")
        )
        
        if insights:
            processed.append({
                **signal,
                **insights
            })
            call_count += 1
        else:
            logger.warning(f"Skipping signal from {signal.get('competitor')} - extraction failed")
    
    logger.info(f"Extracted insights from {call_count} signals")
    return processed

if __name__ == "__main__":
    # Test extraction
    test_signal = {
        "competitor": "Cursor",
        "source": "changelog",
        "title": "Cursor 0.40 Released",
        "content": "Cursor 0.40 introduces AI-powered code generation with improved accuracy. New features include multi-file editing, better context understanding, and 30% faster inference times."
    }
    
    result = extract_insights(
        test_signal["competitor"],
        test_signal["source"],
        test_signal["content"]
    )
    print(json.dumps(result, indent=2))
