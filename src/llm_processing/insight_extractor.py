"""
LLM-powered insight extraction module using Google Gemini API.
"""

import google.generativeai as genai
import logging
import json
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class InsightExtractor:
    """Extract insights from unstructured text using LLMs."""

    def __init__(self, api_key: str):
        """
        Initialize the InsightExtractor with Gemini API.

        Args:
            api_key: Google Gemini API key
        """
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')

    def extract_competitor_features(self, content: str, competitor_name: str) -> Dict:
        """
        Extract new features from competitor update content.

        Args:
            content: Raw text content from competitor update
            competitor_name: Name of the competitor

        Returns:
            Dictionary with extracted features and implications
        """
        prompt = f"""
        Analyze the following competitor update from {competitor_name} and extract:
        1. New features or capabilities launched
        2. Pricing changes (if any)
        3. Strategic implications for similar products
        4. Sentiment (positive, negative, neutral)
        5. Impact level (high, medium, low)

        Content:
        {content}

        Respond in JSON format with keys: features, pricing_changes, implications, sentiment, impact_level
        """

        try:
            response = self.model.generate_content(prompt)
            # Parse the response
            response_text = response.text
            # Try to extract JSON from the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)
            else:
                result = {
                    'features': response_text,
                    'pricing_changes': 'N/A',
                    'implications': 'N/A',
                    'sentiment': 'neutral',
                    'impact_level': 'medium'
                }

            logger.info(f"Successfully extracted features for {competitor_name}")
            return result

        except Exception as e:
            logger.error(f"Error extracting features for {competitor_name}: {str(e)}")
            return {
                'features': [],
                'pricing_changes': 'N/A',
                'implications': 'N/A',
                'sentiment': 'neutral',
                'impact_level': 'medium'
            }

    def summarize_update(self, content: str, max_length: int = 200) -> str:
        """
        Summarize a competitor or market update.

        Args:
            content: Raw text content to summarize
            max_length: Maximum length of summary in characters

        Returns:
            Summarized text
        """
        prompt = f"""
        Summarize the following content in {max_length} characters or less. 
        Focus on the key business implications and strategic relevance.

        Content:
        {content}

        Provide only the summary, no additional text.
        """

        try:
            response = self.model.generate_content(prompt)
            summary = response.text.strip()
            logger.info("Successfully summarized content")
            return summary

        except Exception as e:
            logger.error(f"Error summarizing content: {str(e)}")
            return content[:max_length]

    def analyze_sentiment(self, content: str) -> Dict:
        """
        Analyze sentiment of content.

        Args:
            content: Text content to analyze

        Returns:
            Dictionary with sentiment analysis results
        """
        prompt = f"""
        Analyze the sentiment of the following content and provide:
        1. Overall sentiment (positive, negative, neutral)
        2. Confidence score (0-1)
        3. Key sentiment indicators

        Content:
        {content}

        Respond in JSON format with keys: sentiment, confidence, indicators
        """

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)
            else:
                result = {
                    'sentiment': 'neutral',
                    'confidence': 0.5,
                    'indicators': []
                }

            logger.info("Successfully analyzed sentiment")
            return result

        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'indicators': []
            }

    def extract_market_themes(self, content_list: List[str]) -> Dict:
        """
        Extract common themes from a list of market trend content.

        Args:
            content_list: List of text content from market trends

        Returns:
            Dictionary with extracted themes and frequency
        """
        combined_content = "\n---\n".join(content_list)
        prompt = f"""
        Analyze the following market trend content and identify:
        1. Common themes or topics
        2. Emerging technologies or approaches
        3. Pain points mentioned
        4. Sentiment trends

        Content:
        {combined_content}

        Respond in JSON format with keys: themes, technologies, pain_points, sentiment_trend
        """

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)
            else:
                result = {
                    'themes': [],
                    'technologies': [],
                    'pain_points': [],
                    'sentiment_trend': 'neutral'
                }

            logger.info("Successfully extracted market themes")
            return result

        except Exception as e:
            logger.error(f"Error extracting market themes: {str(e)}")
            return {
                'themes': [],
                'technologies': [],
                'pain_points': [],
                'sentiment_trend': 'neutral'
            }

    def generate_strategic_alert(self, competitor_update: Dict, market_context: Optional[Dict] = None) -> str:
        """
        Generate a strategic alert message based on competitor update and market context.

        Args:
            competitor_update: Dictionary with competitor update details
            market_context: Optional dictionary with market context

        Returns:
            Strategic alert message
        """
        prompt = f"""
        Based on the following competitor update, generate a concise strategic alert 
        for a GTM team. The alert should highlight business implications and recommended actions.

        Competitor Update:
        {json.dumps(competitor_update, indent=2)}

        Market Context:
        {json.dumps(market_context, indent=2) if market_context else 'N/A'}

        Generate a clear, actionable alert message (2-3 sentences).
        """

        try:
            response = self.model.generate_content(prompt)
            alert = response.text.strip()
            logger.info("Successfully generated strategic alert")
            return alert

        except Exception as e:
            logger.error(f"Error generating strategic alert: {str(e)}")
            return "Alert generated but could not be processed."

    def batch_process_updates(self, updates: List[Dict]) -> List[Dict]:
        """
        Process multiple updates in batch.

        Args:
            updates: List of update dictionaries with 'content' and 'type' keys

        Returns:
            List of processed updates with extracted insights
        """
        processed = []

        for update in updates:
            try:
                processed_update = {
                    'original': update,
                    'summary': self.summarize_update(update.get('content', '')),
                    'sentiment': self.analyze_sentiment(update.get('content', '')),
                    'processed_at': datetime.utcnow().isoformat()
                }

                if update.get('type') == 'competitor':
                    processed_update['features'] = self.extract_competitor_features(
                        update.get('content', ''),
                        update.get('competitor_name', 'Unknown')
                    )

                processed.append(processed_update)

            except Exception as e:
                logger.error(f"Error processing update: {str(e)}")
                continue

        logger.info(f"Successfully processed {len(processed)} updates")
        return processed
