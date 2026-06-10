from groq import Groq
import json
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY must be set in .env")

client = Groq(api_key=GROQ_API_KEY)

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
  "is_material": true
}}
"""

def extract_insights(competitor, source, content, max_retries=2):
    try:
        prompt = EXTRACTION_PROMPT.format(
            competitor=competitor,
            source=source,
            content=content[:2000]
        )

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        result_text = response.choices[0].message.content

        if not result_text:
            logger.warning(f"Empty response for {competitor}/{source}")
            return None

        raw_text = result_text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

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
    processed = []
    call_count = 0

    for signal in signals:
        if call_count >= max_calls:
            logger.warning(f"Reached max API calls limit ({max_calls}). Skipping remaining.")
            break

        insights = extract_insights(
            signal.get("competitor"),
            signal.get("source"),
            signal.get("content")
        )

        if insights:
            processed.append({**signal, **insights})
            call_count += 1
        else:
            logger.warning(f"Skipping signal from {signal.get('competitor')} - extraction failed")

    logger.info(f"Extracted insights from {call_count} signals")
    return processed

if __name__ == "__main__":
    result = extract_insights(
        "Cursor", "changelog",
        "Cursor 0.40 introduces AI-powered code generation with improved accuracy."
    )
    print(json.dumps(result, indent=2))
