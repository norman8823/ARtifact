const fs = require("fs");
const path = require("path");
const { generateClient } = require("aws-amplify/api");
const { Amplify } = require("aws-amplify");
require("dotenv").config({ path: path.resolve(__dirname, "../seed/.env") });

// Configure Amplify (you'll need amplify_outputs.json or awsconfig.js)
// For this script, we'll use a simpler approach with direct GraphQL calls

// For now, let's use the aws-sdk approach but install it first
const AWS = require("aws-sdk");

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
  console.error("Make sure your .env file contains:");
  console.error("- AWS_ACCESS_KEY_ID");
  console.error("- AWS_SECRET_ACCESS_KEY");
  console.error("- AWS_REGION");
  console.error("- ARTWORK_TABLE_NAME");
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
const allArtworkIds = new Set();

quests.forEach((quest) => {
  if (quest.requiredArtworks && Array.isArray(quest.requiredArtworks)) {
    quest.requiredArtworks.forEach((artworkId) => {
      allArtworkIds.add(artworkId);
    });
    console.log(`Quest "${quest.title}": ${quest.requiredArtworks.length} artworks`);
  }
});

const uniqueArtworkIds = Array.from(allArtworkIds);
console.log(`\n📊 Total unique artworks across all quests: ${uniqueArtworkIds.length}`);
console.log("Artwork IDs:", uniqueArtworkIds.join(", "));

// Function to update artwork's isScannable field
const updateArtworkScannable = async (artworkId) => {
  const params = {
    TableName: ARTWORK_TABLE_NAME,
    Key: {
      id: artworkId,
    },
    UpdateExpression: "SET isScannable = :isScannable, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":isScannable": true,
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const result = await dynamoDb.update(params).promise();
    console.log(`✅ Updated artwork ${artworkId}: isScannable = true`);
    return true;
  } catch (err) {
    if (err.code === "ResourceNotFoundException") {
      console.log(`⚠️  Artwork ${artworkId} not found in database`);
    } else {
      console.error(`❌ Failed to update artwork ${artworkId}:`, err.message);
    }
    return false;
  }
};

// Update all quest artworks
const updateAllQuestArtworks = async () => {
  console.log("\n🚀 Starting to update artwork isScannable fields...\n");
  
  let successCount = 0;
  let failureCount = 0;

  for (const artworkId of uniqueArtworkIds) {
    const success = await updateArtworkScannable(artworkId);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Small delay to avoid overwhelming DynamoDB
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log("\n📈 Update Summary:");
  console.log(`✅ Successfully updated: ${successCount} artworks`);
  console.log(`❌ Failed to update: ${failureCount} artworks`);
  console.log(`📊 Total processed: ${uniqueArtworkIds.length} artworks`);
  
  if (successCount > 0) {
    console.log("\n🎉 All quest artworks are now scannable!");
  }
};

// Run the update
updateAllQuestArtworks().catch((err) => {
  console.error("💥 Script failed:", err);
  process.exit(1);
});