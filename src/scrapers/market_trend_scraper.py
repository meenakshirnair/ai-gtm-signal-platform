"""
Market trend scraper module for collecting data from industry sources.
"""

import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime
from typing import List, Dict
import json

logger = logging.getLogger(__name__)


class MarketTrendScraper:
    """Scraper for market trends from various industry sources."""

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def scrape_reddit(self, subreddit: str, limit: int = 10) -> List[Dict]:
        """
        Scrape recent posts from a specific subreddit.

        Args:
            subreddit: Subreddit name (e.g., 'MachineLearning')
            limit: Number of posts to scrape

        Returns:
            List of Reddit posts with title, content, and metadata
        """
        try:
            # Using Reddit's JSON endpoint (no authentication required for public data)
            url = f"https://www.reddit.com/r/{subreddit}/new.json"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()

            data = response.json()
            posts = []

            for post in data['data']['children'][:limit]:
                post_data = post['data']
                posts.append({
                    'title': post_data.get('title'),
                    'content': post_data.get('selftext'),
                    'url': f"https://reddit.com{post_data.get('permalink')}",
                    'upvotes': post_data.get('ups'),
                    'comments': post_data.get('num_comments'),
                    'created_at': datetime.fromtimestamp(post_data.get('created_utc')).isoformat(),
                    'source': 'reddit',
                    'subreddit': subreddit,
                    'scraped_at': datetime.utcnow().isoformat()
                })

            logger.info(f"Successfully scraped {len(posts)} posts from r/{subreddit}")
            return posts

        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping Reddit subreddit r/{subreddit}: {str(e)}")
            return []

    def scrape_hacker_news(self, limit: int = 10) -> List[Dict]:
        """
        Scrape recent posts from Hacker News.

        Args:
            limit: Number of posts to scrape

        Returns:
            List of Hacker News posts
        """
        try:
            url = "https://news.ycombinator.com/newest"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            posts = []
            rows = soup.find_all('tr', class_='athing')[:limit]

            for row in rows:
                title_cell = row.find('span', class_='titleline')
                if not title_cell:
                    continue

                title = title_cell.get_text(strip=True)
                link = title_cell.find('a')
                url = link['href'] if link else 'N/A'

                posts.append({
                    'title': title,
                    'url': url,
                    'source': 'hackernews',
                    'scraped_at': datetime.utcnow().isoformat()
                })

            logger.info(f"Successfully scraped {len(posts)} posts from Hacker News")
            return posts

        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping Hacker News: {str(e)}")
            return []

    def scrape_news_api(self, query: str, api_key: str, limit: int = 10) -> List[Dict]:
        """
        Scrape news articles using NewsAPI (requires API key).

        Args:
            query: Search query for news
            api_key: NewsAPI API key
            limit: Number of articles to retrieve

        Returns:
            List of news articles
        """
        try:
            url = "https://newsapi.org/v2/everything"
            params = {
                'q': query,
                'sortBy': 'publishedAt',
                'language': 'en',
                'pageSize': limit,
                'apiKey': api_key
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            articles = []

            for article in data.get('articles', []):
                articles.append({
                    'title': article.get('title'),
                    'description': article.get('description'),
                    'url': article.get('url'),
                    'source': article.get('source', {}).get('name'),
                    'published_at': article.get('publishedAt'),
                    'source_type': 'newsapi',
                    'scraped_at': datetime.utcnow().isoformat()
                })

            logger.info(f"Successfully scraped {len(articles)} news articles for query: {query}")
            return articles

        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping news for query '{query}': {str(e)}")
            return []

    def scrape_dev_community(self, tag: str, limit: int = 10) -> List[Dict]:
        """
        Scrape posts from Dev.to community.

        Args:
            tag: Tag to search for (e.g., 'ai', 'machinelearning')
            limit: Number of posts to scrape

        Returns:
            List of Dev.to posts
        """
        try:
            url = "https://dev.to/api/articles"
            params = {
                'tag': tag,
                'per_page': limit,
                'sort': 'latest'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            articles = []
            for article in response.json():
                articles.append({
                    'title': article.get('title'),
                    'description': article.get('description'),
                    'url': article.get('url'),
                    'author': article.get('user', {}).get('name'),
                    'published_at': article.get('published_at'),
                    'tags': article.get('tag_list'),
                    'source': 'dev.to',
                    'scraped_at': datetime.utcnow().isoformat()
                })

            logger.info(f"Successfully scraped {len(articles)} posts from Dev.to with tag: {tag}")
            return articles

        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping Dev.to for tag '{tag}': {str(e)}")
            return []

    def scrape_all_sources(self, config: Dict) -> Dict:
        """
        Scrape all configured market trend sources.

        Args:
            config: Configuration dictionary with source settings

        Returns:
            Dictionary with all scraped market trend data
        """
        all_data = {
            'reddit': [],
            'hackernews': [],
            'news': [],
            'devto': [],
            'scraped_at': datetime.utcnow().isoformat()
        }

        # Scrape Reddit
        if config.get('reddit_subreddits'):
            for subreddit in config['reddit_subreddits']:
                all_data['reddit'].extend(self.scrape_reddit(subreddit, limit=5))

        # Scrape Hacker News
        if config.get('scrape_hackernews'):
            all_data['hackernews'] = self.scrape_hacker_news(limit=10)

        # Scrape Dev.to
        if config.get('devto_tags'):
            for tag in config['devto_tags']:
                all_data['devto'].extend(self.scrape_dev_community(tag, limit=5))

        return all_data
