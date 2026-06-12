import httpx
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

REDDIT_CLIENT_ID     = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT    = os.getenv("REDDIT_USER_AGENT", "GTM-Signal-Platform/1.0")

def scrape_cursor_hn():
    """Scrape HackerNews for Cursor AI mentions via Algolia API."""
    try:
        r = httpx.get(
            "https://hn.algolia.com/api/v1/search",
            params={"query": "Cursor AI editor", "tags": "story", "hitsPerPage": 5},
            timeout=15
        )
        signals = []
        for hit in r.json().get("hits", []):
            title = hit.get("title", "")
            url   = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
            if not title:
                continue
            signals.append({
                "competitor": "Cursor",
                "source":     "hackernews",
                "url":        url,
                "title":      title,
                "content":    f"{title}. Points: {hit.get('points',0)}. Comments: {hit.get('num_comments',0)}."
            })
        return signals
    except Exception as e:
        print(f"Error scraping Cursor HN: {e}")
        return []

def scrape_cursor_changelog():
    """Scrape Cursor changelog page with broad text extraction."""
    try:
        r = httpx.get("https://cursor.com/changelog", follow_redirects=True, timeout=15)
        soup = BeautifulSoup(r.text, "html.parser")
        # Remove nav/footer noise
        for tag in soup(["nav", "footer", "script", "style"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)[:3000]
        if len(text) < 100:
            return []
        return [{
            "competitor": "Cursor",
            "source":     "changelog",
            "url":        "https://cursor.com/changelog#" + datetime.now().strftime("%Y-%m-%d"),
            "title":      "Cursor Changelog",
            "content":    text
        }]
    except Exception as e:
        print(f"Error scraping Cursor changelog: {e}")
        return []

def scrape_cursor_reddit():
    """Scrape Reddit r/cursor via PRAW."""
    if not REDDIT_CLIENT_ID:
        print("Error scraping Cursor Reddit r/cursor: Required configuration setting 'client_id' missing.")
        return []
    try:
        import praw
        reddit  = praw.Reddit(client_id=REDDIT_CLIENT_ID, client_secret=REDDIT_CLIENT_SECRET, user_agent=REDDIT_USER_AGENT)
        signals = []
        for post in reddit.subreddit("cursor").hot(limit=5):
            if post.score < 5:
                continue
            signals.append({
                "competitor": "Cursor",
                "source":     "reddit",
                "url":        f"https://reddit.com{post.permalink}",
                "title":      post.title,
                "content":    f"{post.title}. {post.selftext[:500] if post.selftext else ''} Upvotes: {post.score}."
            })
        return signals
    except Exception as e:
        print(f"Error scraping Cursor Reddit: {e}")
        return []

def scrape_cursor_signals():
    signals = []
    signals.extend(scrape_cursor_changelog())
    signals.extend(scrape_cursor_hn())
    signals.extend(scrape_cursor_reddit())
    return signals
