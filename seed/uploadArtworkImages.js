const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config(); // Load .env file

// Load from .env
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  S3_BUCKET_NAME,
} = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET_NAME || !AWS_REGION) {
  console.error("❌ Missing required .env variables");
  process.exit(1);
}

// Configure AWS SDK
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const s3 = new AWS.S3();
const LOCAL_DIR = './artworkImages'; // or wherever your local folder lives

const uploadFile = async (localPath, s3Key) => {
  const fileStream = fs.createReadStream(localPath);
  const ext = path.extname(localPath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    await s3.upload({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileStream,
      ContentType: contentType,
    }).promise();
    console.log(`✅ Uploaded: ${s3Key}`);
  } catch (err) {
    console.error(`❌ Failed to upload ${s3Key}: ${err.message}`);
  }
};

const uploadArtworkImages = async () => {
  const artworkFolders = fs.readdirSync(LOCAL_DIR);

  for (const folderName of artworkFolders) {
    const folderPath = path.join(LOCAL_DIR, folderName);
    const s3Base = `artworkImages/${folderName}/`;

    if (!fs.lstatSync(folderPath).isDirectory()) continue;

    const entries = fs.readdirSync(folderPath);

    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry);

      if (entry === 'additional' && fs.lstatSync(fullPath).isDirectory()) {
        const additionalFiles = fs.readdirSync(fullPath);
        for (const addImg of additionalFiles) {
          const addPath = path.join(fullPath, addImg);
          const s3Key = `${s3Base}additional/${addImg}`;
          await uploadFile(addPath, s3Key);
        }
      } else if (fs.lstatSync(fullPath).isFile()) {
        const s3Key = `${s3Base}${entry}`;
        await uploadFile(fullPath, s3Key);
      }
    }
  }
};

uploadArtworkImages()
  .then(() => console.log("🎉 All uploads complete!"))
  .catch((err) => console.error("❌ Upload process failed:", err));
