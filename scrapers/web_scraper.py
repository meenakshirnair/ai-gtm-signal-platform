import httpx
from bs4 import BeautifulSoup

def scrape_web_page(competitor_name, source_type, url, tag_filter=None):
    try:
        response = httpx.get(url, follow_redirects=True, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        signals = []
        # Generic selectors - these will likely need refinement per site
        # For changelogs, look for common patterns like div with class 'changelog-item', 'update-card', etc.
        # For blogs, look for 'article', 'blog-post', etc.
        
        # Attempt to find common content blocks
        content_blocks = soup.find_all(['div', 'article', 'section'], class_=['changelog-item', 'update-card', 'blog-post', 'post', 'entry'])
        
        if not content_blocks:
            # Fallback to body content if specific blocks not found
            content_blocks = [soup.find('body')]

        for block in content_blocks:
            if not block:
                continue

            title_element = block.find(['h1', 'h2', 'h3', 'h4', 'a'], class_=['title', 'post-title', 'changelog-title'])
            title = title_element.get_text(strip=True) if title_element else 'No title found'
            
            link_element = block.find('a', href=True)
            link = link_element['href'] if link_element else url
            if not link.startswith('http'):
                link = url.rstrip('/') + '/' + link.lstrip('/')

            content_element = block.find(['p', 'div'], class_=['content', 'post-content', 'changelog-content', 'entry-content'])
            content = content_element.get_text(strip=True) if content_element else block.get_text(strip=True)[:500] # Take first 500 chars as content
            
            if tag_filter and tag_filter.lower() not in (title + content).lower():
                continue

            signals.append({
                'competitor': competitor_name,
                'source': source_type,
                'url': link,
                'title': title,
                'content': content
            })
        return signals
    except httpx.RequestError as e:
        print(f"HTTP Request error scraping {competitor_name} {source_type} from {url}: {e}")
        return []
    except Exception as e:
        print(f"Error scraping {competitor_name} {source_type} from {url}: {e}")
        return []

if __name__ == '__main__':
    # Example usage
    # This will likely return generic content as selectors are placeholders
    print("Scraping Cursor Changelog:")
    cursor_changelog_signals = scrape_web_page("Cursor", "changelog", "https://changelog.cursor.com")
    for s in cursor_changelog_signals:
        print(s)

    print("\nScraping Windsurf Blog:")
    windsurf_blog_signals = scrape_web_page("Windsurf", "blog", "https://codeium.com/blog")
    for s in windsurf_blog_signals:
        print(s)

    print("\nScraping GitHub Blog (Copilot tag):")
    github_copilot_signals = scrape_web_page("GitHub Copilot", "blog_tag", "https://github.blog", tag_filter="copilot")
    for s in github_copilot_signals:
        print(s)
