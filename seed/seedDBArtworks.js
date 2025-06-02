const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
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

// Load data
const ARTWORK_DATA_PATH = path.join(__dirname, "json/curatedArtworks.json");
let artworks = [];

try {
  const raw = fs.readFileSync(ARTWORK_DATA_PATH, "utf-8");
  artworks = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to read artworks.json:", err.message);
  process.exit(1);
}

// Insert each item
const seedArtworks = async () => {
  for (const artwork of artworks) {
    const timestamp = new Date().toISOString();

    const params = {
      TableName: ARTWORK_TABLE_NAME,
      Item: {
        ...artwork,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    try {
      await dynamoDb.put(params).promise();
      console.log(`✅ Inserted artwork: ${artwork.id}`);
    } catch (err) {
      console.error(`❌ Failed to insert artwork ${artwork.id}:`, err.message);
    }
  }

  console.log("🎉 All done seeding artwork!");
};

seedArtworks();
