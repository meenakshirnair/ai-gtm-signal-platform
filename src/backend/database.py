"""
Database service module for managing data persistence.
"""

import logging
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .models import (
    Competitor, CompetitorUpdate, MarketTrend, Alert, ScrapingLog,
    CompetitorSource, SignalCategory, ImpactLevel
)

logger = logging.getLogger(__name__)


class DatabaseService:
    """Service for managing database operations."""

    def __init__(self, session: Session):
        """
        Initialize DatabaseService.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    # Competitor operations
    def add_competitor(self, name: str, website: str = None,
                      changelog_url: str = None, blog_url: str = None) -> Competitor:
        """Add a new competitor to the database."""
        try:
            competitor = Competitor(
                name=name,
                website=website,
                changelog_url=changelog_url,
                blog_url=blog_url
            )
            self.session.add(competitor)
            self.session.commit()
            logger.info(f"Added competitor: {name}")
            return competitor
        except Exception as e:
            self.session.rollback()
            logger.error(f"Error adding competitor {name}: {str(e)}")
            raise

    def get_competitor(self, competitor_id: int) -> Optional[Competitor]:
        """Get a competitor by ID."""
        return self.session.query(Competitor).filter(Competitor.id == competitor_id).first()

    def get_all_competitors(self) -> List[Competitor]:
        """Get all competitors."""
        return self.session.query(Competitor).all()

    def get_competitor_by_name(self, name: str) -> Optional[Competitor]:
        """Get a competitor by name."""
        return self.session.query(Competitor).filter(Competitor.name == name).first()

    # Competitor update operations
    def add_competitor_update(self, competitor_id: int, source: str, source_url: str,
                             raw_content: str, title: str = None) -> CompetitorUpdate:
        """Add a new competitor update."""
        try:
            update = CompetitorUpdate(
                competitor_id=competitor_id,
                source=source,
                source_url=source_url,
                raw_content=raw_content,
                title=title
            )
            self.session.add(update)
            self.session.commit()
            logger.info(f"Added competitor update for competitor_id: {competitor_id}")
            return update
        except Exception as e:
            self.session.rollback()
            logger.error(f"Error adding competitor update: {str(e)}")
            raise

    def update_competitor_update(self, update_id: int, summary: str = None,
                                category: str = None, impact_level: str = None,
                                sentiment: str = None, key_features: str = None,
                                implications: str = None) -> Optional[CompetitorUpdate]:
        """Update a competitor update with processed insights."""
        try:
            update = self.session.query(CompetitorUpdate).filter(
                CompetitorUpdate.id == update_id
            ).first()

            if not update:
                return None

            if summary:
                update.summary = summary
            if category:
                update.category = category
            if impact_level:
                update.impact_level = impact_level
            if sentiment:
                update.sentiment = sentiment
            if key_features:
                update.key_features = key_features
            if implications:
                update.implications = implications

            update.processed = True
            update.processed_at = datetime.utcnow()

            self.session.commit()
            logger.info(f"Updated competitor update: {update_id}")
            return update

        except Exception as e:
            self.session.rollback()
            logger.error(f"Error updating competitor update {update_id}: {str(e)}")
            raise

    def get_unprocessed_competitor_updates(self, limit: int = 10) -> List[CompetitorUpdate]:
        """Get unprocessed competitor updates."""
        return self.session.query(CompetitorUpdate).filter(
            CompetitorUpdate.processed == False
        ).order_by(desc(CompetitorUpdate.created_at)).limit(limit).all()

    def get_competitor_updates_by_competitor(self, competitor_id: int,
                                            limit: int = 20) -> List[CompetitorUpdate]:
        """Get recent updates for a specific competitor."""
        return self.session.query(CompetitorUpdate).filter(
            CompetitorUpdate.competitor_id == competitor_id
        ).order_by(desc(CompetitorUpdate.created_at)).limit(limit).all()

    # Market trend operations
    def add_market_trend(self, source: str, source_url: str, title: str,
                        raw_content: str) -> MarketTrend:
        """Add a new market trend."""
        try:
            trend = MarketTrend(
                source=source,
                source_url=source_url,
                title=title,
                raw_content=raw_content
            )
            self.session.add(trend)
            self.session.commit()
            logger.info(f"Added market trend: {title}")
            return trend
        except Exception as e:
            self.session.rollback()
            logger.error(f"Error adding market trend: {str(e)}")
            raise

    def update_market_trend(self, trend_id: int, summary: str = None,
                           key_themes: str = None, sentiment: str = None,
                           relevance_score: float = None) -> Optional[MarketTrend]:
        """Update a market trend with processed insights."""
        try:
            trend = self.session.query(MarketTrend).filter(
                MarketTrend.id == trend_id
            ).first()

            if not trend:
                return None

            if summary:
                trend.summary = summary
            if key_themes:
                trend.key_themes = key_themes
            if sentiment:
                trend.sentiment = sentiment
            if relevance_score is not None:
                trend.relevance_score = relevance_score

            trend.processed = True
            trend.processed_at = datetime.utcnow()

            self.session.commit()
            logger.info(f"Updated market trend: {trend_id}")
            return trend

        except Exception as e:
            self.session.rollback()
            logger.error(f"Error updating market trend {trend_id}: {str(e)}")
            raise

    def get_unprocessed_market_trends(self, limit: int = 10) -> List[MarketTrend]:
        """Get unprocessed market trends."""
        return self.session.query(MarketTrend).filter(
            MarketTrend.processed == False
        ).order_by(desc(MarketTrend.created_at)).limit(limit).all()

    def get_recent_market_trends(self, limit: int = 20) -> List[MarketTrend]:
        """Get recent market trends."""
        return self.session.query(MarketTrend).order_by(
            desc(MarketTrend.created_at)
        ).limit(limit).all()

    # Alert operations
    def add_alert(self, alert_type: str, title: str, message: str,
                 impact_level: str = 'medium',
                 related_competitor_update_ids: str = None,
                 related_market_trend_ids: str = None) -> Alert:
        """Add a new alert."""
        try:
            alert = Alert(
                alert_type=alert_type,
                title=title,
                message=message,
                impact_level=impact_level,
                related_competitor_update_ids=related_competitor_update_ids,
                related_market_trend_ids=related_market_trend_ids
            )
            self.session.add(alert)
            self.session.commit()
            logger.info(f"Added alert: {title}")
            return alert
        except Exception as e:
            self.session.rollback()
            logger.error(f"Error adding alert: {str(e)}")
            raise

    def mark_alert_sent(self, alert_id: int) -> Optional[Alert]:
        """Mark an alert as sent."""
        try:
            alert = self.session.query(Alert).filter(Alert.id == alert_id).first()
            if alert:
                alert.sent = True
                alert.sent_at = datetime.utcnow()
                self.session.commit()
                logger.info(f"Marked alert {alert_id} as sent")
            return alert
        except Exception as e:
            self.session.rollback()
            logger.error(f"Error marking alert as sent: {str(e)}")
            raise

    def get_unsent_alerts(self, limit: int = 10) -> List[Alert]:
        """Get unsent alerts."""
        return self.session.query(Alert).filter(
            Alert.sent == False
        ).order_by(desc(Alert.created_at)).limit(limit).all()

    def get_recent_alerts(self, limit: int = 20) -> List[Alert]:
        """Get recent alerts."""
        return self.session.query(Alert).order_by(
            desc(Alert.created_at)
        ).limit(limit).all()

    # Scraping log operations
    def add_scraping_log(self, source: str, status: str,
                        items_scraped: int = 0, error_message: str = None) -> ScrapingLog:
        """Add a scraping log entry."""
        try:
            log = ScrapingLog(
                source=source,
                status=status,
                items_scraped=items_scraped,
                error_message=error_message
            )
            self.session.add(log)
            self.session.commit()
            logger.info(f"Added scraping log for source: {source}")
            return log
        except Exception as e:
            self.session.rollback()
            logger.error(f"Error adding scraping log: {str(e)}")
            raise

    def get_scraping_logs(self, source: str = None, limit: int = 20) -> List[ScrapingLog]:
        """Get scraping logs, optionally filtered by source."""
        query = self.session.query(ScrapingLog)
        if source:
            query = query.filter(ScrapingLog.source == source)
        return query.order_by(desc(ScrapingLog.created_at)).limit(limit).all()

    # Statistics and reporting
    def get_competitor_statistics(self) -> Dict:
        """Get statistics about competitors and their updates."""
        total_competitors = self.session.query(Competitor).count()
        total_updates = self.session.query(CompetitorUpdate).count()
        processed_updates = self.session.query(CompetitorUpdate).filter(
            CompetitorUpdate.processed == True
        ).count()

        return {
            'total_competitors': total_competitors,
            'total_updates': total_updates,
            'processed_updates': processed_updates,
            'unprocessed_updates': total_updates - processed_updates
        }

    def get_market_trend_statistics(self) -> Dict:
        """Get statistics about market trends."""
        total_trends = self.session.query(MarketTrend).count()
        processed_trends = self.session.query(MarketTrend).filter(
            MarketTrend.processed == True
        ).count()

        return {
            'total_trends': total_trends,
            'processed_trends': processed_trends,
            'unprocessed_trends': total_trends - processed_trends
        }

    def get_alert_statistics(self) -> Dict:
        """Get statistics about alerts."""
        total_alerts = self.session.query(Alert).count()
        sent_alerts = self.session.query(Alert).filter(Alert.sent == True).count()

        return {
            'total_alerts': total_alerts,
            'sent_alerts': sent_alerts,
            'unsent_alerts': total_alerts - sent_alerts
        }
