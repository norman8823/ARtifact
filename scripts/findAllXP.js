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
const USER_QUEST_TABLE = process.env.USER_QUEST_TABLE_NAME || `UserQuest-${TABLE_SUFFIX}`;

async function scanAllData() {
  try {
    console.log("🔍 SCANNING ALL TABLES FOR XP DATA...\n");

    // 1. Get all users
    console.log("👥 ALL USERS:");
    const userResult = await dynamoDb.scan({ TableName: USER_TABLE }).promise();
    const users = userResult.Items || [];

    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.email}) - ID: ${user.id}`);
      if (user.xpPoints) {
        console.log(`     🎯 User table XP: ${user.xpPoints}`);
      }
    });

    // 2. Get all UserXP records
    console.log("\n⭐ ALL USER XP RECORDS:");
    const xpResult = await dynamoDb.scan({ TableName: USER_XP_TABLE }).promise();
    const xpRecords = xpResult.Items || [];

    if (xpRecords.length === 0) {
      console.log("  No XP records found");
    } else {
      xpRecords.forEach((record, index) => {
        const user = users.find(u => u.id === record.userId);
        const userName = user ? user.username : "Unknown User";
        console.log(`  ${index + 1}. ${userName} (${record.userId}): ${record.xpPoints} XP (${record.timestamp})`);
      });
    }

    // 3. Get all visited records
    console.log("\n🎨 ALL VISITED ARTWORKS:");
    const visitedResult = await dynamoDb.scan({ TableName: VISITED_TABLE }).promise();
    const visitedRecords = visitedResult.Items || [];

    if (visitedRecords.length === 0) {
      console.log("  No visited records found");
    } else {
      // Group by user
      const visitedByUser = {};
      visitedRecords.forEach(record => {
        if (!visitedByUser[record.userId]) {
          visitedByUser[record.userId] = [];
        }
        visitedByUser[record.userId].push(record);
      });

      Object.keys(visitedByUser).forEach(userId => {
        const user = users.find(u => u.id === userId);
        const userName = user ? user.username : "Unknown User";
        const count = visitedByUser[userId].length;
        console.log(`  ${userName} (${userId}): ${count} artworks visited`);
      });
    }

    // 4. Get all user quest records
    console.log("\n🏆 ALL USER QUEST RECORDS:");
    const questResult = await dynamoDb.scan({ TableName: USER_QUEST_TABLE }).promise();
    const questRecords = questResult.Items || [];

    if (questRecords.length === 0) {
      console.log("  No user quest records found");
    } else {
      // Group by user
      const questsByUser = {};
      questRecords.forEach(record => {
        if (!questsByUser[record.userId]) {
          questsByUser[record.userId] = [];
        }
        questsByUser[record.userId].push(record);
      });

      Object.keys(questsByUser).forEach(userId => {
        const user = users.find(u => u.id === userId);
        const userName = user ? user.username : "Unknown User";
        const userQuests = questsByUser[userId];
        const completedQuests = userQuests.filter(q => q.isCompleted);
        console.log(`  ${userName} (${userId}): ${userQuests.length} quests (${completedQuests.length} completed)`);

        if (completedQuests.length > 0) {
          completedQuests.forEach(quest => {
            console.log(`    ✅ ${quest.title}: ${quest.xpReward || 0} XP`);
          });
        }
      });
    }

    // 5. Summary analysis
    console.log("\n📊 SUMMARY ANALYSIS:");
    console.log(`Total users: ${users.length}`);
    console.log(`Total XP records: ${xpRecords.length}`);
    console.log(`Total visited records: ${visitedRecords.length}`);
    console.log(`Total quest records: ${questRecords.length}`);

    // Check for any records with 2450 XP
    const xpWith2450 = xpRecords.filter(r => r.xpPoints === 2450);
    if (xpWith2450.length > 0) {
      console.log(`\n🎯 FOUND 2450 XP RECORDS:`);
      xpWith2450.forEach(record => {
        const user = users.find(u => u.id === record.userId);
        const userName = user ? user.username : "Unknown User";
        console.log(`  ${userName} (${record.userId}): ${record.xpPoints} XP`);
      });
    } else {
      console.log(`\n❌ No records found with exactly 2450 XP`);
    }

    // Check for users with XP in the User table itself
    const usersWithXP = users.filter(u => u.xpPoints && u.xpPoints > 0);
    if (usersWithXP.length > 0) {
      console.log(`\n🎯 USERS WITH XP IN USER TABLE:`);
      usersWithXP.forEach(user => {
        console.log(`  ${user.username} (${user.email}): ${user.xpPoints} XP`);
      });
    }

  } catch (error) {
    console.error("❌ Error scanning data:", error);
  }
}

scanAllData();