"""
Backend module for GTM Signal Intelligence Platform.
"""

from .models import init_db, get_session
from .database import DatabaseService
from .app import app

__all__ = ['init_db', 'get_session', 'DatabaseService', 'app']
