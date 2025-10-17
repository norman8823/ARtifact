const { Storage } = require('aws-amplify');
const fs = require('fs');
const path = require('path');
const { Amplify } = require('aws-amplify');

// Configure Amplify with environment variables
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_uZt2DWPi1',
      userPoolClientId: '20dkda1thpvvq3920uo6siqeu3',
      identityPoolId: 'us-east-1:24cb6bc2-fef3-4560-9e9e-783253d178c5',
    },
  },
  Storage: {
    S3: {
      bucket: 'artifactbucketd3c4f-devf',
      region: 'us-east-1',
      buckets: {
        default: {
          bucketName: 'artifactbucketd3c4f-devf',
          region: 'us-east-1',
        },
      },
    },
  },
});

async function uploadGifToStorage() {
  try {
    console.log('🚀 Starting GIF upload to Amplify Storage...');

    // Read the GIF file
    const gifPath = path.join(__dirname, '../assets/images/RuthSpinning.gif');
    const gifBuffer = fs.readFileSync(gifPath);

    console.log(`📁 Read GIF file: ${gifPath}`);
    console.log(`📊 File size: ${gifBuffer.length} bytes`);

    // Upload to Amplify Storage
    const result = await Storage.put('public/RuthSpinning.gif', gifBuffer, {
      contentType: 'image/gif',
      level: 'public', // Makes it publicly accessible
    });

    console.log('✅ Upload successful!');
    console.log('📄 Upload result:', result);

    // Get the public URL
    const url = await Storage.get('public/RuthSpinning.gif', {
      level: 'public'
    });

    console.log('🌐 Public URL:', url);
    console.log('\n🎯 Use this URL in your React Native app:');
    console.log(`   ${url}`);

    return url;

  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

// Run the upload
uploadGifToStorage()
  .then(url => {
    console.log('\n✨ Upload completed successfully!');
    console.log('🔗 URL to use in your app:', url);
  })
  .catch(error => {
    console.error('\n💥 Upload failed:', error);
    process.exit(1);
  });