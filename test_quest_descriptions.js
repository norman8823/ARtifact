const AWS = require("aws-sdk");
require("dotenv").config();

// Load AWS credentials from .env
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  QUEST_TABLE_NAME,
} = process.env;

// Configure AWS
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

async function testQuestDescriptions() {
  console.log("🔍 Testing quest descriptions directly from DynamoDB...\n");

  try {
    const result = await dynamoDb.scan({
      TableName: QUEST_TABLE_NAME
    }).promise();

    console.log(`Found ${result.Items?.length || 0} quests in database\n`);

    if (result.Items && result.Items.length > 0) {
      // Show first 3 quests
      result.Items.slice(0, 3).forEach((quest, index) => {
        console.log(`Quest ${index + 1}: ${quest.title}`);
        console.log(`Description: ${quest.description}`);
        console.log(`---`);
      });
    }

  } catch (error) {
    console.error("Error fetching quests:", error);
  }
}

testQuestDescriptions();