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

def scrape_codeium_changelog(url):
    try:
        response = httpx.get(url, follow_redirects=True)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        signals = []
        # Example: Adjust selectors based on actual changelog structure
        for item in soup.select('.changelog-entry'): # Placeholder selector
            title = item.select_one('h2').get_text(strip=True) if item.select_one('h2') else 'No title'
            content = item.select_one('.changelog-body').get_text(strip=True) if item.select_one('.changelog-body') else 'No content'
            link = url # Codeium changelog entries might not have individual links
            signals.append({
                'competitor': 'Codeium',
                'source': 'changelog',
                'url': link,
                'title': title,
                'content': content
            })
        return signals
    except Exception as e:
        print(f"Error scraping Codeium changelog {url}: {e}")
        return []

def scrape_codeium_reddit(subreddit_name):
    try:
        reddit = get_reddit_instance()
        subreddit = reddit.subreddit(subreddit_name)
        signals = []
        for submission in subreddit.new(limit=10): # Get 10 latest posts
            signals.append({
                'competitor': 'Codeium',
                'source': 'reddit',
                'url': f"https://www.reddit.com{submission.permalink}",
                'title': submission.title,
                'content': submission.selftext or submission.url
            })
        return signals
    except Exception as e:
        print(f"Error scraping Codeium Reddit {subreddit_name}: {e}")
        return []

def scrape_codeium_signals():
    all_signals = []
    with open('config/competitors.yaml', 'r') as f:
        config = yaml.safe_load(f)

    for competitor_config in config['competitors']:
        if competitor_config['name'] == 'Codeium':
            for source in competitor_config['sources']:
                if source['type'] == 'changelog':
                    all_signals.extend(scrape_codeium_changelog(source['url']))
                elif source['type'] == 'reddit':
                    all_signals.extend(scrape_codeium_reddit(source['subreddit']))
    return all_signals

if __name__ == '__main__':
    signals = scrape_codeium_signals()
    for signal in signals:
        print(signal)
