"""
Telegram bot integration for delivering alerts.
"""

import os
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv
from datetime import datetime

from models import init_db, get_session
from database import DatabaseService

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize database
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///gtm_signal.db')
engine = init_db(DATABASE_URL)

# Telegram bot token
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')


class GTMSignalBot:
    """Telegram bot for GTM Signal Intelligence Platform."""

    def __init__(self):
        """Initialize the bot."""
        if not TELEGRAM_BOT_TOKEN:
            raise ValueError("TELEGRAM_BOT_TOKEN not found in environment variables")

        self.application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        self.setup_handlers()

    def setup_handlers(self):
        """Set up command handlers."""
        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("status", self.status))
        self.application.add_handler(CommandHandler("latest_alerts", self.latest_alerts))
        self.application.add_handler(CommandHandler("competitors", self.competitors))
        self.application.add_handler(CommandHandler("statistics", self.statistics))

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Start command."""
        await update.message.reply_text(
            "Welcome to GTM Signal Intelligence Platform! 🚀\n\n"
            "Use /help to see available commands."
        )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Help command."""
        help_text = """
Available commands:
/start - Start the bot
/help - Show this help message
/status - Get platform status
/latest_alerts - Get latest alerts
/competitors - List monitored competitors
/statistics - Get platform statistics
        """
        await update.message.reply_text(help_text)

    async def status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get platform status."""
        try:
            session = get_session(engine)
            db_service = DatabaseService(session)

            stats = {
                'competitors': db_service.get_competitor_statistics(),
                'market_trends': db_service.get_market_trend_statistics(),
                'alerts': db_service.get_alert_statistics()
            }

            status_text = f"""
📊 GTM Signal Platform Status

Competitors:
  • Total: {stats['competitors']['total_competitors']}
  • Updates: {stats['competitors']['total_updates']}
  • Processed: {stats['competitors']['processed_updates']}

Market Trends:
  • Total: {stats['market_trends']['total_trends']}
  • Processed: {stats['market_trends']['processed_trends']}

Alerts:
  • Total: {stats['alerts']['total_alerts']}
  • Sent: {stats['alerts']['sent_alerts']}

Last updated: {datetime.utcnow().isoformat()}
            """

            session.close()
            await update.message.reply_text(status_text)

        except Exception as e:
            logger.error(f"Error getting status: {str(e)}")
            await update.message.reply_text(f"Error: {str(e)}")

    async def latest_alerts(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get latest alerts."""
        try:
            session = get_session(engine)
            db_service = DatabaseService(session)
            alerts = db_service.get_recent_alerts(limit=5)

            if not alerts:
                await update.message.reply_text("No alerts found.")
                session.close()
                return

            alerts_text = "🔔 Latest Alerts:\n\n"
            for alert in alerts:
                priority_emoji = {
                    'critical': '🔴',
                    'high': '🟠',
                    'medium': '🟡',
                    'low': '⚪'
                }
                emoji = priority_emoji.get(alert.impact_level.value if alert.impact_level else 'medium', '⚪')
                alerts_text += f"{emoji} {alert.title}\n"
                alerts_text += f"   {alert.message[:100]}...\n\n"

            session.close()
            await update.message.reply_text(alerts_text)

        except Exception as e:
            logger.error(f"Error fetching alerts: {str(e)}")
            await update.message.reply_text(f"Error: {str(e)}")

    async def competitors(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """List monitored competitors."""
        try:
            session = get_session(engine)
            db_service = DatabaseService(session)
            competitors = db_service.get_all_competitors()

            if not competitors:
                await update.message.reply_text("No competitors being monitored.")
                session.close()
                return

            competitors_text = "🏢 Monitored Competitors:\n\n"
            for comp in competitors:
                competitors_text += f"• {comp.name}\n"

            session.close()
            await update.message.reply_text(competitors_text)

        except Exception as e:
            logger.error(f"Error fetching competitors: {str(e)}")
            await update.message.reply_text(f"Error: {str(e)}")

    async def statistics(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get platform statistics."""
        try:
            session = get_session(engine)
            db_service = DatabaseService(session)

            stats = {
                'competitors': db_service.get_competitor_statistics(),
                'market_trends': db_service.get_market_trend_statistics(),
                'alerts': db_service.get_alert_statistics()
            }

            stats_text = f"""
📈 Platform Statistics

Competitors:
  • Total: {stats['competitors']['total_competitors']}
  • Total Updates: {stats['competitors']['total_updates']}
  • Processed: {stats['competitors']['processed_updates']}
  • Unprocessed: {stats['competitors']['unprocessed_updates']}

Market Trends:
  • Total: {stats['market_trends']['total_trends']}
  • Processed: {stats['market_trends']['processed_trends']}
  • Unprocessed: {stats['market_trends']['unprocessed_trends']}

Alerts:
  • Total: {stats['alerts']['total_alerts']}
  • Sent: {stats['alerts']['sent_alerts']}
  • Unsent: {stats['alerts']['unsent_alerts']}
            """

            session.close()
            await update.message.reply_text(stats_text)

        except Exception as e:
            logger.error(f"Error fetching statistics: {str(e)}")
            await update.message.reply_text(f"Error: {str(e)}")

    async def send_alert(self, alert_message: str, chat_id: str = None):
        """Send an alert to Telegram."""
        try:
            target_chat_id = chat_id or TELEGRAM_CHAT_ID
            if not target_chat_id:
                logger.warning("No chat ID configured for sending alerts")
                return

            await self.application.bot.send_message(
                chat_id=target_chat_id,
                text=alert_message,
                parse_mode='HTML'
            )
            logger.info(f"Alert sent to chat {target_chat_id}")

        except Exception as e:
            logger.error(f"Error sending alert: {str(e)}")

    def run(self):
        """Run the bot."""
        logger.info("Starting GTM Signal Telegram bot...")
        self.application.run_polling()


def send_alert_to_telegram(alert_message: str):
    """Standalone function to send an alert to Telegram."""
    try:
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
            logger.warning("Telegram configuration incomplete")
            return

        import asyncio
        from telegram import Bot

        async def send():
            bot = Bot(token=TELEGRAM_BOT_TOKEN)
            await bot.send_message(
                chat_id=TELEGRAM_CHAT_ID,
                text=alert_message,
                parse_mode='HTML'
            )

        asyncio.run(send())
        logger.info("Alert sent to Telegram")

    except Exception as e:
        logger.error(f"Error sending alert to Telegram: {str(e)}")


if __name__ == '__main__':
    bot = GTMSignalBot()
    bot.run()
