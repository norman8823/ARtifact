#!/usr/bin/env python3
"""
Comprehensive Met Museum Artwork Description Scraper

This script reliably extracts clean, accurate artwork descriptions from Met Museum pages.

Key Features:
- Uses itemprop="description" for structured data extraction
- Advanced paragraph scoring and filtering
- Comprehensive metadata cleaning
- Multiple fallback strategies
- Removes provenance, exhibition history, and audio controls
- Preserves only actual artwork descriptions

Usage:
    python3 comprehensive_met_scraper.py input.json output.json

Where input.json contains artwork data with 'url' and 'title' fields.
"""

import json
import time
import re
import requests
from bs4 import BeautifulSoup
import logging
import sys
from typing import Dict, List, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('met_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ComprehensiveMetScraper:
    """Comprehensive Met Museum artwork description scraper."""

    def __init__(self, delay_seconds: float = 2.0):
        """Initialize the scraper."""
        self.delay_seconds = delay_seconds
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

        # Patterns to identify and remove unwanted content
        self.unwanted_patterns = [
            # Audio and media controls
            r'you must join the virtual exhibition queue.*?day.*?',
            r'your browser doesn\'t support html5.*?',
            r'this image cannot be enlarged.*?',
            r'skip backwards.*?skip forwards.*?',
            r'view transcript.*?',
            r'experts illuminate.*?',
            r'here is a link to download.*?audio.*?',
            r'listen.*?to experts.*?',
            r'audio.*?transcript.*?',
            r'0:00.*?',
            r'#\d+\..*?',

            # Met policy and access info
            r'as part of the met\'s open access policy.*?',
            r'public domain data for this object.*?',
            r'open access data and public domain images.*?',
            r'the met collection api.*?',
            r'the met\'s libraries and research centers.*?',

            # Navigation and UI elements
            r'the collection the american wing.*?',
            r'related artworks.*?all related artworks.*?',
            r'in the same gallery.*?',
            r'buy a print.*?',
            r'custom framed.*?',
            r'view more.*?',

            # Scroll instructions
            r'this artwork is meant to be viewed from right to left.*?scroll.*?',
        ]

        # Patterns that indicate good artwork descriptions
        self.good_description_patterns = [
            r'^this (painting|sculpture|work|artwork|piece|ivory|colossal|monumental)',
            r'^(standing|depicting|representing|created|made|carved|painted)',
            r'^born into',
            r'^nestled in',
            r'^flayed alive',
            r'^from the ninth to the seventh century',
            r'^in \d{4}, (monet|van gogh|rembrandt)',
            r'^(monet|van gogh|rembrandt|bourdelle) (spent|produced|was)',
            r'^(herakles|perseus|apollo) is seen',
            r'^the (artist|sculptor|painting)',
            r'^a (frileuse|marble|bronze)',
            r'^(during|throughout) the',
        ]

        # Words that indicate artwork descriptions vs metadata
        self.artwork_description_indicators = [
            'depicts', 'shows', 'represents', 'portrays', 'illustrates',
            'created', 'made', 'carved', 'painted', 'sculpted', 'fashioned',
            'artist', 'artwork', 'painting', 'sculpture', 'work', 'piece',
            'masterpiece', 'composition', 'technique', 'style',
            'century', 'period', 'renaissance', 'baroque', 'neoclassical',
            'marble', 'bronze', 'oil', 'canvas', 'ivory', 'wood',
            'standing', 'seated', 'reclining', 'figure', 'portrait',
            'landscape', 'still life', 'scene', 'subject', 'model'
        ]

        # Patterns that indicate provenance/exhibition history (to remove)
        self.provenance_patterns = [
            r'purchase[,:].*?\d{4}',
            r'gift of.*?\d{4}',
            r'bequest of.*?\d{4}',
            r'rogers fund.*?\d{4}',
            r'harris brisbane dick fund.*?\d{4}',
            r'acquired.*?\d{4}',
            r'collection of.*?\d{4}',
            r'formerly in.*?collection',
            r'provenance:.*?',
            r'exhibition history:.*?',
            r'"[^"]*museum[^"]*"\s*\d{4}',
            r'the metropolitan museum of art.*?\d{4}.*?\d{4}',
        ]

    def is_unwanted_content(self, text: str) -> bool:
        """Check if text contains unwanted content patterns."""
        text_lower = text.lower()

        # Check for unwanted patterns
        for pattern in self.unwanted_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE | re.DOTALL):
                return True

        return False

    def is_provenance_or_exhibition(self, text: str) -> bool:
        """Check if text is primarily provenance or exhibition data."""
        text_lower = text.lower()

        # Check for high concentration of provenance indicators
        provenance_count = 0
        for pattern in self.provenance_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                provenance_count += 1

        # If multiple provenance indicators, likely not an artwork description
        if provenance_count >= 2:
            return True

        # Check if text is primarily quoted exhibition titles
        quote_count = text.count('"')
        if quote_count >= 6:  # Multiple quoted exhibition titles
            return True

        # Check for high concentration of museum/date references
        museum_date_matches = re.findall(r'(museum|gallery).*?\d{4}', text_lower)
        if len(museum_date_matches) >= 3:
            return True

        return False

    def score_paragraph_as_description(self, text: str, artwork_title: str = "") -> int:
        """Score a paragraph's likelihood of being an artwork description."""
        if len(text) < 50:
            return 0

        text_lower = text.lower()
        score = 0

        # Check for good description pattern starters
        for pattern in self.good_description_patterns:
            if re.match(pattern, text_lower):
                score += 10
                break

        # Score based on artwork description indicators
        indicator_count = sum(1 for word in self.artwork_description_indicators
                            if word in text_lower)
        score += indicator_count * 2

        # Bonus for appropriate length
        if 150 <= len(text) <= 2000:
            score += 5
        elif 100 <= len(text) <= 3000:
            score += 3

        # Penalty for unwanted content
        if self.is_unwanted_content(text):
            score -= 20

        # Penalty for provenance/exhibition content
        if self.is_provenance_or_exhibition(text):
            score -= 15

        # Bonus for artwork-specific content
        if artwork_title:
            title_words = artwork_title.lower().split()
            title_matches = sum(1 for word in title_words if word in text_lower)
            if title_matches >= 2:
                score += 3

        return max(0, score)

    def extract_description_itemprop(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract description using itemprop='description' method."""
        itemprop_desc = soup.find(attrs={'itemprop': 'description'})
        if not itemprop_desc:
            return None

        # Look for p tags within the itemprop element
        if itemprop_desc.name == 'p':
            text = itemprop_desc.get_text().strip()
            if len(text) > 50 and not self.is_unwanted_content(text):
                return text
        else:
            p_tags = itemprop_desc.find_all('p')
            for p in p_tags:
                text = p.get_text().strip()
                if len(text) > 50 and not self.is_unwanted_content(text):
                    return text

        return None

    def extract_description_paragraph_scoring(self, soup: BeautifulSoup, artwork_title: str = "") -> Optional[str]:
        """Extract description using paragraph scoring method."""
        all_paragraphs = soup.find_all('p')

        best_description = ""
        best_score = 0

        for p in all_paragraphs:
            text = p.get_text().strip()
            score = self.score_paragraph_as_description(text, artwork_title)

            if score > best_score and score >= 8:  # Minimum threshold
                best_score = score
                best_description = text

        return best_description if best_description else None

    def extract_description_longest_substantial(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract description by finding longest substantial paragraph."""
        all_paragraphs = soup.find_all('p')

        substantial_paragraphs = []
        for p in all_paragraphs:
            text = p.get_text().strip()
            if (len(text) >= 200 and
                not self.is_unwanted_content(text) and
                not self.is_provenance_or_exhibition(text)):
                substantial_paragraphs.append(text)

        if substantial_paragraphs:
            # Return the longest one
            return max(substantial_paragraphs, key=len)

        return None

    def clean_description(self, description: str) -> str:
        """Clean and normalize the extracted description."""
        if not description:
            return ""

        # Basic whitespace normalization
        description = description.replace('\r\n', '\n').replace('\r', '\n')
        description = ' '.join(description.split())
        description = description.strip()

        # Remove HTML tags if any
        description = re.sub(r'<[^>]+>', '', description)

        # Remove common metadata prefixes
        prefixes_to_remove = [
            'The Metropolitan Museum of Art, New York. ',
            'The Met Collection. ',
            'Artwork description: ',
            'Description: ',
            'Object description: ',
        ]

        for prefix in prefixes_to_remove:
            if description.startswith(prefix):
                description = description[len(prefix):].strip()

        # Remove attribution quotes at the end (like expert quotes)
        # Only remove if it's clearly an attribution at the end, not part of the description
        if '"' in description and description.count('"') >= 2:
            # Check if there's a quote section at the very end that looks like attribution
            lines = description.split('\n')
            if len(lines) > 1:
                last_line = lines[-1].strip()
                if (last_line.startswith('"') and
                    any(indicator in last_line.lower() for indicator in ['said', 'curator', 'historian', 'expert', 'scholar'])):
                    # Remove only the attribution line
                    description = '\n'.join(lines[:-1]).strip()
            else:
                # For single-line text, be more careful about quote removal
                # Only remove if the quote is clearly at the end and seems like attribution
                last_quote_pos = description.rfind('"')
                if last_quote_pos > len(description) * 0.8:  # Quote is in last 20% of text
                    quote_content = description[last_quote_pos:].lower()
                    if any(indicator in quote_content for indicator in ['said', 'curator', 'historian', 'expert']):
                        description = description[:last_quote_pos].strip()
                        if description.endswith('.'):
                            pass  # Keep it as is
                        else:
                            description += '.'

        # Remove provenance text at the end
        provenance_endings = [
            'Purchase,',
            'Gift of',
            'Bequest of',
            'Rogers Fund',
            'Harris Brisbane Dick Fund',
        ]

        for ending in provenance_endings:
            if ending in description:
                parts = description.split(ending, 1)
                if len(parts) > 1:
                    before_prov = parts[0].strip()
                    if len(before_prov) > 100 and before_prov.endswith('.'):
                        description = before_prov

        # Ensure proper ending punctuation
        if description and not description.endswith(('.', '!', '?')):
            description += '.'

        return description

    def extract_artwork_description(self, url: str, artwork_title: str = "", artwork_id: str = "") -> str:
        """Extract artwork description using all available methods."""
        try:
            logger.info(f"Scraping artwork {artwork_id}: {url}")
            response = self.session.get(url, timeout=20)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Strategy 1: Try itemprop="description" (most reliable)
            description = self.extract_description_itemprop(soup)
            if description:
                logger.info(f"✅ Found via itemprop for {artwork_id}")
                return self.clean_description(description)

            # Strategy 2: Try paragraph scoring (comprehensive)
            description = self.extract_description_paragraph_scoring(soup, artwork_title)
            if description:
                logger.info(f"✅ Found via paragraph scoring for {artwork_id}")
                return self.clean_description(description)

            # Strategy 3: Try longest substantial paragraph (fallback)
            description = self.extract_description_longest_substantial(soup)
            if description:
                logger.info(f"✅ Found via longest substantial for {artwork_id}")
                return self.clean_description(description)

            logger.warning(f"❌ No description found for {artwork_id}: {artwork_title}")
            return ""

        except requests.RequestException as e:
            logger.error(f"❌ Request failed for {artwork_id}: {e}")
            return ""
        except Exception as e:
            logger.error(f"❌ Error scraping {artwork_id}: {e}")
            return ""

    def scrape_all_artworks(self, artworks: Dict[str, Dict]) -> Dict[str, Dict]:
        """Scrape descriptions for all artworks."""
        total_count = len(artworks)
        success_count = 0
        failed_count = 0

        logger.info(f"🚀 Starting comprehensive scraping for {total_count} artworks")

        results = {}

        for i, (artwork_id, artwork_data) in enumerate(artworks.items(), 1):
            url = artwork_data.get('url')
            title = artwork_data.get('title', 'Unknown')

            if not url:
                logger.warning(f"No URL for artwork {artwork_id}, skipping")
                results[artwork_id] = artwork_data.copy()
                results[artwork_id]['new_description'] = ""
                failed_count += 1
                continue

            logger.info(f"Processing {i}/{total_count}: {artwork_id} - {title[:50]}...")

            # Add delay to respect rate limiting
            if i > 1:
                time.sleep(self.delay_seconds)

            # Extract description
            description = self.extract_artwork_description(url, title, artwork_id)

            # Store result
            results[artwork_id] = artwork_data.copy()
            results[artwork_id]['new_description'] = description

            if description and len(description) > 50:
                success_count += 1
                logger.info(f"   Length: {len(description)} chars")
                logger.info(f"   Preview: {description[:100]}...")
            else:
                failed_count += 1

        # Print final statistics
        success_rate = (success_count / total_count) * 100
        logger.info("=" * 60)
        logger.info("🎉 SCRAPING COMPLETE!")
        logger.info("=" * 60)
        logger.info(f"Total artworks: {total_count}")
        logger.info(f"✅ Successful extractions: {success_count}")
        logger.info(f"❌ Failed extractions: {failed_count}")
        logger.info(f"📈 Success rate: {success_rate:.1f}%")
        logger.info("=" * 60)

        return results

def main():
    """Main function to run the scraper."""
    if len(sys.argv) != 3:
        print("Usage: python3 comprehensive_met_scraper.py input.json output.json")
        print("\nInput JSON should contain artwork objects with 'url' and 'title' fields.")
        print("Example structure:")
        print('{')
        print('  "12345": {')
        print('    "title": "Artwork Title",')
        print('    "url": "https://www.metmuseum.org/art/collection/search/12345",')
        print('    "artist": "Artist Name"')
        print('  }')
        print('}')
        return

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        # Load input data
        with open(input_file, 'r', encoding='utf-8') as f:
            artworks = json.load(f)

        logger.info(f"Loaded {len(artworks)} artworks from {input_file}")

        # Initialize scraper
        scraper = ComprehensiveMetScraper(delay_seconds=2.0)

        # Scrape all descriptions
        results = scraper.scrape_all_artworks(artworks)

        # Save results
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        logger.info(f"✅ Results saved to {output_file}")

    except FileNotFoundError:
        logger.error(f"Input file {input_file} not found")
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in input file {input_file}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

if __name__ == "__main__":
    main()