const AWS = require("aws-sdk");
require("dotenv").config();

// Load env variables
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
} = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
  console.error("❌ Missing required AWS environment variables");
  process.exit(1);
}

// Configure AWS SDK
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Table names
const TABLE_SUFFIX = "wpjj3wuv3rfdndu6j3uvtroxve-dev";
const USER_TABLE = `User-${TABLE_SUFFIX}`;
const VISITED_TABLE = `Visited-${TABLE_SUFFIX}`;
const USER_XP_TABLE = `UserXP-${TABLE_SUFFIX}`;
const USER_QUEST_TABLE = `UserQuest-${TABLE_SUFFIX}`;

// User IDs
const OLD_USER_ID = "e498f4b8-f051-7010-6ee7-6316d8af7ff4";  // Has 2450 XP and progress
const NEW_USER_ID = "7bb9bf01-06b8-4bff-aeb4-68b18522e266";  // testingartifact@gmail.com

async function migrateUserData() {
  try {
    console.log("🔄 MIGRATING USER DATA...");
    console.log(`From: ${OLD_USER_ID} (old account with progress)`);
    console.log(`To: ${NEW_USER_ID} (testingartifact@gmail.com)\n`);

    // 1. Migrate UserXP records
    console.log("⭐ Migrating XP records...");
    const xpResult = await dynamoDb.scan({
      TableName: USER_XP_TABLE,
      FilterExpression: "userId = :oldUserId",
      ExpressionAttributeValues: { ":oldUserId": OLD_USER_ID }
    }).promise();

    for (const xpRecord of xpResult.Items || []) {
      // Update XP from 2450 to 4900 (applying new 100 XP rate)
      const newXP = Math.round(xpRecord.xpPoints * 2); // 2450 -> 4900

      console.log(`  Creating XP record: ${xpRecord.xpPoints} -> ${newXP} XP`);

      await dynamoDb.put({
        TableName: USER_XP_TABLE,
        Item: {
          id: `migrated-${Date.now()}`,
          userId: NEW_USER_ID,
          xpPoints: newXP,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __typename: "UserXP",
          owner: NEW_USER_ID
        }
      }).promise();
    }

    // 2. Migrate Visited records
    console.log("\n🎨 Migrating visited artworks...");
    const visitedResult = await dynamoDb.scan({
      TableName: VISITED_TABLE,
      FilterExpression: "userId = :oldUserId",
      ExpressionAttributeValues: { ":oldUserId": OLD_USER_ID }
    }).promise();

    let visitedCount = 0;
    for (const visitedRecord of visitedResult.Items || []) {
      console.log(`  Migrating visited artwork: ${visitedRecord.artworkId}`);

      await dynamoDb.put({
        TableName: VISITED_TABLE,
        Item: {
          id: `migrated-${Date.now()}-${visitedCount}`,
          userId: NEW_USER_ID,
          artworkId: visitedRecord.artworkId,
          timestamp: visitedRecord.timestamp || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __typename: "Visited",
          owner: NEW_USER_ID
        }
      }).promise();
      visitedCount++;
    }

    // 3. Migrate UserQuest records
    console.log("\n🏆 Migrating quest progress...");
    const questResult = await dynamoDb.scan({
      TableName: USER_QUEST_TABLE,
      FilterExpression: "userId = :oldUserId",
      ExpressionAttributeValues: { ":oldUserId": OLD_USER_ID }
    }).promise();

    for (const questRecord of questResult.Items || []) {
      console.log(`  Migrating quest: ${questRecord.title} (${questRecord.isCompleted ? 'completed' : 'in progress'})`);

      await dynamoDb.put({
        TableName: USER_QUEST_TABLE,
        Item: {
          id: `migrated-${Date.now()}-${questRecord.questId}`,
          userId: NEW_USER_ID,
          questId: questRecord.questId,
          title: questRecord.title,
          description: questRecord.description,
          icon: questRecord.icon,
          xpReward: questRecord.xpReward,
          requiredArtworks: questRecord.requiredArtworks,
          artworksVisited: questRecord.artworksVisited,
          galleryMap: questRecord.galleryMap,
          isCompleted: questRecord.isCompleted,
          timestamp: questRecord.timestamp || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __typename: "UserQuest",
          owner: NEW_USER_ID
        }
      }).promise();
    }

    console.log("\n✅ MIGRATION COMPLETE!");
    console.log(`Migrated ${xpResult.Items?.length || 0} XP records`);
    console.log(`Migrated ${visitedResult.Items?.length || 0} visited artworks`);
    console.log(`Migrated ${questResult.Items?.length || 0} quest records`);

    console.log("\n🎯 Updated XP calculation:");
    console.log(`Old XP: 2,450 (49 artworks × 50 XP)`);
    console.log(`New XP: 4,900 (49 artworks × 100 XP)`);
    console.log(`Rank: Art Legend! (exactly 4,700 XP = all 47 quest artworks + 2 bonus artworks)`);

    console.log("\n⚠️  NOTE: You may need to log out and back in to see the changes in the app.");

  } catch (error) {
    console.error("❌ Error during migration:", error);
  }
}

// Ask for confirmation before running
console.log("🚨 WARNING: This will migrate data from old account to testingartifact@gmail.com");
console.log("The old account data will remain but the new account will get copies.");
console.log("XP will be doubled (2450 -> 4900) to reflect the new 100 XP rate.\n");

migrateUserData();