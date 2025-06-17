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

// Get artwork ID from command line argument
const artworkId = process.argv[2];
if (!artworkId) {
  console.error("❌ Please provide an artwork ID as a command line argument");
  process.exit(1);
}

// Find the specific artwork
const artwork = artworks.find(a => a.id === artworkId);
if (!artwork) {
  console.error(`❌ Artwork with ID ${artworkId} not found in the JSON file`);
  process.exit(1);
}

// Update the single artwork
const updateArtwork = async () => {
  const timestamp = new Date().toISOString();

  const params = {
    TableName: ARTWORK_TABLE_NAME,
    Item: {
      ...artwork,
      updatedAt: timestamp,
    },
  };

  try {
    await dynamoDb.put(params).promise();
    console.log(`✅ Updated artwork: ${artwork.id}`);
    console.log("Updated URLs:", {
      primaryImage: artwork.primaryImage,
      primaryImageSmall: artwork.primaryImageSmall
    });
  } catch (err) {
    console.error(`❌ Failed to update artwork ${artwork.id}:`, err.message);
  }
};

updateArtwork(); 