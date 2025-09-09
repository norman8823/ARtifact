#!/usr/bin/env python3
"""
Comprehensive Gallery Checker and Auto-Updater for ARtifact Quest System
Checks Met Museum website for current gallery locations and updates quests.json automatically
"""

import requests
from bs4 import BeautifulSoup
import time
import json
import re
import os
import sys
from datetime import datetime
import argparse
import subprocess

# Quest file path
QUEST_FILE = "/home/norman/main/ARtifact/ARtifact/seed/json/quests.json"
RESULTS_FILE = "/home/norman/main/ARtifact/ARtifact/gallery_check_results.json"

def get_all_quest_artworks():
    """
    Extract all artwork IDs and their current galleries from quests.json
    """
    try:
        with open(QUEST_FILE, 'r') as f:
            quests_data = json.load(f)
        
        artworks = []
        for quest in quests_data:
            if 'requiredArtworks' in quest and 'galleryMap' in quest:
                artwork_ids = quest['requiredArtworks']
                gallery_map = quest['galleryMap']
                
                # Parse gallery numbers from galleryMap string
                current_galleries = re.findall(r'(\d+)', gallery_map)
                
                if len(current_galleries) == len(artwork_ids):
                    for i, artwork_id in enumerate(artwork_ids):
                        artworks.append((artwork_id, current_galleries[i]))
        
        return artworks
    except Exception as e:
        print(f"❌ Error reading quest file: {e}")
        return []

def get_gallery_from_met(artwork_id, retry_count=3):
    """
    Fetch the gallery number from the Met Museum website for a given artwork ID
    """
    url = f"https://www.metmuseum.org/art/collection/search/{artwork_id}"
    
    for attempt in range(retry_count):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            response = requests.get(url, timeout=20, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            page_text = soup.get_text()
            
            # Multiple patterns to find gallery information
            patterns = [
                r'Gallery\s*(\d+)',
                r'On view in Gallery\s*(\d+)',
                r'Currently on view.*?Gallery\s*(\d+)',
                r'Location.*?Gallery\s*(\d+)'
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                if matches:
                    return matches[0]
            
            return "NOT FOUND"
            
        except requests.exceptions.RequestException as e:
            if attempt < retry_count - 1:
                time.sleep(5 * (attempt + 1))  # Exponential backoff
                continue
            return f"ERROR: {str(e)}"
        except Exception as e:
            return f"ERROR: {str(e)}"

def update_quest_galleries(discrepancies):
    """
    Update the gallery numbers in quests.json file based on discrepancies found
    """
    try:
        with open(QUEST_FILE, 'r') as f:
            quests_data = json.load(f)
        
        changes_made = []
        
        for quest in quests_data:
            if 'requiredArtworks' in quest and 'galleryMap' in quest:
                artwork_ids = quest['requiredArtworks']
                gallery_map = quest['galleryMap']
                
                # Parse current gallery numbers from galleryMap
                current_galleries = re.findall(r'(\d+)', gallery_map)
                
                if len(current_galleries) == len(artwork_ids):
                    new_galleries = current_galleries.copy()
                    quest_updated = False
                    
                    # Check each artwork in this quest for updates
                    for i, artwork_id in enumerate(artwork_ids):
                        if artwork_id in discrepancies:
                            old_gallery = current_galleries[i]
                            new_gallery = discrepancies[artwork_id]
                            
                            # Only update if it's a valid gallery number (not error/not found)
                            if new_gallery.isdigit() and old_gallery != new_gallery:
                                new_galleries[i] = new_gallery
                                quest_updated = True
                                changes_made.append({
                                    'quest_id': quest['id'],
                                    'quest_title': quest['title'],
                                    'artwork_id': artwork_id,
                                    'old_gallery': old_gallery,
                                    'new_gallery': new_gallery
                                })
                    
                    # Update the galleryMap if changes were made
                    if quest_updated:
                        quest['galleryMap'] = f"Galleries {', '.join(new_galleries)}"
        
        # Write the updated data back to file if changes were made
        if changes_made:
            # Create backup first
            backup_file = f"{QUEST_FILE}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            with open(backup_file, 'w') as f:
                json.dump(json.load(open(QUEST_FILE, 'r')), f, indent=2)
            
            # Write updated data
            with open(QUEST_FILE, 'w') as f:
                json.dump(quests_data, f, indent=2)
            
            print(f"💾 Backup created: {backup_file}")
        
        return changes_made
        
    except Exception as e:
        print(f"❌ Error updating quest file: {e}")
        return []

def setup_monthly_cron():
    """
    Set up a monthly cron job to run this script automatically
    """
    script_path = os.path.abspath(__file__)
    cron_command = f"0 2 1 * * /usr/bin/python3 {script_path} --auto >> /var/log/gallery_checker.log 2>&1"
    
    try:
        # Check if cron job already exists
        result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
        current_crontab = result.stdout if result.returncode == 0 else ""
        
        if script_path not in current_crontab:
            # Add the new cron job
            new_crontab = current_crontab + f"\n{cron_command}\n"
            
            # Write to temporary file
            with open('/tmp/new_crontab', 'w') as f:
                f.write(new_crontab)
            
            # Install the new crontab
            subprocess.run(['crontab', '/tmp/new_crontab'], check=True)
            os.remove('/tmp/new_crontab')
            
            print("✅ Monthly cron job installed successfully!")
            print(f"   Job: Run on 1st day of each month at 2:00 AM")
            print(f"   Command: {cron_command}")
        else:
            print("✅ Monthly cron job already exists")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error setting up cron job: {e}")
        print("   You may need to run with sudo or set up the cron job manually")
    except Exception as e:
        print(f"❌ Error setting up cron job: {e}")

def main():
    """
    Main function to check galleries and optionally auto-update
    """
    parser = argparse.ArgumentParser(description='Gallery Checker and Auto-Updater for ARtifact')
    parser.add_argument('--auto', action='store_true', help='Automatically update discrepancies without prompting')
    parser.add_argument('--setup-cron', action='store_true', help='Set up monthly cron job')
    parser.add_argument('--dry-run', action='store_true', help='Check only, do not update files')
    
    args = parser.parse_args()
    
    if args.setup_cron:
        setup_monthly_cron()
        return
    
    print("🔍 ARtifact Gallery Checker & Auto-Updater")
    print("=" * 60)
    print(f"⏰ Check started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Get all artworks from current quest file
    artworks = get_all_quest_artworks()
    
    if not artworks:
        print("❌ No artworks found in quest file")
        return
    
    print(f"📋 Checking {len(artworks)} artworks...")
    
    discrepancies = {}
    correct_count = 0
    errors = {}
    
    for i, (artwork_id, current_gallery) in enumerate(artworks, 1):
        print(f"Checking {i:2d}/{len(artworks)}: Artwork {artwork_id}... ", end="", flush=True)
        
        actual_gallery = get_gallery_from_met(artwork_id)
        
        if actual_gallery.startswith("ERROR") or actual_gallery == "NOT FOUND":
            print(f"❌ {actual_gallery}")
            errors[artwork_id] = actual_gallery
        elif actual_gallery != current_gallery:
            print(f"🚨 MISMATCH: Current={current_gallery}, Actual={actual_gallery}")
            discrepancies[artwork_id] = actual_gallery
        else:
            print(f"✅ Correct (Gallery {actual_gallery})")
            correct_count += 1
        
        # Be respectful to the server
        time.sleep(2)
    
    print("\n" + "=" * 60)
    print(f"📊 SUMMARY:")
    print(f"   ✅ Correct: {correct_count}/{len(artworks)}")
    print(f"   🚨 Discrepancies: {len(discrepancies)}")
    print(f"   ❌ Errors: {len(errors)}")
    
    # Handle discrepancies
    if discrepancies and not args.dry_run:
        print(f"\n🔧 DISCREPANCIES FOUND:")
        for artwork_id, new_gallery in discrepancies.items():
            print(f"   Artwork {artwork_id}: Gallery ? → {new_gallery}")
        
        if args.auto:
            update_galleries = True
            print(f"\n🤖 Auto-update mode: Updating galleries automatically...")
        else:
            response = input(f"\n❓ Update {len(discrepancies)} gallery numbers automatically? (y/N): ")
            update_galleries = response.lower().startswith('y')
        
        if update_galleries:
            changes_made = update_quest_galleries(discrepancies)
            
            if changes_made:
                print(f"\n✅ Successfully updated {len(changes_made)} gallery numbers:")
                for change in changes_made:
                    print(f"   {change['quest_title']}: Artwork {change['artwork_id']} "
                          f"(Gallery {change['old_gallery']} → {change['new_gallery']})")
            else:
                print("\n❌ No changes were applied")
        else:
            print("\n⏭️  Skipping updates")
    
    elif discrepancies and args.dry_run:
        print(f"\n🔍 DRY RUN - Would update {len(discrepancies)} galleries:")
        for artwork_id, new_gallery in discrepancies.items():
            print(f"   Artwork {artwork_id}: → Gallery {new_gallery}")
    
    elif not discrepancies:
        print("\n✅ All galleries are up to date!")
    
    # Save results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_checked": len(artworks),
        "correct_count": correct_count,
        "discrepancies_found": discrepancies,
        "errors": errors,
        "changes_made": update_quest_galleries(discrepancies) if discrepancies and not args.dry_run else []
    }
    
    with open(RESULTS_FILE, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: {RESULTS_FILE}")
    print(f"⏰ Check completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()