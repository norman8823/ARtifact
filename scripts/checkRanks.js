const AWS = require("aws-sdk");
require("dotenv").config();

// Load env variables
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  RANK_TABLE_NAME,
} = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !RANK_TABLE_NAME) {
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

async function checkRanks() {
  try {
    console.log("🔍 CHECKING RANKS IN DATABASE...\n");

    const result = await dynamoDb.scan({ TableName: RANK_TABLE_NAME }).promise();
    const ranks = (result.Items || []).sort((a, b) => a.minXP - b.minXP);

    console.log(`Found ${ranks.length} ranks:\n`);

    ranks.forEach((rank, index) => {
      console.log(`${index + 1}. ${rank.title} (${rank.id})`);
      console.log(`   XP Range: ${rank.minXP} - ${rank.maxXP}`);
      console.log(`   Icon: ${rank.icon}`);
      console.log(`   Description: ${rank.description}`);
      console.log();
    });

    // Test with 4900 XP
    const testXP = 4900;
    const matchingRank = ranks.find(
      rank => testXP >= rank.minXP && testXP <= rank.maxXP
    );

    console.log(`\n🧪 TEST: User with ${testXP} XP should be:`);
    if (matchingRank) {
      console.log(`   ✅ ${matchingRank.title} (${matchingRank.id})`);
    } else {
      console.log(`   ❌ No matching rank found! Would default to: ${ranks[0]?.title}`);
    }

  } catch (error) {
    console.error("❌ Error checking ranks:", error.message);
  }
}

checkRanks();
