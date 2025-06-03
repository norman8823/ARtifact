const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
require("dotenv").config();

// Load env variables
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  QUEST_TABLE_NAME,
} = process.env;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !QUEST_TABLE_NAME
) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

// Configure AWS SDK
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Load quest data
const QUEST_DATA_PATH = path.join(__dirname, "json/quests.json");
let quests = [];

try {
  const raw = fs.readFileSync(QUEST_DATA_PATH, "utf-8");
  quests = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to read quests.json:", err.message);
  process.exit(1);
}

// Seed quests
const seedQuests = async () => {
  for (const quest of quests) {
    const timestamp = new Date().toISOString();

    const params = {
      TableName: QUEST_TABLE_NAME,
      Item: {
        ...quest,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    try {
      await dynamoDb.put(params).promise();
      console.log(`✅ Inserted quest: ${quest.id}`);
    } catch (err) {
      console.error(`❌ Failed to insert quest ${quest.id}:`, err.message);
    }
  }

  console.log("🎉 Finished seeding quests!");
};

seedQuests();
