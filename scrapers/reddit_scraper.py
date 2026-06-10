import praw
import os
from dotenv import load_dotenv

load_dotenv()

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "GTM-Signal-Platform/1.0")

def get_reddit_instance():
    if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
        raise ValueError("REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set in .env")
    return praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT
    )

def scrape_subreddit(competitor_name, subreddit_name, limit=10):
    try:
        reddit = get_reddit_instance()
        subreddit = reddit.subreddit(subreddit_name)
        signals = []
        for submission in subreddit.new(limit=limit):
            signals.append({
                'competitor': competitor_name,
                'source': 'reddit',
                'url': f"https://www.reddit.com{submission.permalink}",
                'title': submission.title,
                'content': submission.selftext or submission.url,
                'upvotes': submission.score
            })
        return signals
    except Exception as e:
        print(f"Error scraping Reddit subreddit {subreddit_name} for {competitor_name}: {e}")
        return []

if __name__ == '__main__':
    # Example usage
    # Ensure .env has REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET
    # For testing, you might need to create a dummy .env file or set env vars directly
    signals = scrape_subreddit("TestCompetitor", "python", limit=5)
    for signal in signals:
        print(signal)
