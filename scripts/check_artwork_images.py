#!/usr/bin/env python3
"""
Artwork Image Checker

This script checks the artwork image availability for specific quest artworks.
It compares what's in the database vs what's available from the Met API.

Usage:
    python3 scripts/check_artwork_images.py
"""

import json
import requests
import time
import logging
from typing import Dict, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ArtworkImageChecker:
    def __init__(self):
        self.base_url = "https://collectionapi.metmuseum.org/public/collection/v1/objects/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })

    def check_artwork_images(self, artwork_ids: List[str]) -> Dict[str, Dict]:
        """Check image availability for given artwork IDs."""
        results = {}

        for artwork_id in artwork_ids:
            logger.info(f"Checking artwork {artwork_id}...")

            try:
                response = self.session.get(f"{self.base_url}{artwork_id}")
                if response.status_code == 200:
                    data = response.json()

                    results[artwork_id] = {
                        'title': data.get('title', 'No title'),
                        'primaryImage': data.get('primaryImage'),
                        'primaryImageSmall': data.get('primaryImageSmall'),
                        'additionalImages': data.get('additionalImages', []),
                        'hasImages': bool(data.get('primaryImage') or data.get('additionalImages')),
                        'objectURL': data.get('objectURL'),
                        'isPublicDomain': data.get('isPublicDomain', False)
                    }

                    # Log the status
                    if results[artwork_id]['primaryImageSmall']:
                        logger.info(f"✅ {artwork_id}: Has primaryImageSmall")
                    elif results[artwork_id]['primaryImage']:
                        logger.info(f"⚠️  {artwork_id}: Has primaryImage but no primaryImageSmall")
                    elif results[artwork_id]['additionalImages']:
                        logger.info(f"⚠️  {artwork_id}: Has additional images but no primary")
                    else:
                        logger.info(f"❌ {artwork_id}: No images available")

                else:
                    logger.error(f"Failed to fetch {artwork_id}: {response.status_code}")
                    results[artwork_id] = {'error': f"HTTP {response.status_code}"}

            except Exception as e:
                logger.error(f"Error checking {artwork_id}: {e}")
                results[artwork_id] = {'error': str(e)}

            # Be nice to the API
            time.sleep(0.5)

        return results

    def save_results(self, results: Dict, filename: str = "artwork_image_check.json"):
        """Save results to JSON file."""
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        logger.info(f"Results saved to {filename}")

def main():
    """Main function."""
    # Artwork IDs from the problematic quests
    bronze_legacy_ids = ["247117", "252958", "246701"]
    marble_legends_ids = ["247000", "255973", "204758", "11952"]
    renaissance_masterpieces_ids = ["437372", "437261", "459016", "459062", "459072"]

    all_artwork_ids = bronze_legacy_ids + marble_legends_ids + renaissance_masterpieces_ids

    logger.info(f"Checking {len(all_artwork_ids)} artworks from Bronze Legacy, Marble Legends, and Renaissance Masterpieces quests...")

    checker = ArtworkImageChecker()
    results = checker.check_artwork_images(all_artwork_ids)

    # Print summary
    logger.info("\n" + "="*60)
    logger.info("SUMMARY:")
    logger.info("="*60)

    has_small = 0
    has_primary_only = 0
    has_additional_only = 0
    no_images = 0
    errors = 0

    for artwork_id, data in results.items():
        if 'error' in data:
            errors += 1
        elif data.get('primaryImageSmall'):
            has_small += 1
        elif data.get('primaryImage'):
            has_primary_only += 1
        elif data.get('additionalImages'):
            has_additional_only += 1
        else:
            no_images += 1

    logger.info(f"✅ Has primaryImageSmall: {has_small}")
    logger.info(f"⚠️  Has primaryImage only: {has_primary_only}")
    logger.info(f"⚠️  Has additional images only: {has_additional_only}")
    logger.info(f"❌ No images: {no_images}")
    logger.info(f"🚫 Errors: {errors}")

    # Save detailed results
    checker.save_results(results)

    # Generate update suggestions
    logger.info("\n" + "="*60)
    logger.info("UPDATE SUGGESTIONS:")
    logger.info("="*60)

    for artwork_id, data in results.items():
        if 'error' not in data and not data.get('primaryImageSmall'):
            if data.get('primaryImage'):
                logger.info(f"📝 {artwork_id}: Could use primaryImage as primaryImageSmall")
            elif data.get('additionalImages'):
                logger.info(f"📝 {artwork_id}: Could use first additional image as primaryImageSmall")

if __name__ == "__main__":
    main()