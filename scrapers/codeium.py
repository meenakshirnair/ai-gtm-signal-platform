import httpx
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv
load_dotenv()

REDDIT_CLIENT_ID     = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT    = os.getenv("REDDIT_USER_AGENT", "GTM-Signal-Platform/1.0")

def scrape_codeium_hn():
    """Scrape HackerNews for Codeium mentions."""
    try:
        r = httpx.get(
            "https://hn.algolia.com/api/v1/search",
            params={"query": "Codeium code editor", "tags": "story", "hitsPerPage": 5},
            timeout=15
        )
        signals = []
        for hit in r.json().get("hits", []):
            title = hit.get("title", "")
            url   = hit.get("url") or "https://news.ycombinator.com/item?id=" + str(hit.get('objectID', ''))
            if not title:
                continue
            signals.append({
                "competitor": "Codeium",
                "source":     "hackernews",
                "url":        url,
                "title":      title,
                "content":    f"{title}. Points: {hit.get('points',0)}. Comments: {hit.get('num_comments',0)}."
            })
        return signals
    except Exception as e:
        print(f"Error scraping Codeium HN: {e}")
        return []

def scrape_codeium_changelog():
    """Scrape Codeium changelog with broad text extraction."""
    for url in ["https://codeium.com/changelog", "https://windsurf.com/changelog"]:
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
                "competitor": "Codeium",
                "source":     "changelog",
                "url":        r.url.__str__() + "#" + __import__("datetime").datetime.now().strftime("%Y-%m-%d"),
                "title":      "Codeium Changelog",
                "content":    text
            }]
        except Exception as e:
            print(f"Error scraping Codeium changelog {url}: {e}")
    return []

def scrape_codeium_reddit():
    """Scrape Reddit r/Codeium via PRAW."""
    if not REDDIT_CLIENT_ID:
        print("Error scraping Codeium Reddit r/Codeium: Required configuration setting 'client_id' missing.")
        return []
    try:
        import praw
        reddit  = praw.Reddit(client_id=REDDIT_CLIENT_ID, client_secret=REDDIT_CLIENT_SECRET, user_agent=REDDIT_USER_AGENT)
        signals = []
        for post in reddit.subreddit("Codeium").hot(limit=5):
            if post.score < 5:
                continue
            signals.append({
                "competitor": "Codeium",
                "source":     "reddit",
                "url":        f"https://reddit.com{post.permalink}",
                "title":      post.title,
                "content":    f"{post.title}. {post.selftext[:500] if post.selftext else ''} Upvotes: {post.score}."
            })
        return signals
    except Exception as e:
        print(f"Error scraping Codeium Reddit: {e}")
        return []

def scrape_codeium_signals():
    signals = []
    signals.extend(scrape_codeium_changelog())
    signals.extend(scrape_codeium_hn())
    signals.extend(scrape_codeium_reddit())
    return signals
