const AWS = require("aws-sdk");
require("dotenv").config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

async function migrateQuestArtworkIds() {
  console.log("🔄 Starting UserQuest artwork ID migration...\n");

  // Migration mapping: old artwork ID -> new artwork ID
  const artworkMigrations = {
    "252958": "248891" // Bronze statue: old ID -> new ID (aristocratic boy)
  };

  try {
    // 1. Scan all UserQuest records
    console.log("📋 Scanning all UserQuest records...");
    const userQuests = await dynamoDb.scan({
      TableName: "UserQuest-wpjj3wuv3rfdndu6j3uvtroxve-dev"
    }).promise();

    console.log(`Found ${userQuests.Items?.length || 0} UserQuest records\n`);

    if (!userQuests.Items || userQuests.Items.length === 0) {
      console.log("No UserQuest records found");
      return;
    }

    let updatedCount = 0;

    // 2. Process each UserQuest record
    for (const userQuest of userQuests.Items) {
      let needsUpdate = false;
      let updatedArtworksVisited = [...(userQuest.artworksVisited || [])];
      let updatedRequiredArtworks = [...(userQuest.requiredArtworks || [])];

      // Check artworksVisited array
      for (let i = 0; i < updatedArtworksVisited.length; i++) {
        const oldId = updatedArtworksVisited[i];
        if (artworkMigrations[oldId]) {
          const newId = artworkMigrations[oldId];
          console.log(`🔄 Quest "${userQuest.title}" (${userQuest.questId}): Replacing visited artwork ${oldId} -> ${newId}`);
          updatedArtworksVisited[i] = newId;
          needsUpdate = true;
        }
      }

      // Check requiredArtworks array
      for (let i = 0; i < updatedRequiredArtworks.length; i++) {
        const oldId = updatedRequiredArtworks[i];
        if (artworkMigrations[oldId]) {
          const newId = artworkMigrations[oldId];
          console.log(`🔄 Quest "${userQuest.title}" (${userQuest.questId}): Replacing required artwork ${oldId} -> ${newId}`);
          updatedRequiredArtworks[i] = newId;
          needsUpdate = true;
        }
      }

      // 3. Update the record if needed
      if (needsUpdate) {
        console.log(`💾 Updating UserQuest record for user ${userQuest.userId}, quest ${userQuest.questId}`);

        await dynamoDb.update({
          TableName: "UserQuest-wpjj3wuv3rfdndu6j3uvtroxve-dev",
          Key: {
            id: userQuest.id
          },
          UpdateExpression: "SET artworksVisited = :visited, requiredArtworks = :required",
          ExpressionAttributeValues: {
            ":visited": updatedArtworksVisited,
            ":required": updatedRequiredArtworks
          }
        }).promise();

        updatedCount++;
        console.log(`✅ Updated UserQuest record\n`);
      }
    }

    console.log(`🎉 Migration completed! Updated ${updatedCount} UserQuest records`);

    // 4. Verify the migration
    console.log("\n🔍 Verifying migration...");
    const verificationScan = await dynamoDb.scan({
      TableName: "UserQuest-wpjj3wuv3rfdndu6j3uvtroxve-dev",
      FilterExpression: "contains(artworksVisited, :oldId) OR contains(requiredArtworks, :oldId)",
      ExpressionAttributeValues: {
        ":oldId": "252958"
      }
    }).promise();

    if (verificationScan.Items && verificationScan.Items.length > 0) {
      console.log(`⚠️  Warning: Found ${verificationScan.Items.length} records still containing old ID 252958`);
      verificationScan.Items.forEach(item => {
        console.log(`   - Quest "${item.title}" (${item.questId}) for user ${item.userId}`);
      });
    } else {
      console.log("✅ Verification passed: No records contain old artwork ID 252958");
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

// Run the migration
console.log("🚀 UserQuest Artwork ID Migration Script");
console.log("========================================");
console.log("This script will update UserQuest records to replace old artwork IDs with new ones.");
console.log("Specifically: 252958 -> 248891 (Bronze statue artwork change)\n");

migrateQuestArtworkIds();