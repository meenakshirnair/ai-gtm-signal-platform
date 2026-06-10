import httpx

def scrape_hn_algolia(competitor_name, query, limit=10):
    try:
        hn_api_url = f"https://hn.algolia.com/api/v1/search?query={query}&tags=story"
        response = httpx.get(hn_api_url)
        response.raise_for_status()
        data = response.json()

        signals = []
        for hit in data.get("hits", [])[:limit]:
            signals.append({
                "competitor": competitor_name,
                "source": "hackernews",
                "url": hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get("objectID")}",
                "title": hit.get("title"),
                "content": hit.get("story_text") or hit.get("title")
            })
        return signals
    except Exception as e:
        print(f"Error scraping Hacker News for query {query}: {e}")
        return []

if __name__ == "__main__":
    signals = scrape_hn_algolia("TestCompetitor", "AI", limit=5)
    for signal in signals:
        print(signal)
