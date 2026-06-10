import httpx
from bs4 import BeautifulSoup
import praw
import os
from dotenv import load_dotenv
import yaml

load_dotenv()

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "GTM-Signal-Platform/1.0")

def get_reddit_instance():
    return praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT
    )

def scrape_cursor_changelog(url):
    try:
        response = httpx.get(url, follow_redirects=True)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        signals = []
        # Example: Adjust selectors based on actual changelog structure
        # This is a generic example, will need to be refined based on actual HTML
        for item in soup.select('.changelog-item'): # Placeholder selector
            title = item.select_one('.changelog-title').get_text(strip=True) if item.select_one('.changelog-title') else 'No title'
            content = item.select_one('.changelog-content').get_text(strip=True) if item.select_one('.changelog-content') else 'No content'
            link = item.select_one('a')['href'] if item.select_one('a') else url
            signals.append({
                'competitor': 'Cursor',
                'source': 'changelog',
                'url': link,
                'title': title,
                'content': content
            })
        return signals
    except Exception as e:
        print(f"Error scraping Cursor changelog {url}: {e}")
        return []

def scrape_cursor_reddit(subreddit_name):
    try:
        reddit = get_reddit_instance()
        subreddit = reddit.subreddit(subreddit_name)
        signals = []
        for submission in subreddit.new(limit=10): # Get 10 latest posts
            signals.append({
                'competitor': 'Cursor',
                'source': 'reddit',
                'url': f"https://www.reddit.com{submission.permalink}",
                'title': submission.title,
                'content': submission.selftext or submission.url # Use selftext or URL if no selftext
            })
        return signals
    except Exception as e:
        print(f"Error scraping Cursor Reddit {subreddit_name}: {e}")
        return []

def scrape_cursor_signals():
    all_signals = []
    with open('config/competitors.yaml', 'r') as f:
        config = yaml.safe_load(f)

    for competitor_config in config['competitors']:
        if competitor_config['name'] == 'Cursor':
            for source in competitor_config['sources']:
                if source['type'] == 'changelog':
                    all_signals.extend(scrape_cursor_changelog(source['url']))
                elif source['type'] == 'reddit':
                    all_signals.extend(scrape_cursor_reddit(source['subreddit']))
    return all_signals

if __name__ == '__main__':
    signals = scrape_cursor_signals()
    for signal in signals:
        print(signal)
