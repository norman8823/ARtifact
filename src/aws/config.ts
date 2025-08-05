import { cognitoUserPoolsTokenProvider } from "@aws-amplify/auth/cognito";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";
import { Amplify } from "aws-amplify";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

export const configureAmplify = async (): Promise<void> => {
  // Validate environment variables
  const requiredEnvVars = {
    region: process.env.EXPO_PUBLIC_AWS_REGION,
    userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID,
    userPoolClientId: process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID,
    bucketName: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
    identityPoolId: process.env.EXPO_PUBLIC_IDENTITY_POOL_ID,
  };

  // Check for missing environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  // Log environment variable status
  Sentry.addBreadcrumb({
    message: "AWS environment variables validation",
    category: "aws_config",
    level: missingVars.length > 0 ? "error" : "info",
    data: {
      hasRegion: !!requiredEnvVars.region,
      hasUserPoolId: !!requiredEnvVars.userPoolId,
      hasUserPoolClientId: !!requiredEnvVars.userPoolClientId,
      hasBucketName: !!requiredEnvVars.bucketName,
      hasIdentityPoolId: !!requiredEnvVars.identityPoolId,
      missingVars,
      totalMissing: missingVars.length,
    },
  });

  if (missingVars.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );

    Sentry.captureException(error, {
      tags: {
        component: "aws_config",
        action: "env_validation",
      },
      extra: {
        missingVars,
        allEnvVars: Object.keys(requiredEnvVars),
      },
    });

    throw error;
  }

  // Ensure all required values are defined
  if (
    !requiredEnvVars.region ||
    !requiredEnvVars.userPoolId ||
    !requiredEnvVars.userPoolClientId ||
    !requiredEnvVars.bucketName ||
    !requiredEnvVars.identityPoolId
  ) {
    throw new Error("Required environment variables are undefined");
  }

  try {
    // Log configuration attempt
    Sentry.addBreadcrumb({
      message: "Starting AWS Amplify configuration",
      category: "aws_config",
      level: "info",
      data: {
        region: requiredEnvVars.region,
        userPoolIdLength: requiredEnvVars.userPoolId?.length || 0,
        userPoolClientIdLength: requiredEnvVars.userPoolClientId?.length || 0,
        identityPoolIdLength: requiredEnvVars.identityPoolId?.length || 0,
        bucketNameLength: requiredEnvVars.bucketName?.length || 0,
      },
    });

    // Configure both Auth and API
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: requiredEnvVars.userPoolId,
          userPoolClientId: requiredEnvVars.userPoolClientId,
          identityPoolId: requiredEnvVars.identityPoolId,
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
            endpoint:
              "https://6nffsggmz8.execute-api.us-east-1.amazonaws.com/dev",
            region: requiredEnvVars.region,
          },
        },
      },
      Storage: {
        S3: {
          bucket: requiredEnvVars.bucketName,
          region: requiredEnvVars.region,
          buckets: {
            default: {
              bucketName: requiredEnvVars.bucketName,
              region: requiredEnvVars.region,
            },
          },
        },
      },
    });

    console.log("Setting up token storage...");

    Sentry.addBreadcrumb({
      message: "Setting up Cognito token storage with AsyncStorage",
      category: "aws_config",
      level: "info",
    });

    cognitoUserPoolsTokenProvider.setKeyValueStorage(AsyncStorage);

    Sentry.addBreadcrumb({
      message: "AWS Amplify configuration completed successfully",
      category: "aws_config",
      level: "info",
      data: {
        timestamp: new Date().toISOString(),
      },
    });

    console.log("Amplify configured successfully");
  } catch (error) {
    console.error("Error configuring Amplify:", error);

    Sentry.addBreadcrumb({
      message: "AWS Amplify configuration failed",
      category: "aws_config",
      level: "error",
      data: {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
    });

    Sentry.captureException(error, {
      tags: {
        component: "aws_config",
        action: "amplify_configure",
      },
      extra: {
        environmentVariables: {
          hasRegion: !!requiredEnvVars.region,
          hasUserPoolId: !!requiredEnvVars.userPoolId,
          hasUserPoolClientId: !!requiredEnvVars.userPoolClientId,
          hasBucketName: !!requiredEnvVars.bucketName,
          hasIdentityPoolId: !!requiredEnvVars.identityPoolId,
        },
      },
    });

    throw error; // Re-throw to make sure app doesn't continue with bad config
  }
};
