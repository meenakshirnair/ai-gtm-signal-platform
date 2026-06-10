import httpx
from bs4 import BeautifulSoup
import yaml

def scrape_github_blog_tag(url, tag):
    try:
        response = httpx.get(url, follow_redirects=True)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        signals = []
        # This is a generic example, will need to be refined based on actual HTML
        for article in soup.select('article.post'): # Placeholder selector
            if tag in article.get_text(): # Simple tag filtering
                title = article.select_one('h2 a').get_text(strip=True) if article.select_one('h2 a') else 'No title'
                content = article.select_one('.post-content').get_text(strip=True) if article.select_one('.post-content') else 'No content'
                link = article.select_one('h2 a')['href'] if article.select_one('h2 a') else url
                signals.append({
                    'competitor': 'GitHub Copilot',
                    'source': 'blog_tag',
                    'url': link,
                    'title': title,
                    'content': content
                })
        return signals
    except Exception as e:
        print(f"Error scraping GitHub blog tag {url} with tag {tag}: {e}")
        return []

def scrape_hn_algolia(query):
    try:
        hn_api_url = f"https://hn.algolia.com/api/v1/search?query={query}&tags=story"
        response = httpx.get(hn_api_url)
        response.raise_for_status()
        data = response.json()

        signals = []
        for hit in data.get('hits', [])[:10]: # Limit to 10 hits
            signals.append({
                'competitor': 'GitHub Copilot',
                'source': 'hackernews',
                'url': hit.get('url') or f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                'title': hit.get('title'),
                'content': hit.get('story_text') or hit.get('title') # Use story_text or title
            })
        return signals
    except Exception as e:
        print(f"Error scraping Hacker News for query {query}: {e}")
        return []

def scrape_copilot_signals():
    all_signals = []
    with open('config/competitors.yaml', 'r') as f:
        config = yaml.safe_load(f)

    for competitor_config in config['competitors']:
        if competitor_config['name'] == 'GitHub Copilot':
            for source in competitor_config['sources']:
                if source['type'] == 'blog_tag':
                    all_signals.extend(scrape_github_blog_tag(source['url'], source['tag']))
                elif source['type'] == 'hackernews':
                    all_signals.extend(scrape_hn_algolia(source['query']))
    return all_signals

if __name__ == '__main__':
    signals = scrape_copilot_signals()
    for signal in signals:
        print(signal)
