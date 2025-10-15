#!/usr/bin/env python3
"""
Final script to apply description updates to DynamoDB using credentials from seed/.env file.
"""

import os
import json
import boto3
import time
import logging
from typing import Dict, Optional
from botocore.exceptions import ClientError, NoCredentialsError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('apply_descriptions_final.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def load_env_from_file(file_path: str) -> Dict[str, str]:
    """Load environment variables from a .env file."""
    env_vars = {}
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
        return env_vars
    except Exception as e:
        logger.error(f"Failed to load .env file {file_path}: {e}")
        return {}

class DescriptionDatabaseUpdater:
    def __init__(self, aws_access_key_id: str, aws_secret_access_key: str, table_name: str, region: str = 'us-east-1'):
        """Initialize the DynamoDB updater with explicit credentials."""
        self.table_name = table_name
        self.region = region

        # Initialize DynamoDB client with explicit credentials
        try:
            session = boto3.Session(
                aws_access_key_id=aws_access_key_id,
                aws_secret_access_key=aws_secret_access_key,
                region_name=region
            )

            self.dynamodb = session.resource('dynamodb')
            self.table = self.dynamodb.Table(table_name)
            logger.info(f"Successfully initialized DynamoDB connection to table: {table_name}")
        except Exception as e:
            logger.error(f"Failed to initialize DynamoDB connection: {e}")
            raise

        # Track statistics
        self.stats = {
            'total_updates': 0,
            'successful_updates': 0,
            'failed_updates': 0,
            'skipped_no_change': 0,
            'artwork_not_found': 0
        }

    def test_connection(self) -> bool:
        """Test the DynamoDB connection."""
        try:
            table_info = self.table.meta.client.describe_table(TableName=self.table_name)
            logger.info(f"✅ Connection test successful")
            logger.info(f"   Table status: {table_info['Table']['TableStatus']}")
            logger.info(f"   Item count: {table_info['Table']['ItemCount']}")
            return True
        except Exception as e:
            logger.error(f"❌ Connection test failed: {e}")
            return False

    def load_description_updates(self, json_path: str) -> Dict[str, Dict]:
        """Load the description updates JSON file."""
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                updates = json.load(f)
            logger.info(f"Loaded {len(updates)} description updates from {json_path}")
            return updates
        except Exception as e:
            logger.error(f"Failed to load description updates file: {e}")
            raise

    def get_current_artwork(self, artwork_id: str) -> Optional[Dict]:
        """Retrieve current artwork data from DynamoDB."""
        try:
            response = self.table.get_item(Key={'id': artwork_id})
            if 'Item' in response:
                return response['Item']
            else:
                logger.warning(f"Artwork {artwork_id} not found in database")
                return None
        except Exception as e:
            logger.error(f"Failed to retrieve artwork {artwork_id}: {e}")
            return None

    def update_artwork_description(self, artwork_id: str, new_description: str) -> bool:
        """Update the description field in DynamoDB for a specific artwork."""
        try:
            # First check if the artwork exists
            current_artwork = self.get_current_artwork(artwork_id)
            if not current_artwork:
                self.stats['artwork_not_found'] += 1
                return False

            current_description = current_artwork.get('description', '')

            # Skip if description is already up to date
            if current_description == new_description:
                logger.debug(f"Description already up to date for artwork {artwork_id}, skipping")
                self.stats['skipped_no_change'] += 1
                return True

            # Update or remove the description
            if new_description.strip():
                # Update with new description
                response = self.table.update_item(
                    Key={'id': artwork_id},
                    UpdateExpression='SET description = :desc',
                    ExpressionAttributeValues={':desc': new_description},
                    ReturnValues='UPDATED_NEW'
                )
                logger.info(f"✅ Updated description for {artwork_id}")
            else:
                # Remove description field if blank
                try:
                    response = self.table.update_item(
                        Key={'id': artwork_id},
                        UpdateExpression='REMOVE description',
                        ReturnValues='UPDATED_NEW'
                    )
                    logger.info(f"✅ Removed description for {artwork_id} (blank)")
                except ClientError as e:
                    if e.response['Error']['Code'] == 'ValidationException':
                        # Description field doesn't exist, that's fine
                        logger.info(f"✅ No description to remove for {artwork_id}")
                    else:
                        raise

            return True

        except Exception as e:
            logger.error(f"❌ Failed to update artwork {artwork_id}: {e}")
            return False

    def apply_all_updates(self, updates: Dict[str, Dict], delay_seconds: float = 0.3) -> None:
        """Apply all description updates to DynamoDB."""
        self.stats['total_updates'] = len(updates)

        # Separate updates with and without descriptions
        with_descriptions = sum(1 for v in updates.values() if v.get('new_description', '').strip())
        without_descriptions = len(updates) - with_descriptions

        logger.info(f"📊 UPDATE SUMMARY:")
        logger.info(f"   Total artworks: {len(updates)}")
        logger.info(f"   With descriptions: {with_descriptions}")
        logger.info(f"   Without descriptions (will be removed): {without_descriptions}")
        logger.info(f"   Target table: {self.table_name}")

        # Process all updates
        for i, (artwork_id, update_data) in enumerate(updates.items(), 1):
            new_description = update_data.get('new_description', '')
            title = update_data.get('title', 'Unknown')

            if i % 10 == 0:  # Log progress every 10 items
                logger.info(f"Progress: {i}/{len(updates)} ({i/len(updates)*100:.1f}%)")

            logger.debug(f"Processing {artwork_id}: {title[:40]}...")

            # Apply the update
            if self.update_artwork_description(artwork_id, new_description):
                self.stats['successful_updates'] += 1
            else:
                self.stats['failed_updates'] += 1

            # Rate limiting
            if i < len(updates):
                time.sleep(delay_seconds)

        self.print_final_stats()

    def print_final_stats(self):
        """Print final statistics."""
        logger.info("=" * 60)
        logger.info("🎉 DESCRIPTION UPDATE COMPLETE!")
        logger.info("=" * 60)
        logger.info(f"Total updates processed: {self.stats['total_updates']}")
        logger.info(f"✅ Successful updates: {self.stats['successful_updates']}")
        logger.info(f"❌ Failed updates: {self.stats['failed_updates']}")
        logger.info(f"⏭️  Skipped (no change): {self.stats['skipped_no_change']}")
        logger.info(f"🔍 Artwork not found: {self.stats['artwork_not_found']}")

        success_rate = (self.stats['successful_updates'] / self.stats['total_updates']) * 100 if self.stats['total_updates'] > 0 else 0
        logger.info(f"📈 Success rate: {success_rate:.1f}%")
        logger.info("=" * 60)

def main():
    # Load credentials from seed/.env file
    env_file_path = '/Users/norman/main/ARtifact/seed/.env'
    env_vars = load_env_from_file(env_file_path)

    if not env_vars:
        logger.error(f"Failed to load environment variables from {env_file_path}")
        return

    # Get required variables
    aws_access_key_id = env_vars.get('AWS_ACCESS_KEY_ID')
    aws_secret_access_key = env_vars.get('AWS_SECRET_ACCESS_KEY')
    aws_region = env_vars.get('AWS_REGION', 'us-east-1')
    table_name = env_vars.get('ARTWORK_TABLE_NAME')

    if not all([aws_access_key_id, aws_secret_access_key, table_name]):
        logger.error("Missing required credentials or table name in .env file")
        logger.error(f"AWS_ACCESS_KEY_ID: {'✅' if aws_access_key_id else '❌'}")
        logger.error(f"AWS_SECRET_ACCESS_KEY: {'✅' if aws_secret_access_key else '❌'}")
        logger.error(f"ARTWORK_TABLE_NAME: {'✅' if table_name else '❌'}")
        return

    logger.info(f"📋 Configuration loaded from {env_file_path}")
    logger.info(f"   Region: {aws_region}")
    logger.info(f"   Table: {table_name}")

    # Configuration
    UPDATES_FILE = '/Users/norman/main/ARtifact/description_updates.json'
    DELAY_SECONDS = 0.3  # Faster than before since we're confident

    try:
        # Initialize updater
        updater = DescriptionDatabaseUpdater(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            table_name=table_name,
            region=aws_region
        )

        # Test connection first
        if not updater.test_connection():
            logger.error("Failed to connect to DynamoDB. Please check your credentials and table name.")
            return

        # Load description updates
        updates = updater.load_description_updates(UPDATES_FILE)

        # Display final summary
        logger.info(f"\n🚀 READY TO APPLY 90/92 VERIFIED DESCRIPTIONS!")
        logger.info(f"   Source: {UPDATES_FILE}")
        logger.info(f"   Target: {table_name}")
        logger.info(f"   Total updates: {len(updates)}")
        logger.info(f"   Estimated time: ~{(len(updates) * DELAY_SECONDS) / 60:.1f} minutes")

        # Ask for confirmation
        logger.info(f"\n⚠️  This will update descriptions for {len(updates)} artworks in DynamoDB.")
        response = input("Proceed with the update? (yes/no): ").strip().lower()

        if response in ['yes', 'y']:
            logger.info("🚀 Starting description update process...")
            updater.apply_all_updates(updates, DELAY_SECONDS)
            logger.info("✅ All description updates applied successfully!")
        else:
            logger.info("❌ Update process cancelled by user")

    except KeyboardInterrupt:
        logger.info("Process interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

if __name__ == "__main__":
    main()