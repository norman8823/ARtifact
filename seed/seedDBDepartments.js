const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
require("dotenv").config();

// Load env variables
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  DEPARTMENT_TABLE_NAME,
} = process.env;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !DEPARTMENT_TABLE_NAME
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

// Load department data
const DEPARTMENT_DATA_PATH = path.join(__dirname, "json/departments.json");
let departments = [];

try {
  const raw = fs.readFileSync(DEPARTMENT_DATA_PATH, "utf-8");
  departments = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to read departments.json:", err.message);
  process.exit(1);
}

// Seed departments
const seedDepartments = async () => {
  for (const department of departments) {
    const params = {
      TableName: DEPARTMENT_TABLE_NAME,
      Item: department,
    };

    try {
      await dynamoDb.put(params).promise();
      console.log(`✅ Inserted department: ${department.id}`);
    } catch (err) {
      console.error(
        `❌ Failed to insert department ${department.id}:`,
        err.message
      );
    }
  }

  console.log("🎉 Finished seeding departments!");
};

seedDepartments();
