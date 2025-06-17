const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config();

// Load AWS credentials from .env
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  S3_BUCKET_NAME,
} = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !S3_BUCKET_NAME) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Configure AWS
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const s3 = new AWS.S3();

// Load artworks data
const ARTWORK_DATA_PATH = path.join(__dirname, 'json/curatedArtworks.json');
let artworks = [];

try {
  const raw = fs.readFileSync(ARTWORK_DATA_PATH, 'utf-8');
  artworks = JSON.parse(raw);
} catch (err) {
  console.error('❌ Failed to read curatedArtworks.json:', err.message);
  process.exit(1);
}

// Function to check if an object exists in S3
const checkObjectExists = async (key) => {
  try {
    await s3.headObject({ Bucket: S3_BUCKET_NAME, Key: key }).promise();
    console.log(`✅ Found object: ${key}`);
    return true;
  } catch (err) {
    if (err.code === 'NotFound') {
      console.log(`❌ Object not found: ${key}`);
      return false;
    }
    throw err;
  }
};

// Function to update image URLs
const updateImageUrls = async () => {
  let updated = false;

  for (const artwork of artworks) {
    const artworkId = artwork.id;
    const basePath = `artworkImages/${artworkId}/`;

    // Check primary image
    if (artwork.primaryImage) {
      const jpgKey = `${basePath}primaryImage.jpg`;
      const pngKey = `${basePath}primaryImage.png`;
      
      console.log(`\nChecking artwork ${artworkId}:`);
      const jpgExists = await checkObjectExists(jpgKey);
      const pngExists = await checkObjectExists(pngKey);

      if (pngExists && !jpgExists) {
        artwork.primaryImage = artwork.primaryImage.replace('.jpg', '.png');
        updated = true;
        console.log(`✅ Updated primary image URL for artwork ${artworkId} to PNG`);
      }
    }

    // Check primary image small
    if (artwork.primaryImageSmall) {
      const jpgKey = `${basePath}primaryImageSmall.jpg`;
      const pngKey = `${basePath}primaryImageSmall.png`;
      
      const jpgExists = await checkObjectExists(jpgKey);
      const pngExists = await checkObjectExists(pngKey);

      if (pngExists && !jpgExists) {
        artwork.primaryImageSmall = artwork.primaryImageSmall.replace('.jpg', '.png');
        updated = true;
        console.log(`✅ Updated primary image small URL for artwork ${artworkId} to PNG`);
      }
    }

    // Check additional images
    if (artwork.additionalImages && artwork.additionalImages.length > 0) {
      for (let i = 0; i < artwork.additionalImages.length; i++) {
        const imgUrl = artwork.additionalImages[i];
        const imgName = path.basename(imgUrl);
        const jpgKey = `${basePath}additional/${imgName}`;
        const pngKey = jpgKey.replace('.jpg', '.png');
        
        const jpgExists = await checkObjectExists(jpgKey);
        const pngExists = await checkObjectExists(pngKey);

        if (pngExists && !jpgExists) {
          artwork.additionalImages[i] = imgUrl.replace('.jpg', '.png');
          updated = true;
          console.log(`✅ Updated additional image URL for artwork ${artworkId} to PNG`);
        }
      }
    }
  }

  if (updated) {
    // Write updated data back to file
    fs.writeFileSync(ARTWORK_DATA_PATH, JSON.stringify(artworks, null, 2));
    console.log('🎉 Updated curatedArtworks.json with correct image extensions');
  } else {
    console.log('✨ No image URL updates needed');
  }
};

updateImageUrls().catch(err => {
  console.error('❌ Error updating image URLs:', err);
  process.exit(1);
}); 