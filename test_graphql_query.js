const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/api');
require('dotenv').config();

// Configure Amplify with the same settings as the app
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID,
      userPoolClientId: process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID,
      identityPoolId: process.env.EXPO_PUBLIC_IDENTITY_POOL_ID,
    },
  },
  API: {
    GraphQL: {
      endpoint: "https://pxkzi6ejozb2pnbdngzlqzecdu.appsync-api.us-east-1.amazonaws.com/graphql",
      region: process.env.EXPO_PUBLIC_AWS_REGION,
      defaultAuthMode: "apiKey", // Use API key instead of user pool for testing
    },
  },
});

const listQuestsQuery = `query ListQuests(
  $filter: ModelQuestFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuests(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      description
      icon
      xpReward
      requiredArtworks
      isPremium
      galleryMap
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}`;

async function testGraphQLQuery() {
  console.log("🔍 Testing GraphQL query directly...\n");

  try {
    const client = generateClient();
    const result = await client.graphql({
      query: listQuestsQuery,
      variables: {
        limit: 1000,
      },
      authMode: "apiKey",
    });

    if (result.data && result.data.listQuests && result.data.listQuests.items) {
      console.log(`Found ${result.data.listQuests.items.length} quests from GraphQL\n`);

      // Show first 3 quest descriptions
      result.data.listQuests.items.slice(0, 3).forEach((quest, index) => {
        console.log(`Quest ${index + 1}: ${quest.title}`);
        console.log(`Description: ${quest.description}`);
        console.log(`---`);
      });
    } else {
      console.log("No quests found in GraphQL response");
    }

  } catch (error) {
    console.error("Error querying GraphQL:", error);

    // Try with public access
    console.log("\nTrying with public access...");
    try {
      const client = generateClient();
      const result = await client.graphql({
        query: listQuestsQuery,
        variables: {
          limit: 1000,
        },
        authMode: "public",
      });

      if (result.data && result.data.listQuests && result.data.listQuests.items) {
        console.log(`Found ${result.data.listQuests.items.length} quests from GraphQL (public)\n`);

        // Show first 3 quest descriptions
        result.data.listQuests.items.slice(0, 3).forEach((quest, index) => {
          console.log(`Quest ${index + 1}: ${quest.title}`);
          console.log(`Description: ${quest.description}`);
          console.log(`---`);
        });
      }
    } catch (publicError) {
      console.error("Public access also failed:", publicError);
    }
  }
}

testGraphQLQuery();