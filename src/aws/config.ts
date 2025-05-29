import AsyncStorage from "@react-native-async-storage/async-storage";
import Amplify from "aws-amplify";

// Configure Amplify
Amplify.configure({
  Auth: {
    mandatorySignIn: true,
    region: process.env.EXPO_PUBLIC_AWS_REGION,
    userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID,
    identityPoolId: process.env.EXPO_PUBLIC_IDENTITY_POOL_ID,
    userPoolWebClientId: process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID,
    storage: AsyncStorage,
  },
});
