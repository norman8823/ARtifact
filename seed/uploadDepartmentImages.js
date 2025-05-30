const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config();

// Load credentials from .env
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

// AWS SDK config
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const s3 = new AWS.S3();
const LOCAL_DIR = './departments'; // local folder with department images
const S3_PREFIX = 'departments/';  // folder in S3 bucket

const uploadDepartmentImages = async () => {
  const imageFiles = fs.readdirSync(LOCAL_DIR);

  for (const fileName of imageFiles) {
    const localPath = path.join(LOCAL_DIR, fileName);

    if (!fs.lstatSync(localPath).isFile()) continue;
    if (!fileName.toLowerCase().endsWith('.jpg')) continue;

    const s3Key = `${S3_PREFIX}${fileName}`;

    try {
      await s3.upload({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        Body: fs.createReadStream(localPath),
        ContentType: 'image/jpeg',
      }).promise();
      console.log(`✅ Uploaded: ${s3Key}`);
    } catch (err) {
      console.error(`❌ Failed to upload ${s3Key}: ${err.message}`);
    }
  }
};

uploadDepartmentImages()
  .then(() => console.log("🎉 Department images upload complete!"))
  .catch((err) => console.error("❌ Upload script failed:", err));
