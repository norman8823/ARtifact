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

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolClientId: requiredEnvVars.userPoolClientId,
      userPoolId: requiredEnvVars.userPoolId,
      region: requiredEnvVars.region,
      signUpVerificationMethod: "code",
      authenticationFlowType: "USER_PASSWORD_AUTH",
      tokenInvalidationOptions: {
        invalidateTokensOnSignOut: true,
      },
    },
  },
};

// For debugging
console.log("AWS Configuration:", JSON.stringify(awsConfig, null, 2));

try {
  console.log("Configuring Amplify with:", JSON.stringify(awsConfig, null, 2));
  Amplify.configure(awsConfig);

  console.log("Setting up token storage...");
  cognitoUserPoolsTokenProvider.setKeyValueStorage(AsyncStorage);

  console.log("Amplify configured successfully");
} catch (error) {
  console.error("Error configuring Amplify:", error);
  throw error; // Re-throw to make sure app doesn't continue with bad config
}
