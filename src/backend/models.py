"""
Database models for the GTM Signal Intelligence Platform.
"""

from datetime import datetime
from sqlalchemy import create_engine, Column, String, Text, DateTime, Integer, Float, Boolean, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import enum

Base = declarative_base()


class CompetitorSource(enum.Enum):
    """Enum for competitor data sources."""
    CHANGELOG = "changelog"
    BLOG = "blog"
    PRESS_RELEASE = "press_release"
    SOCIAL_MEDIA = "social_media"
    WEBSITE = "website"


class SignalCategory(enum.Enum):
    """Enum for signal categories."""
    FEATURE_LAUNCH = "feature_launch"
    PRICING_CHANGE = "pricing_change"
    PARTNERSHIP = "partnership"
    ACQUISITION = "acquisition"
    MARKET_TREND = "market_trend"
    SENTIMENT_SHIFT = "sentiment_shift"
    OTHER = "other"


class ImpactLevel(enum.Enum):
    """Enum for signal impact levels."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Competitor(Base):
    """Model for competitor information."""
    __tablename__ = "competitors"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    website = Column(String(255))
    changelog_url = Column(String(255))
    blog_url = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Competitor(id={self.id}, name={self.name})>"


class CompetitorUpdate(Base):
    """Model for competitor updates/signals."""
    __tablename__ = "competitor_updates"

    id = Column(Integer, primary_key=True)
    competitor_id = Column(Integer, nullable=False)
    source = Column(Enum(CompetitorSource), nullable=False)
    source_url = Column(String(500))
    raw_content = Column(Text)
    title = Column(String(500))
    summary = Column(Text)
    category = Column(Enum(SignalCategory), default=SignalCategory.OTHER)
    impact_level = Column(Enum(ImpactLevel), default=ImpactLevel.MEDIUM)
    sentiment = Column(String(50))  # positive, negative, neutral
    key_features = Column(Text)  # JSON string of extracted features
    implications = Column(Text)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

    def __repr__(self):
        return f"<CompetitorUpdate(id={self.id}, competitor_id={self.competitor_id}, category={self.category})>"


class MarketTrend(Base):
    """Model for market trends and industry signals."""
    __tablename__ = "market_trends"

    id = Column(Integer, primary_key=True)
    source = Column(String(255))  # e.g., "reddit", "news", "forum"
    source_url = Column(String(500))
    title = Column(String(500))
    raw_content = Column(Text)
    summary = Column(Text)
    key_themes = Column(Text)  # JSON string of extracted themes
    sentiment = Column(String(50))  # positive, negative, neutral
    relevance_score = Column(Float)  # 0-1 score of relevance to the niche
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

    def __repr__(self):
        return f"<MarketTrend(id={self.id}, source={self.source})>"


class Alert(Base):
    """Model for generated alerts."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    alert_type = Column(String(50))  # "competitor_update", "market_trend", "combined"
    title = Column(String(500))
    message = Column(Text)
    impact_level = Column(Enum(ImpactLevel), default=ImpactLevel.MEDIUM)
    related_competitor_update_ids = Column(Text)  # JSON string of IDs
    related_market_trend_ids = Column(Text)  # JSON string of IDs
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Alert(id={self.id}, alert_type={self.alert_type})>"


class ScrapingLog(Base):
    """Model for logging scraping activities."""
    __tablename__ = "scraping_logs"

    id = Column(Integer, primary_key=True)
    source = Column(String(255))
    status = Column(String(50))  # "success", "failed", "partial"
    items_scraped = Column(Integer, default=0)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ScrapingLog(id={self.id}, source={self.source}, status={self.status})>"


def init_db(database_url):
    """Initialize the database."""
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)
    return engine


def get_session(engine):
    """Get a database session."""
    Session = sessionmaker(bind=engine)
    return Session()
