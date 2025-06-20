const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
require("dotenv").config();

// Load env variables
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  DIDYOUKNOW_TABLE_NAME,
} = process.env;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !DIDYOUKNOW_TABLE_NAME
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

// Load did you know data
const DIDYOUKNOW_DATA_PATH = path.join(__dirname, "json/didYouKnow.json");
let didYouKnowFacts = [];

try {
  const raw = fs.readFileSync(DIDYOUKNOW_DATA_PATH, "utf-8");
  didYouKnowFacts = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to read didYouKnow.json:", err.message);
  process.exit(1);
}

// Seed did you know facts
const seedDidYouKnow = async () => {
  for (const fact of didYouKnowFacts) {
    const timestamp = new Date().toISOString();

    const params = {
      TableName: DIDYOUKNOW_TABLE_NAME,
      Item: {
        ...fact,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    try {
      await dynamoDb.put(params).promise();
      console.log(`✅ Inserted did you know fact: ${fact.id}`);
    } catch (err) {
      console.error(`❌ Failed to insert fact ${fact.id}:`, err.message);
    }
  }

  console.log("🎉 Finished seeding did you know facts!");
};

seedDidYouKnow();
