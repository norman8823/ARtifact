/* Amplify Params - DO NOT EDIT
	AUTH_ARTIFACTAUTH_USERPOOLID
	ENV
	REGION
	STORAGE_ARTIFACTSTORAGE_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const AWS = require("aws-sdk");
const rekognition = new AWS.Rekognition();

exports.handler = async (event) => {
  // CORS headers for all responses
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" }),
    };
  }

  try {
    // Input validation
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const { key } = JSON.parse(event.body);
    const bucket = process.env.STORAGE_ARTIFACTSTORAGE_BUCKETNAME;

    console.log(`Bucket: ${bucket}`);
    console.log(`Key: ${key}`);

    if (!bucket || !key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Both bucket and key parameters are required",
        }),
      };
    }

    const projectVersionArn = process.env.PROJECT_VERSION_ARN;

    if (!projectVersionArn) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "PROJECT_VERSION_ARN environment variable not configured",
        }),
      };
    }

    console.log(`Analyzing image: s3://${bucket}/${key}`);

    const params = {
      Image: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
      MinConfidence: 80,
      ProjectVersionArn: projectVersionArn,
    };

    const response = await rekognition.detectCustomLabels(params).promise();

    console.log(`Found ${response.CustomLabels.length} custom labels`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        labels: response.CustomLabels,
        confidence:
          response.CustomLabels.length > 0
            ? response.CustomLabels[0].Confidence
            : 0,
      }),
    };
  } catch (error) {
    console.error("Error analyzing image:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        errorCode: error.code || "UNKNOWN_ERROR",
      }),
    };
  }
};
