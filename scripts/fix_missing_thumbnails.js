const fs = require("fs");
const path = require("path");
const https = require("https");
const AWS = require("aws-sdk");
require("dotenv").config();

// Load AWS credentials from .env
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  ARTWORK_TABLE_NAME,
  S3_BUCKET_NAME,
} = process.env;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !ARTWORK_TABLE_NAME ||
  !S3_BUCKET_NAME
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

const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// S3 configuration
const S3_BASE_URL = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;
const S3_PATH = "artworkImages";

// Artwork IDs that need thumbnail fixes
const MISSING_THUMBNAIL_IDS = [
  "247117", "252958", "246701", // Bronze Legacy
  "247000", "255973", "204758", "11952", // Marble Legends
  "437372", "437261", "459016", "459062", "459072" // Renaissance Masterpieces
];

// Local directories
const TEMP_DIR = path.resolve(__dirname, "temp_thumbnails");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchArtworkFromMet(artworkId) {
  return new Promise((resolve, reject) => {
    const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${artworkId}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const artworkData = JSON.parse(data);
            resolve(artworkData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON for ${artworkId}: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode} for ${artworkId}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function downloadImage(imageUrl, localPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath);

    https.get(imageUrl, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (error) => {
          fs.unlink(localPath, () => {}); // Delete the file on error
          reject(error);
        });
      } else {
        reject(new Error(`HTTP ${res.statusCode} for ${imageUrl}`));
      }
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function uploadToS3(localPath, s3Key) {
  const fileStream = fs.createReadStream(localPath);
  const ext = path.extname(localPath).toLowerCase();
  const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

  try {
    await s3.upload({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileStream,
      ContentType: contentType,
    }).promise();

    return `${S3_BASE_URL}/${s3Key}`;
  } catch (error) {
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

async function updateArtworkInDatabase(artworkId, s3Url) {
  const updateParams = {
    TableName: ARTWORK_TABLE_NAME,
    Key: { id: artworkId },
    UpdateExpression: "SET primaryImageSmall = :primaryImageSmall",
    ExpressionAttributeValues: {
      ":primaryImageSmall": s3Url
    },
    ReturnValues: "UPDATED_NEW"
  };

  try {
    const result = await dynamoDb.update(updateParams).promise();
    return result.Attributes;
  } catch (error) {
    throw new Error(`Failed to update database: ${error.message}`);
  }
}

async function processArtwork(artworkId) {
  console.log(`\n📥 Processing artwork ${artworkId}...`);

  try {
    // 1. Fetch artwork data from Met API
    console.log(`   📡 Fetching data from Met API...`);
    const metData = await fetchArtworkFromMet(artworkId);

    if (!metData.primaryImageSmall) {
      console.log(`   ⚠️  No primaryImageSmall available for ${artworkId}`);
      return { success: false, reason: 'No primaryImageSmall in Met API' };
    }

    console.log(`   📋 Title: ${metData.title}`);
    console.log(`   🖼️  Image URL: ${metData.primaryImageSmall}`);

    // 2. Download image to local temp directory
    const imageExtension = metData.primaryImageSmall.includes('.png') ? '.png' : '.jpg';
    const localImagePath = path.join(TEMP_DIR, `${artworkId}_primaryImageSmall${imageExtension}`);

    console.log(`   ⬇️  Downloading image...`);
    await downloadImage(metData.primaryImageSmall, localImagePath);

    // 3. Upload to S3
    const s3Key = `${S3_PATH}/${artworkId}/primaryImageSmall${imageExtension}`;
    console.log(`   ⬆️  Uploading to S3...`);
    const s3Url = await uploadToS3(localImagePath, s3Key);

    // 4. Update database
    console.log(`   🗃️  Updating database...`);
    await updateArtworkInDatabase(artworkId, s3Url);

    // 5. Clean up local file
    fs.unlinkSync(localImagePath);

    console.log(`   ✅ Successfully processed ${artworkId}`);
    console.log(`   🔗 S3 URL: ${s3Url}`);

    return { success: true, s3Url };

  } catch (error) {
    console.log(`   ❌ Error processing ${artworkId}: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function main() {
  console.log("🚀 Starting missing thumbnail fix process...");
  console.log(`📝 Will process ${MISSING_THUMBNAIL_IDS.length} artworks`);
  console.log(`📁 Temp directory: ${TEMP_DIR}`);
  console.log(`🪣 S3 bucket: ${S3_BUCKET_NAME}`);
  console.log(`🗃️  DynamoDB table: ${ARTWORK_TABLE_NAME}\n`);

  const results = {
    success: [],
    failed: []
  };

  for (const artworkId of MISSING_THUMBNAIL_IDS) {
    const result = await processArtwork(artworkId);

    if (result.success) {
      results.success.push({ artworkId, s3Url: result.s3Url });
    } else {
      results.failed.push({ artworkId, reason: result.reason });
    }

    // Be nice to APIs - wait between requests
    await sleep(1000);
  }

  // Final summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 FINAL RESULTS:");
  console.log("=".repeat(70));
  console.log(`✅ Successfully processed: ${results.success.length}`);
  console.log(`❌ Failed to process: ${results.failed.length}`);
  console.log(`📝 Total artworks: ${MISSING_THUMBNAIL_IDS.length}\n`);

  if (results.success.length > 0) {
    console.log("✅ SUCCESSFUL UPDATES:");
    results.success.forEach(({ artworkId, s3Url }) => {
      console.log(`   ${artworkId}: ${s3Url}`);
    });
    console.log();
  }

  if (results.failed.length > 0) {
    console.log("❌ FAILED UPDATES:");
    results.failed.forEach(({ artworkId, reason }) => {
      console.log(`   ${artworkId}: ${reason}`);
    });
    console.log();
  }

  // Clean up temp directory
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    console.log("🧹 Cleaned up temporary files");
  } catch (error) {
    console.log("⚠️  Could not clean up temp directory:", error.message);
  }

  if (results.success.length > 0) {
    console.log("\n🎉 Thumbnail fix complete! The quest thumbnails should now display correctly.");
    console.log("💡 You may need to refresh your app to see the changes.");
  }
}

// Run the script
main().catch(error => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});