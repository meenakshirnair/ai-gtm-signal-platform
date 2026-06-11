import httpx
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv
load_dotenv()

REDDIT_CLIENT_ID     = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT    = os.getenv("REDDIT_USER_AGENT", "GTM-Signal-Platform/1.0")

def scrape_windsurf_hn():
    """Scrape HackerNews for Windsurf mentions."""
    try:
        r = httpx.get(
            "https://hn.algolia.com/api/v1/search",
            params={"query": "Windsurf IDE Codeium", "tags": "story", "hitsPerPage": 5},
            timeout=15
        )
        signals = []
        for hit in r.json().get("hits", []):
            title = hit.get("title", "")
            url   = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
            if not title:
                continue
            signals.append({
                "competitor": "Windsurf",
                "source":     "hackernews",
                "url":        url,
                "title":      title,
                "content":    f"{title}. Points: {hit.get('points',0)}. Comments: {hit.get('num_comments',0)}."
            })
        return signals
    except Exception as e:
        print(f"Error scraping Windsurf HN: {e}")
        return []

def scrape_windsurf_blog():
    """Scrape Windsurf blog with broad text extraction."""
    for url in ["https://windsurf.com/blog", "https://codeium.com/blog"]:
        try:
            r = httpx.get(url, follow_redirects=True, timeout=15)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            for tag in soup(["nav", "footer", "script", "style"]):
                tag.decompose()
            text = soup.get_text(separator=" ", strip=True)[:3000]
            if len(text) < 100:
                continue
            return [{
                "competitor": "Windsurf",
                "source":     "blog",
                "url":        r.url.__str__(),
                "title":      "Windsurf Blog",
                "content":    text
            }]
        except Exception as e:
            print(f"Error scraping Windsurf blog {url}: {e}")
    return []

def scrape_windsurf_reddit():
    """Scrape Reddit r/Codeium via PRAW."""
    if not REDDIT_CLIENT_ID:
        print("Error scraping Windsurf Reddit r/Codeium: Required configuration setting 'client_id' missing.")
        return []
    try:
        import praw
        reddit  = praw.Reddit(client_id=REDDIT_CLIENT_ID, client_secret=REDDIT_CLIENT_SECRET, user_agent=REDDIT_USER_AGENT)
        signals = []
        for post in reddit.subreddit("Codeium").hot(limit=5):
            if post.score < 5:
                continue
            signals.append({
                "competitor": "Windsurf",
                "source":     "reddit",
                "url":        f"https://reddit.com{post.permalink}",
                "title":      post.title,
                "content":    f"{post.title}. {post.selftext[:500] if post.selftext else ''} Upvotes: {post.score}."
            })
        return signals
    except Exception as e:
        print(f"Error scraping Windsurf Reddit: {e}")
        return []

def scrape_windsurf_signals():
    signals = []
    signals.extend(scrape_windsurf_blog())
    signals.extend(scrape_windsurf_hn())
    signals.extend(scrape_windsurf_reddit())
    return signals
