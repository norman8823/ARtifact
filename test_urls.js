const https = require('https');

// Test URLs from the problematic quests (using correct bucket name from database)
const TEST_URLS = [
  // Bronze Legacy
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/247117/primaryImageSmall.jpg",
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/252958/primaryImageSmall.jpg",
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/246701/primaryImageSmall.jpg",
  // Marble Legends
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/247000/primaryImageSmall.jpg",
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/255973/primaryImageSmall.jpg",
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/204758/primaryImageSmall.jpg",
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/11952/primaryImageSmall.jpg",
  // Renaissance Masterpieces
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/437372/primaryImageSmall.jpg",
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/437261/primaryImageSmall.jpg",
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/459016/primaryImageSmall.jpg",
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/459062/primaryImageSmall.jpg",
  "https://artifactbucketd3c4f-dev.s3.us-east-1.amazonaws.com/artworkImages/459072/primaryImageSmall.jpg"
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`Testing: ${url}`);

    const req = https.get(url, (res) => {
      console.log(`✅ ${url.split('/').pop()}: HTTP ${res.statusCode} - ${res.headers['content-type'] || 'unknown type'}`);
      resolve({ url, status: res.statusCode, contentType: res.headers['content-type'] });
    });

    req.on('error', (error) => {
      console.log(`❌ ${url.split('/').pop()}: Error - ${error.message}`);
      resolve({ url, error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ ${url.split('/').pop()}: Timeout`);
      req.destroy();
      resolve({ url, error: 'Timeout' });
    });
  });
}

async function testAllUrls() {
  console.log('🧪 Testing S3 URLs for problematic artworks...\n');

  const results = [];
  for (const url of TEST_URLS) {
    const result = await testUrl(url);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Be nice to S3
  }

  console.log('\n📊 SUMMARY:');
  console.log('==================');

  const working = results.filter(r => r.status && r.status >= 200 && r.status < 300);
  const broken = results.filter(r => r.error || (r.status && (r.status >= 400 || r.status < 200)));

  console.log(`✅ Working URLs: ${working.length}`);
  console.log(`❌ Broken URLs: ${broken.length}`);

  if (broken.length > 0) {
    console.log('\n❌ BROKEN URLs:');
    broken.forEach(r => {
      const filename = r.url.split('/').pop();
      console.log(`   ${filename}: ${r.error || `HTTP ${r.status}`}`);
    });
  }
}

testAllUrls().catch(console.error);