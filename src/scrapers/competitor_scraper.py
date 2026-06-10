"""
Competitor scraper module for collecting data from competitor sources.
"""

import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime
from typing import List, Dict, Optional
import json

logger = logging.getLogger(__name__)


class CompetitorScraper:
    """Scraper for competitor data from various sources."""

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def scrape_changelog(self, changelog_url: str) -> List[Dict]:
        """
        Scrape competitor changelog.

        Args:
            changelog_url: URL of the competitor's changelog

        Returns:
            List of changelog entries with title, content, and date
        """
        try:
            response = requests.get(changelog_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            entries = []
            # Generic parsing - adjust selectors based on actual changelog structure
            changelog_items = soup.find_all(['article', 'div'], class_=['changelog-item', 'entry', 'post'])

            for item in changelog_items[:10]:  # Limit to 10 most recent
                entry = {
                    'title': item.find(['h2', 'h3', 'h4']),
                    'content': item.find(['p', 'div'], class_=['content', 'description']),
                    'date': item.find(['time', 'span'], class_=['date', 'timestamp']),
                    'source_url': changelog_url,
                    'scraped_at': datetime.utcnow().isoformat()
                }
                # Extract text if elements found
                entry['title'] = entry['title'].get_text(strip=True) if entry['title'] else 'N/A'
                entry['content'] = entry['content'].get_text(strip=True) if entry['content'] else 'N/A'
                entry['date'] = entry['date'].get_text(strip=True) if entry['date'] else 'N/A'

                entries.append(entry)

            logger.info(f"Successfully scraped {len(entries)} changelog entries from {changelog_url}")
            return entries

        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping changelog from {changelog_url}: {str(e)}")
            return []

    def scrape_blog(self, blog_url: str) -> List[Dict]:
        """
        Scrape competitor blog posts.

        Args:
            blog_url: URL of the competitor's blog

        Returns:
            List of blog posts with title, excerpt, and date
        """
        try:
            response = requests.get(blog_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            posts = []
            # Generic parsing - adjust selectors based on actual blog structure
            blog_items = soup.find_all(['article', 'div'], class_=['post', 'blog-post', 'entry'])

            for item in blog_items[:10]:  # Limit to 10 most recent
                post = {
                    'title': item.find(['h2', 'h3', 'a'], class_=['title', 'post-title']),
                    'excerpt': item.find(['p', 'div'], class_=['excerpt', 'summary']),
                    'date': item.find(['time', 'span'], class_=['date', 'published']),
                    'link': item.find('a', href=True),
                    'source_url': blog_url,
                    'scraped_at': datetime.utcnow().isoformat()
                }
                # Extract text and attributes
                post['title'] = post['title'].get_text(strip=True) if post['title'] else 'N/A'
                post['excerpt'] = post['excerpt'].get_text(strip=True) if post['excerpt'] else 'N/A'
                post['date'] = post['date'].get_text(strip=True) if post['date'] else 'N/A'
                post['link'] = post['link']['href'] if post['link'] else 'N/A'

                posts.append(post)

            logger.info(f"Successfully scraped {len(posts)} blog posts from {blog_url}")
            return posts

        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping blog from {blog_url}: {str(e)}")
            return []

    def scrape_website(self, website_url: str) -> Dict:
        """
        Scrape general information from competitor website.

        Args:
            website_url: URL of the competitor's website

        Returns:
            Dictionary with website metadata
        """
        try:
            response = requests.get(website_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract metadata
            title = soup.find('title')
            meta_description = soup.find('meta', attrs={'name': 'description'})
            pricing_section = soup.find(['section', 'div'], class_=['pricing', 'plans'])

            website_data = {
                'title': title.get_text(strip=True) if title else 'N/A',
                'description': meta_description['content'] if meta_description else 'N/A',
                'has_pricing': pricing_section is not None,
                'source_url': website_url,
                'scraped_at': datetime.utcnow().isoformat()
            }

            logger.info(f"Successfully scraped website metadata from {website_url}")
            return website_data

        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping website from {website_url}: {str(e)}")
            return {}

    def scrape_all_sources(self, competitor_data: Dict) -> Dict:
        """
        Scrape all available sources for a competitor.

        Args:
            competitor_data: Dictionary with competitor URLs

        Returns:
            Dictionary with all scraped data
        """
        all_data = {
            'competitor_name': competitor_data.get('name'),
            'changelog': [],
            'blog': [],
            'website': {},
            'scraped_at': datetime.utcnow().isoformat()
        }

        if competitor_data.get('changelog_url'):
            all_data['changelog'] = self.scrape_changelog(competitor_data['changelog_url'])

        if competitor_data.get('blog_url'):
            all_data['blog'] = self.scrape_blog(competitor_data['blog_url'])

        if competitor_data.get('website'):
            all_data['website'] = self.scrape_website(competitor_data['website'])

        return all_data
