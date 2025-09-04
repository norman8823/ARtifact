#!/usr/bin/env python3
"""
Metropolitan Museum of Art Web Scraper
Scrapes artwork descriptions from Met Museum web pages
"""

import requests
import json
import time
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
import re


class MetScraper:
    """Scraper for the Metropolitan Museum of Art API and web pages"""
    
    BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1"
    WEB_BASE_URL = "https://www.metmuseum.org/art/collection/search"
    
    def __init__(self, delay: float = 2.0):
        """Initialize the scraper with optional delay between requests"""
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def get_object_ids(self, **kwargs) -> List[int]:
        """Get object IDs from the Met collection"""
        url = f"{self.BASE_URL}/objects"
        response = self.session.get(url, params=kwargs)
        response.raise_for_status()
        return response.json().get("objectIDs", [])
    
    def get_object_detail(self, object_id: int) -> Optional[Dict]:
        """Get detailed information for a specific object from API"""
        url = f"{self.BASE_URL}/objects/{object_id}"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException:
            return None
    
    def scrape_web_description(self, object_id: int, debug: bool = False) -> Optional[str]:
        """Scrape description from Met Museum web page"""
        url = f"{self.WEB_BASE_URL}/{object_id}"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            if debug:
                print(f"    Page title: {soup.title.get_text() if soup.title else 'No title'}")
                # Look for all divs with 'description' in class name
                desc_divs = soup.find_all('div', class_=re.compile(r'.*desc.*', re.IGNORECASE))
                print(f"    Found {len(desc_divs)} divs with 'desc' in class name")
                for i, div in enumerate(desc_divs[:3]):  # Show first 3
                    print(f"    Div {i+1} classes: {div.get('class', [])}")
            
            # Look for the specific artwork description div with multiple variations
            selectors_to_try = [
                ('div', {'class': 'artwork__intro-desc js-artwork__intro-desc'}),
                ('div', {'class': 'artwork_intro_desc js-artwork_intro_desc'}),
                ('div', {'class': re.compile(r'artwork.*intro.*desc')}),
                ('div', {'itemprop': 'description'}),
                ('div', {'class': re.compile(r'.*description.*')}),
            ]
            
            for tag, attrs in selectors_to_try:
                description_div = soup.find(tag, attrs)
                if description_div:
                    description = description_div.get_text(strip=True)
                    # Filter out generic collection descriptions
                    if (description and len(description) > 20 and
                        not self._is_generic_description(description)):
                        if debug:
                            print(f"    Found description with {tag}={attrs}: {len(description)} chars")
                        return description
            
            # Try CSS selectors as fallback
            css_selectors = [
                '.artwork__intro-desc',
                '.artwork_intro_desc', 
                'div[itemprop="description"]',
                '.artwork__description',
                '.object-description',
                '.description'
            ]
            
            for selector in css_selectors:
                elements = soup.select(selector)
                for element in elements:
                    text = element.get_text(strip=True)
                    if (text and len(text) > 20 and
                        not self._is_generic_description(text)):
                        if debug:
                            print(f"    Found description with selector {selector}: {len(text)} chars")
                        return text
            
            if debug:
                print("    No description found with any selector")
            
            return None
            
        except requests.exceptions.RequestException as e:
            print(f"Error scraping web page for object {object_id}: {e}")
            return None
    
    def _is_generic_description(self, text: str) -> bool:
        """Check if the text is a generic collection/department description"""
        generic_phrases = [
            'ever-evolving collection',
            'privately assembled art collections',
            'robert lehman collection is one of the most',
            'collecting, preserving, researching, publishing',
            'department of',
            'collection comprises',
            'distinguished privately assembled',
            'bequest to the met'
        ]
        
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in generic_phrases)
    
    def scrape_objects(self, object_ids: List[int], include_web_description: bool = True) -> List[Dict]:
        """Scrape multiple objects with rate limiting"""
        objects = []
        for i, object_id in enumerate(object_ids):
            print(f"Scraping object {i+1}/{len(object_ids)}: {object_id}")
            
            # Get API data first
            obj_data = self.get_object_detail(object_id)
            if obj_data:
                # Add web description if requested
                if include_web_description:
                    print(f"  Fetching web description for object {object_id}...")
                    web_description = self.scrape_web_description(object_id, debug=False)
                    if web_description:
                        obj_data['web_description'] = web_description
                        print(f"  ✓ Found description ({len(web_description)} chars)")
                    else:
                        obj_data['web_description'] = None
                        print(f"  ✗ No description found")
                
                objects.append(obj_data)
            
            # Rate limiting
            if i < len(object_ids) - 1:
                time.sleep(self.delay)
                
        return objects


def main():
    """Example usage of the Met scraper with web descriptions"""
    scraper = MetScraper(delay=2.0)  # Slower delay for web scraping
    
    # Try some specific object IDs that are more likely to have rich descriptions
    # These are popular artworks from the Met collection
    test_object_ids = [436532, 459080, 437133]  # Famous paintings/sculptures
    print(f"Testing with {len(test_object_ids)} specific objects")
    
    # Scrape object details including web descriptions
    objects = scraper.scrape_objects(test_object_ids, include_web_description=True)
    
    # Save to JSON file
    with open("met_objects_with_descriptions.json", "w", encoding='utf-8') as f:
        json.dump(objects, f, indent=2, ensure_ascii=False)
    
    print(f"Scraped {len(objects)} objects with web descriptions and saved to met_objects_with_descriptions.json")
    
    # Print summary of descriptions found
    desc_count = sum(1 for obj in objects if obj.get('web_description'))
    print(f"Successfully scraped descriptions for {desc_count}/{len(objects)} objects")


if __name__ == "__main__":
    main()