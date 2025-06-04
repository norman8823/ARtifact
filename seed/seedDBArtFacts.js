const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
require("dotenv").config();

// Load env variables
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  ART_FACTS_TABLE_NAME,
} = process.env;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !ART_FACTS_TABLE_NAME
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

// Load art fact data
const ART_FACTS_DATA_PATH = path.join(__dirname, "json/artFacts.json");
let artFacts = [];

try {
  const raw = fs.readFileSync(ART_FACTS_DATA_PATH, "utf-8");
  artFacts = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to read artFacts.json:", err.message);
  process.exit(1);
}

// Seed art facts
const seedArtFacts = async () => {
  for (const fact of artFacts) {
    const timestamp = new Date().toISOString();

    const params = {
      TableName: ART_FACTS_TABLE_NAME,
      Item: {
        ...fact,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    try {
      await dynamoDb.put(params).promise();
      console.log(`✅ Inserted art fact for artwork: ${fact.artworkId}`);
    } catch (err) {
      console.error(
        `❌ Failed to insert art fact for artwork ${fact.artworkId}:`,
        err.message
      );
    }
  }

  console.log("🎉 Finished seeding art facts!");
};

seedArtFacts();
