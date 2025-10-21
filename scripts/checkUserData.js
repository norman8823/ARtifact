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

// Table names from environment or construct from existing pattern
const TABLE_SUFFIX = "wpjj3wuv3rfdndu6j3uvtroxve-dev";
const USER_TABLE = process.env.USER_TABLE_NAME || `User-${TABLE_SUFFIX}`;
const VISITED_TABLE = process.env.VISITED_TABLE_NAME || `Visited-${TABLE_SUFFIX}`;
const USER_XP_TABLE = process.env.USER_XP_TABLE_NAME || `UserXP-${TABLE_SUFFIX}`;

async function checkUserData() {
  const targetEmail = "testingartifact@gmail.com";

  try {
    console.log(`🔍 Searching for user: ${targetEmail}`);

    // First, find the user by email
    const userScanParams = {
      TableName: USER_TABLE,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": targetEmail
      }
    };

    const userResult = await dynamoDb.scan(userScanParams).promise();

    if (!userResult.Items || userResult.Items.length === 0) {
      console.log("❌ User not found");
      return;
    }

    const user = userResult.Items[0];
    console.log(`✅ Found user: ${user.username} (ID: ${user.id})`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`💎 Premium: ${user.isPremium || false}`);

    // Get visited artworks count
    const visitedParams = {
      TableName: VISITED_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": user.id
      }
    };

    const visitedResult = await dynamoDb.scan(visitedParams).promise();
    const visitedArtworks = visitedResult.Items || [];

    console.log(`\n🎨 VISITED ARTWORKS:`);
    console.log(`Total visited: ${visitedArtworks.length}`);

    if (visitedArtworks.length > 0) {
      console.log(`Artwork IDs: ${visitedArtworks.map(v => v.artworkId).sort().join(", ")}`);
    }

    // Get XP records
    const xpParams = {
      TableName: USER_XP_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": user.id
      }
    };

    const xpResult = await dynamoDb.scan(xpParams).promise();
    const xpRecords = xpResult.Items || [];

    console.log(`\n⭐ XP RECORDS:`);
    console.log(`Total XP records: ${xpRecords.length}`);

    if (xpRecords.length > 0) {
      // Sort by timestamp to get latest
      const sortedXP = xpRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const latestXP = sortedXP[0];

      console.log(`Current XP: ${latestXP.xpPoints}`);
      console.log(`Last updated: ${latestXP.timestamp}`);

      // Show all XP history
      console.log(`\nXP History:`);
      sortedXP.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.xpPoints} XP (${record.timestamp})`);
      });
    }

    // Calculate expected XP
    const expectedXP = visitedArtworks.length * 100; // New rate
    const currentXP = xpRecords.length > 0 ? Math.max(...xpRecords.map(r => r.xpPoints)) : 0;

    console.log(`\n📊 ANALYSIS:`);
    console.log(`Expected XP (${visitedArtworks.length} artworks × 100): ${expectedXP}`);
    console.log(`Current XP: ${currentXP}`);
    console.log(`Difference: ${expectedXP - currentXP}`);

    if (currentXP !== expectedXP) {
      console.log(`⚠️  XP mismatch detected!`);
      if (currentXP === visitedArtworks.length * 50) {
        console.log(`💡 Current XP matches old rate (50 XP per artwork)`);
        console.log(`🔧 Need to apply rate adjustment: ${currentXP} → ${expectedXP}`);
      }
    } else {
      console.log(`✅ XP matches expected value`);
    }

  } catch (error) {
    console.error("❌ Error checking user data:", error);
  }
}

checkUserData();