"""
Alert generator module for creating and categorizing alerts.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class AlertPriority(Enum):
    """Alert priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlertGenerator:
    """Generate alerts from processed signals."""

    def __init__(self):
        self.priority_keywords = {
            'critical': ['acquisition', 'major pivot', 'market exit', 'bankruptcy', 'major funding'],
            'high': ['new feature', 'pricing change', 'partnership', 'expansion', 'new market'],
            'medium': ['update', 'improvement', 'optimization', 'minor feature'],
            'low': ['blog post', 'announcement', 'hiring']
        }

    def determine_priority(self, content: str, impact_level: Optional[str] = None) -> AlertPriority:
        """
        Determine alert priority based on content and impact level.

        Args:
            content: Alert content text
            impact_level: Optional impact level from LLM analysis

        Returns:
            AlertPriority enum value
        """
        content_lower = content.lower()

        # Check impact level first if provided
        if impact_level:
            if impact_level.lower() == 'high':
                return AlertPriority.HIGH
            elif impact_level.lower() == 'medium':
                return AlertPriority.MEDIUM
            elif impact_level.lower() == 'low':
                return AlertPriority.LOW

        # Check for critical keywords
        for keyword in self.priority_keywords['critical']:
            if keyword in content_lower:
                return AlertPriority.CRITICAL

        # Check for high priority keywords
        for keyword in self.priority_keywords['high']:
            if keyword in content_lower:
                return AlertPriority.HIGH

        # Check for medium priority keywords
        for keyword in self.priority_keywords['medium']:
            if keyword in content_lower:
                return AlertPriority.MEDIUM

        # Default to low
        return AlertPriority.LOW

    def create_competitor_alert(self, competitor_name: str, update_summary: str,
                               impact_level: str, features: Optional[List[str]] = None) -> Dict:
        """
        Create a competitor alert.

        Args:
            competitor_name: Name of the competitor
            update_summary: Summary of the update
            impact_level: Impact level (high, medium, low)
            features: Optional list of new features

        Returns:
            Alert dictionary
        """
        title = f"🔴 Competitor Alert: {competitor_name}"
        message = f"{competitor_name} has made a significant update:\n\n{update_summary}"

        if features:
            message += f"\n\nNew Features:\n" + "\n".join([f"• {f}" for f in features[:5]])

        priority = self.determine_priority(message, impact_level)

        alert = {
            'type': 'competitor_update',
            'title': title,
            'message': message,
            'competitor': competitor_name,
            'priority': priority.value,
            'impact_level': impact_level,
            'created_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Created competitor alert for {competitor_name} with priority {priority.value}")
        return alert

    def create_market_trend_alert(self, trend_title: str, trend_summary: str,
                                 themes: Optional[List[str]] = None,
                                 sentiment: Optional[str] = None) -> Dict:
        """
        Create a market trend alert.

        Args:
            trend_title: Title of the trend
            trend_summary: Summary of the trend
            themes: Optional list of themes
            sentiment: Optional sentiment analysis

        Returns:
            Alert dictionary
        """
        title = f"📊 Market Trend: {trend_title}"
        message = f"Emerging market trend detected:\n\n{trend_summary}"

        if themes:
            message += f"\n\nKey Themes:\n" + "\n".join([f"• {t}" for t in themes[:5]])

        if sentiment:
            message += f"\n\nSentiment: {sentiment}"

        priority = self.determine_priority(message)

        alert = {
            'type': 'market_trend',
            'title': title,
            'message': message,
            'themes': themes or [],
            'sentiment': sentiment,
            'priority': priority.value,
            'created_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Created market trend alert with priority {priority.value}")
        return alert

    def create_opportunity_alert(self, opportunity_title: str, description: str,
                                related_signals: Optional[List[str]] = None) -> Dict:
        """
        Create an opportunity alert based on multiple signals.

        Args:
            opportunity_title: Title of the opportunity
            description: Description of the opportunity
            related_signals: Optional list of related signal IDs

        Returns:
            Alert dictionary
        """
        title = f"💡 Opportunity: {opportunity_title}"
        message = f"Potential GTM opportunity identified:\n\n{description}"

        if related_signals:
            message += f"\n\nRelated Signals: {', '.join(related_signals[:5])}"

        priority = self.determine_priority(message)

        alert = {
            'type': 'opportunity',
            'title': title,
            'message': message,
            'related_signals': related_signals or [],
            'priority': priority.value,
            'created_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Created opportunity alert with priority {priority.value}")
        return alert

    def batch_create_alerts(self, signals: List[Dict]) -> List[Dict]:
        """
        Create alerts from a batch of processed signals.

        Args:
            signals: List of processed signal dictionaries

        Returns:
            List of generated alerts
        """
        alerts = []

        for signal in signals:
            try:
                if signal.get('type') == 'competitor':
                    alert = self.create_competitor_alert(
                        competitor_name=signal.get('competitor_name', 'Unknown'),
                        update_summary=signal.get('summary', ''),
                        impact_level=signal.get('impact_level', 'medium'),
                        features=signal.get('features', [])
                    )
                elif signal.get('type') == 'market_trend':
                    alert = self.create_market_trend_alert(
                        trend_title=signal.get('title', 'Market Trend'),
                        trend_summary=signal.get('summary', ''),
                        themes=signal.get('themes', []),
                        sentiment=signal.get('sentiment', '')
                    )
                else:
                    continue

                alerts.append(alert)

            except Exception as e:
                logger.error(f"Error creating alert from signal: {str(e)}")
                continue

        logger.info(f"Successfully created {len(alerts)} alerts from {len(signals)} signals")
        return alerts

    def filter_alerts_by_priority(self, alerts: List[Dict], min_priority: str = 'medium') -> List[Dict]:
        """
        Filter alerts by minimum priority level.

        Args:
            alerts: List of alert dictionaries
            min_priority: Minimum priority level (critical, high, medium, low)

        Returns:
            Filtered list of alerts
        """
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        min_priority_value = priority_order.get(min_priority.lower(), 2)

        filtered = [
            alert for alert in alerts
            if priority_order.get(alert.get('priority', 'medium'), 2) <= min_priority_value
        ]

        logger.info(f"Filtered {len(alerts)} alerts to {len(filtered)} with priority >= {min_priority}")
        return filtered

    def format_alert_for_telegram(self, alert: Dict) -> str:
        """
        Format an alert for Telegram delivery.

        Args:
            alert: Alert dictionary

        Returns:
            Formatted alert message for Telegram
        """
        priority_emoji = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '⚪'
        }

        emoji = priority_emoji.get(alert.get('priority', 'medium'), '⚪')
        title = alert.get('title', 'Alert')
        message = alert.get('message', '')

        formatted = f"{emoji} {title}\n\n{message}\n\n_Generated at {alert.get('created_at', 'N/A')}_"
        return formatted

    def format_alert_for_dashboard(self, alert: Dict) -> Dict:
        """
        Format an alert for dashboard display.

        Args:
            alert: Alert dictionary

        Returns:
            Formatted alert dictionary for frontend
        """
        return {
            'id': alert.get('id'),
            'type': alert.get('type'),
            'title': alert.get('title'),
            'message': alert.get('message'),
            'priority': alert.get('priority'),
            'created_at': alert.get('created_at'),
            'competitor': alert.get('competitor'),
            'themes': alert.get('themes', []),
            'sentiment': alert.get('sentiment')
        }
