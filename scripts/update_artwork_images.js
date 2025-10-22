const AWS = require("aws-sdk");
const fetch = require("node-fetch");
require("dotenv").config();

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

// Artwork IDs that need image updates
const ARTWORK_IDS = [
  "247117", "252958", "246701", // Bronze Legacy
  "247000", "255973", "204758", "11952", // Marble Legends
  "437372", "437261", "459016", "459062", "459072" // Renaissance Masterpieces
];

async function fetchArtworkFromMet(artworkId) {
  try {
    const response = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${artworkId}`);
    if (response.ok) {
      return await response.json();
    } else {
      console.error(`❌ Failed to fetch ${artworkId}: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching ${artworkId}:`, error.message);
    return null;
  }
}

async function updateArtworkInDatabase(artworkId, imageData) {
  const updateParams = {
    TableName: ARTWORK_TABLE_NAME,
    Key: { id: artworkId },
    UpdateExpression: "SET primaryImageSmall = :primaryImageSmall",
    ExpressionAttributeValues: {
      ":primaryImageSmall": imageData.primaryImageSmall
    },
    ReturnValues: "UPDATED_NEW"
  };

  // Also update primaryImage if it's missing
  if (imageData.primaryImage) {
    updateParams.UpdateExpression = "SET primaryImageSmall = :primaryImageSmall, primaryImage = :primaryImage";
    updateParams.ExpressionAttributeValues[":primaryImage"] = imageData.primaryImage;
  }

  try {
    const result = await dynamoDb.update(updateParams).promise();
    console.log(`✅ Updated ${artworkId}:`, result.Attributes);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update ${artworkId}:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting artwork image update process...");
  console.log(`📝 Will update ${ARTWORK_IDS.length} artworks with missing image URLs`);

  let successCount = 0;
  let failureCount = 0;

  for (const artworkId of ARTWORK_IDS) {
    console.log(`\n📥 Processing artwork ${artworkId}...`);

    // Fetch from Met API
    const metData = await fetchArtworkFromMet(artworkId);
    if (!metData) {
      failureCount++;
      continue;
    }

    console.log(`   Title: ${metData.title || 'Unknown'}`);
    console.log(`   primaryImageSmall: ${metData.primaryImageSmall ? '✅ Available' : '❌ Missing'}`);

    if (metData.primaryImageSmall) {
      // Update database
      const success = await updateArtworkInDatabase(artworkId, {
        primaryImageSmall: metData.primaryImageSmall,
        primaryImage: metData.primaryImage
      });

      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    } else {
      console.log(`⚠️  ${artworkId}: No primaryImageSmall available in Met API`);
      failureCount++;
    }

    // Be nice to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL RESULTS:");
  console.log("=".repeat(60));
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed to update: ${failureCount}`);
  console.log(`📝 Total processed: ${ARTWORK_IDS.length}`);

  if (successCount > 0) {
    console.log("\n🎉 Image URLs have been updated! The quest thumbnails should now display correctly.");
    console.log("💡 You may need to refresh your app to see the changes.");
  }
}

// Run the script
main().catch(error => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});