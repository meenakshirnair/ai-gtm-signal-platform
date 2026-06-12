import httpx
import time
import os
from dotenv import load_dotenv
load_dotenv()

def scrape_hn_algolia(query, competitor, hits_per_page=5):
    """Scrape HackerNews via Algolia API for a given query."""
    try:
        yesterday = int(time.time()) - 86400
        r = httpx.get(
            "https://hn.algolia.com/api/v1/search",
            params={
                "query": query,
                "tags": "story",
                "hitsPerPage": hits_per_page,
                "numericFilters": "created_at_i>" + str(yesterday)
            },
            timeout=15
        )
        signals = []
        for hit in r.json().get("hits", []):
            title = hit.get("title", "")
            obj_id = hit.get("objectID", "")
            url = hit.get("url") or "https://news.ycombinator.com/item?id=" + str(obj_id)
            if not title:
                continue
            signals.append({
                "competitor": competitor,
                "source": "hackernews",
                "url": url,
                "title": title,
                "content": title + ". Points: " + str(hit.get("points", 0)) + ". Comments: " + str(hit.get("num_comments", 0)) + "."
            })
        return signals
    except Exception as e:
        print("Error scraping HN for " + competitor + ": " + str(e))
        return []

def scrape_hn_algolia_copilot():
    return scrape_hn_algolia("github copilot", "GitHub Copilot")
