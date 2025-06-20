import { cognitoUserPoolsTokenProvider } from "@aws-amplify/auth/cognito";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Amplify } from "aws-amplify";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

// Validate environment variables
const requiredEnvVars = {
  region: process.env.EXPO_PUBLIC_AWS_REGION,
  userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID,
  userPoolClientId: process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID,
  bucketName: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
}

// Ensure all required values are defined
if (
  !requiredEnvVars.region ||
  !requiredEnvVars.userPoolId ||
  !requiredEnvVars.userPoolClientId ||
  !requiredEnvVars.bucketName
) {
  throw new Error("Required environment variables are undefined");
}

try {
  // Configure both Auth and API
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: requiredEnvVars.userPoolId,
        userPoolClientId: requiredEnvVars.userPoolClientId,
      },
    },
    API: {
      GraphQL: {
        endpoint:
          "https://pxkzi6ejozb2pnbdngzlqzecdu.appsync-api.us-east-1.amazonaws.com/graphql",
        region: requiredEnvVars.region,
        defaultAuthMode: "userPool",
      },
      REST: {
        rekognitionApi: {
          endpoint: "https://6nffsggmz8.execute-api.us-east-1.amazonaws.com/dev",
          region: requiredEnvVars.region,
        },
      },
    },
    Storage: {
      S3: {
        bucket: requiredEnvVars.bucketName,
        region: requiredEnvVars.region,
      },
    },
  });

  console.log("Setting up token storage...");
  cognitoUserPoolsTokenProvider.setKeyValueStorage(AsyncStorage);
  console.log("Amplify configured successfully");
} catch (error) {
  console.error("Error configuring Amplify:", error);
  throw error; // Re-throw to make sure app doesn't continue with bad config
}
