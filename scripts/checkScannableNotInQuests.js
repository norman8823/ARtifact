const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
require("dotenv").config({ path: path.resolve(__dirname, "../seed/.env") });

// Load AWS credentials from .env
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  ARTWORK_TABLE_NAME,
} = process.env;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !ARTWORK_TABLE_NAME
) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

// Configure AWS
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Load quests data
const QUESTS_DATA_PATH = path.join(__dirname, "../seed/json/quests.json");
let quests = [];

try {
  const raw = fs.readFileSync(QUESTS_DATA_PATH, "utf-8");
  quests = JSON.parse(raw);
  console.log(`✅ Loaded ${quests.length} quests from quests.json`);
} catch (err) {
  console.error("❌ Failed to read quests.json:", err.message);
  process.exit(1);
}

// Extract all unique artwork IDs from all quests
const questArtworkIds = new Set();

quests.forEach((quest) => {
  if (quest.requiredArtworks && Array.isArray(quest.requiredArtworks)) {
    quest.requiredArtworks.forEach((artworkId) => {
      questArtworkIds.add(artworkId);
    });
  }
});

console.log(`📊 Total unique artworks in quests: ${questArtworkIds.size}`);

// Function to scan all scannable artworks in the database
const findScannableNotInQuests = async () => {
  console.log("\n🔍 Scanning database for all scannable artworks...\n");
  
  const scannableArtworks = [];
  let lastEvaluatedKey = null;
  
  // Scan the entire table for scannable artworks
  do {
    const params = {
      TableName: ARTWORK_TABLE_NAME,
      FilterExpression: "isScannable = :scannable",
      ExpressionAttributeValues: {
        ":scannable": true,
      },
      ProjectionExpression: "id, title, artistDisplayName, galleryNumber",
    };
    
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    
    try {
      const result = await dynamoDb.scan(params).promise();
      if (result.Items) {
        scannableArtworks.push(...result.Items);
      }
      lastEvaluatedKey = result.LastEvaluatedKey;
    } catch (err) {
      console.error("❌ Error scanning database:", err.message);
      break;
    }
  } while (lastEvaluatedKey);
  
  console.log(`✅ Found ${scannableArtworks.length} scannable artworks in database\n`);
  
  // Find scannable artworks NOT in quests
  const notInQuests = scannableArtworks.filter(
    artwork => !questArtworkIds.has(artwork.id)
  );
  
  console.log("📋 Scannable Artworks NOT in Quests:");
  console.log("=====================================");
  
  if (notInQuests.length === 0) {
    console.log("✅ All scannable artworks are used in quests!");
  } else {
    console.log(`Found ${notInQuests.length} scannable artworks not in any quest:\n`);
    
    notInQuests.forEach((artwork, index) => {
      console.log(`${index + 1}. ID: ${artwork.id}`);
      console.log(`   Title: ${artwork.title || "N/A"}`);
      console.log(`   Artist: ${artwork.artistDisplayName || "N/A"}`);
      console.log(`   Gallery: ${artwork.galleryNumber || "N/A"}`);
      console.log("");
    });
    
    // List just the IDs for easy copying
    console.log("\n📝 IDs only (for easy copying):");
    console.log(notInQuests.map(a => a.id).join(", "));
  }
  
  console.log("\n📊 Summary:");
  console.log(`- Total scannable artworks: ${scannableArtworks.length}`);
  console.log(`- Used in quests: ${scannableArtworks.length - notInQuests.length}`);
  console.log(`- NOT in quests: ${notInQuests.length}`);
};

// Run the check
findScannableNotInQuests().catch((err) => {
  console.error("💥 Script failed:", err);
  process.exit(1);
});