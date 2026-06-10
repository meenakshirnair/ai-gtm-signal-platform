"""
Flask backend API for GTM Signal Intelligence Platform.
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
import json

from models import init_db, get_session
from database import DatabaseService
from ..scrapers import CompetitorScraper, MarketTrendScraper
from ..llm_processing import InsightExtractor, AlertGenerator

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize database
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///gtm_signal.db')
engine = init_db(DATABASE_URL)

# Initialize services
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    logger.warning("GEMINI_API_KEY not found in environment variables")

insight_extractor = InsightExtractor(gemini_api_key) if gemini_api_key else None
alert_generator = AlertGenerator()
competitor_scraper = CompetitorScraper()
market_trend_scraper = MarketTrendScraper()


# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


# Competitor endpoints
@app.route('/api/competitors', methods=['GET'])
def get_competitors():
    """Get all competitors."""
    try:
        session = get_session(engine)
        db_service = DatabaseService(session)
        competitors = db_service.get_all_competitors()

        result = [
            {
                'id': c.id,
                'name': c.name,
                'website': c.website,
                'changelog_url': c.changelog_url,
                'blog_url': c.blog_url,
                'created_at': c.created_at.isoformat()
            }
            for c in competitors
        ]

        session.close()
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error fetching competitors: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/competitors', methods=['POST'])
def add_competitor():
    """Add a new competitor."""
    try:
        data = request.json
        session = get_session(engine)
        db_service = DatabaseService(session)

        competitor = db_service.add_competitor(
            name=data.get('name'),
            website=data.get('website'),
            changelog_url=data.get('changelog_url'),
            blog_url=data.get('blog_url')
        )

        result = {
            'id': competitor.id,
            'name': competitor.name,
            'website': competitor.website,
            'changelog_url': competitor.changelog_url,
            'blog_url': competitor.blog_url,
            'created_at': competitor.created_at.isoformat()
        }

        session.close()
        return jsonify(result), 201

    except Exception as e:
        logger.error(f"Error adding competitor: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/competitors/<int:competitor_id>/updates', methods=['GET'])
def get_competitor_updates(competitor_id):
    """Get updates for a specific competitor."""
    try:
        session = get_session(engine)
        db_service = DatabaseService(session)
        updates = db_service.get_competitor_updates_by_competitor(competitor_id)

        result = [
            {
                'id': u.id,
                'competitor_id': u.competitor_id,
                'source': u.source.value if u.source else None,
                'title': u.title,
                'summary': u.summary,
                'category': u.category.value if u.category else None,
                'impact_level': u.impact_level.value if u.impact_level else None,
                'sentiment': u.sentiment,
                'created_at': u.created_at.isoformat(),
                'processed': u.processed
            }
            for u in updates
        ]

        session.close()
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error fetching competitor updates: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Scraping endpoints
@app.route('/api/scrape/competitors/<int:competitor_id>', methods=['POST'])
def scrape_competitor(competitor_id):
    """Trigger scraping for a specific competitor."""
    try:
        session = get_session(engine)
        db_service = DatabaseService(session)
        competitor = db_service.get_competitor(competitor_id)

        if not competitor:
            return jsonify({'error': 'Competitor not found'}), 404

        scraped_data = competitor_scraper.scrape_all_sources({
            'name': competitor.name,
            'website': competitor.website,
            'changelog_url': competitor.changelog_url,
            'blog_url': competitor.blog_url
        })

        # Store scraped data
        for changelog_entry in scraped_data.get('changelog', []):
            db_service.add_competitor_update(
                competitor_id=competitor_id,
                source='changelog',
                source_url=competitor.changelog_url,
                raw_content=json.dumps(changelog_entry),
                title=changelog_entry.get('title')
            )

        for blog_post in scraped_data.get('blog', []):
            db_service.add_competitor_update(
                competitor_id=competitor_id,
                source='blog',
                source_url=competitor.blog_url,
                raw_content=json.dumps(blog_post),
                title=blog_post.get('title')
            )

        session.close()
        return jsonify({
            'status': 'success',
            'message': f'Scraped data for {competitor.name}',
            'data': scraped_data
        }), 200

    except Exception as e:
        logger.error(f"Error scraping competitor: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/scrape/market-trends', methods=['POST'])
def scrape_market_trends():
    """Trigger scraping for market trends."""
    try:
        config = request.json or {}
        scraped_data = market_trend_scraper.scrape_all_sources(config)

        session = get_session(engine)
        db_service = DatabaseService(session)

        # Store market trend data
        for reddit_post in scraped_data.get('reddit', []):
            db_service.add_market_trend(
                source='reddit',
                source_url=reddit_post.get('url'),
                title=reddit_post.get('title'),
                raw_content=json.dumps(reddit_post)
            )

        for hn_post in scraped_data.get('hackernews', []):
            db_service.add_market_trend(
                source='hackernews',
                source_url=hn_post.get('url'),
                title=hn_post.get('title'),
                raw_content=json.dumps(hn_post)
            )

        session.close()
        return jsonify({
            'status': 'success',
            'message': 'Scraped market trend data',
            'data': scraped_data
        }), 200

    except Exception as e:
        logger.error(f"Error scraping market trends: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Processing endpoints
@app.route('/api/process/competitor-updates', methods=['POST'])
def process_competitor_updates():
    """Process unprocessed competitor updates with LLM."""
    try:
        if not insight_extractor:
            return jsonify({'error': 'LLM service not configured'}), 500

        session = get_session(engine)
        db_service = DatabaseService(session)
        updates = db_service.get_unprocessed_competitor_updates(limit=5)

        processed_count = 0
        for update in updates:
            try:
                raw_data = json.loads(update.raw_content)
                content = raw_data.get('content', raw_data.get('title', ''))

                # Extract insights
                features = insight_extractor.extract_competitor_features(
                    content,
                    'Competitor'
                )
                summary = insight_extractor.summarize_update(content)
                sentiment = insight_extractor.analyze_sentiment(content)

                # Update database
                db_service.update_competitor_update(
                    update.id,
                    summary=summary,
                    sentiment=sentiment.get('sentiment', 'neutral'),
                    key_features=json.dumps(features.get('features', [])),
                    implications=features.get('implications', '')
                )

                processed_count += 1

            except Exception as e:
                logger.error(f"Error processing update {update.id}: {str(e)}")
                continue

        session.close()
        return jsonify({
            'status': 'success',
            'processed_count': processed_count
        }), 200

    except Exception as e:
        logger.error(f"Error processing competitor updates: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Alert endpoints
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get recent alerts."""
    try:
        limit = request.args.get('limit', 20, type=int)
        session = get_session(engine)
        db_service = DatabaseService(session)
        alerts = db_service.get_recent_alerts(limit=limit)

        result = [
            {
                'id': a.id,
                'type': a.alert_type,
                'title': a.title,
                'message': a.message,
                'impact_level': a.impact_level.value if a.impact_level else None,
                'sent': a.sent,
                'created_at': a.created_at.isoformat()
            }
            for a in alerts
        ]

        session.close()
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error fetching alerts: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Statistics endpoints
@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get platform statistics."""
    try:
        session = get_session(engine)
        db_service = DatabaseService(session)

        stats = {
            'competitors': db_service.get_competitor_statistics(),
            'market_trends': db_service.get_market_trend_statistics(),
            'alerts': db_service.get_alert_statistics(),
            'timestamp': datetime.utcnow().isoformat()
        }

        session.close()
        return jsonify(stats), 200

    except Exception as e:
        logger.error(f"Error fetching statistics: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
