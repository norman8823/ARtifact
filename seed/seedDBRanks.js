const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
require("dotenv").config();

// Load env variables
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  RANK_TABLE_NAME,
} = process.env;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !RANK_TABLE_NAME
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

// Load rank data
const RANKS_DATA_PATH = path.join(__dirname, "json/ranks.json");
let ranks = [];

try {
  const raw = fs.readFileSync(RANKS_DATA_PATH, "utf-8");
  ranks = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to read ranks.json:", err.message);
  process.exit(1);
}

// Seed ranks
const seedRanks = async () => {
  for (const rank of ranks) {
    const timestamp = new Date().toISOString();

    const params = {
      TableName: RANK_TABLE_NAME,
      Item: {
        ...rank,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    try {
      await dynamoDb.put(params).promise();
      console.log(`✅ Inserted rank: ${rank.id}`);
    } catch (err) {
      console.error(`❌ Failed to insert rank ${rank.id}:`, err.message);
    }
  }

  console.log("🎉 Finished seeding ranks!");
};

seedRanks();
