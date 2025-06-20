const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
require("dotenv").config();

// Load env variables
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  GALLERYMAP_TABLE_NAME,
} = process.env;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !GALLERYMAP_TABLE_NAME
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

// Load gallery maps data
const GALLERYMAP_DATA_PATH = path.join(__dirname, "json/galleryMaps.json");
let galleryMaps = [];

try {
  const raw = fs.readFileSync(GALLERYMAP_DATA_PATH, "utf-8");
  galleryMaps = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to read galleryMaps.json:", err.message);
  process.exit(1);
}

// Seed gallery maps
const seedGalleryMaps = async () => {
  for (const galleryMap of galleryMaps) {
    const timestamp = new Date().toISOString();

    const params = {
      TableName: GALLERYMAP_TABLE_NAME,
      Item: {
        ...galleryMap,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    try {
      await dynamoDb.put(params).promise();
      console.log(
        `✅ Inserted gallery map: Gallery ${galleryMap.galleryNumber} (ID: ${galleryMap.id})`
      );
    } catch (err) {
      console.error(
        `❌ Failed to insert gallery map ${galleryMap.id}:`,
        err.message
      );
    }
  }

  console.log("🎉 Finished seeding gallery maps!");
};

seedGalleryMaps();
