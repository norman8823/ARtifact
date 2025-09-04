#!/usr/bin/env python3
"""
Extract essential fields from curatedArtworksAdditional.json
Creates a simplified JSON with only objectID, title, objectURL, and description
"""

import json


def main():
    """Extract essential fields from curated artworks"""
    input_file = "/Users/norman/main/ARtifact/seed/json/curatedArtworksAdditional.json"
    output_file = "/Users/norman/main/ARtifact/additionalArtworkDescriptions0903.json"
    
    print("Loading curated artworks...")
    with open(input_file, 'r', encoding='utf-8') as f:
        artworks = json.load(f)
    
    print(f"Loaded {len(artworks)} artworks")
    
    # Extract only the requested fields
    extracted_data = []
    
    for artwork in artworks:
        extracted_artwork = {
            "objectID": artwork.get("id", ""),
            "title": artwork.get("title", ""),
            "objectURL": artwork.get("objectURL", ""),
            "description": artwork.get("description", "")
        }
        extracted_data.append(extracted_artwork)
    
    # Save the extracted data
    print(f"Saving extracted data to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(extracted_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Successfully created {output_file} with {len(extracted_data)} artworks")
    
    # Show a sample of the first few entries
    print("\nSample entries:")
    for i, artwork in enumerate(extracted_data[:3]):
        print(f"\n{i+1}. {artwork['title']} (ID: {artwork['objectID']})")
        print(f"   URL: {artwork['objectURL']}")
        print(f"   Description: {artwork['description'][:100]}...")


if __name__ == "__main__":
    main()