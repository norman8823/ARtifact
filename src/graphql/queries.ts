/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getUser = /* GraphQL */ `query GetUser($id: ID!) {
  getUser(id: $id) {
    id
    username
    email
    phone
    profileImage
    isPremium
    remainingFreeScans
    xpPoints
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
  listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      username
      email
      phone
      profileImage
      isPremium
      remainingFreeScans
      xpPoints
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const getFavorited = /* GraphQL */ `query GetFavorited($id: ID!) {
  getFavorited(id: $id) {
    id
    userId
    artworkId
    timestamp
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetFavoritedQueryVariables,
  APITypes.GetFavoritedQuery
>;
export const listFavoriteds = /* GraphQL */ `query ListFavoriteds(
  $filter: ModelFavoritedFilterInput
  $limit: Int
  $nextToken: String
) {
  listFavoriteds(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      artworkId
      timestamp
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListFavoritedsQueryVariables,
  APITypes.ListFavoritedsQuery
>;
export const getVisited = /* GraphQL */ `query GetVisited($id: ID!) {
  getVisited(id: $id) {
    id
    userId
    artworkId
    timestamp
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetVisitedQueryVariables,
  APITypes.GetVisitedQuery
>;
export const listVisiteds = /* GraphQL */ `query ListVisiteds(
  $filter: ModelVisitedFilterInput
  $limit: Int
  $nextToken: String
) {
  listVisiteds(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      artworkId
      timestamp
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListVisitedsQueryVariables,
  APITypes.ListVisitedsQuery
>;
export const getUserQuest = /* GraphQL */ `query GetUserQuest($id: ID!) {
  getUserQuest(id: $id) {
    id
    userId
    questId
    title
    description
    icon
    xpReward
    requiredArtworks
    artworksVisited
    galleryMap
    isCompleted
    timestamp
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetUserQuestQueryVariables,
  APITypes.GetUserQuestQuery
>;
export const listUserQuests = /* GraphQL */ `query ListUserQuests(
  $filter: ModelUserQuestFilterInput
  $limit: Int
  $nextToken: String
) {
  listUserQuests(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      questId
      title
      description
      icon
      xpReward
      requiredArtworks
      artworksVisited
      galleryMap
      isCompleted
      timestamp
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUserQuestsQueryVariables,
  APITypes.ListUserQuestsQuery
>;
export const getUserXP = /* GraphQL */ `query GetUserXP($id: ID!) {
  getUserXP(id: $id) {
    id
    userId
    xpPoints
    timestamp
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserXPQueryVariables, APITypes.GetUserXPQuery>;
export const listUserXPS = /* GraphQL */ `query ListUserXPS(
  $filter: ModelUserXPFilterInput
  $limit: Int
  $nextToken: String
) {
  listUserXPS(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      xpPoints
      timestamp
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUserXPSQueryVariables,
  APITypes.ListUserXPSQuery
>;
export const favoritedsByUserIdAndArtworkId = /* GraphQL */ `query FavoritedsByUserIdAndArtworkId(
  $userId: ID!
  $artworkId: ModelIDKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelFavoritedFilterInput
  $limit: Int
  $nextToken: String
) {
  favoritedsByUserIdAndArtworkId(
    userId: $userId
    artworkId: $artworkId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userId
      artworkId
      timestamp
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.FavoritedsByUserIdAndArtworkIdQueryVariables,
  APITypes.FavoritedsByUserIdAndArtworkIdQuery
>;
export const visitedsByUserIdAndArtworkId = /* GraphQL */ `query VisitedsByUserIdAndArtworkId(
  $userId: ID!
  $artworkId: ModelIDKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelVisitedFilterInput
  $limit: Int
  $nextToken: String
) {
  visitedsByUserIdAndArtworkId(
    userId: $userId
    artworkId: $artworkId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userId
      artworkId
      timestamp
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.VisitedsByUserIdAndArtworkIdQueryVariables,
  APITypes.VisitedsByUserIdAndArtworkIdQuery
>;
export const userQuestsByUserIdAndQuestId = /* GraphQL */ `query UserQuestsByUserIdAndQuestId(
  $userId: ID!
  $questId: ModelIDKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelUserQuestFilterInput
  $limit: Int
  $nextToken: String
) {
  userQuestsByUserIdAndQuestId(
    userId: $userId
    questId: $questId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userId
      questId
      title
      description
      icon
      xpReward
      requiredArtworks
      artworksVisited
      galleryMap
      isCompleted
      timestamp
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.UserQuestsByUserIdAndQuestIdQueryVariables,
  APITypes.UserQuestsByUserIdAndQuestIdQuery
>;
export const userXPSByUserIdAndTimestamp = /* GraphQL */ `query UserXPSByUserIdAndTimestamp(
  $userId: ID!
  $timestamp: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelUserXPFilterInput
  $limit: Int
  $nextToken: String
) {
  userXPSByUserIdAndTimestamp(
    userId: $userId
    timestamp: $timestamp
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userId
      xpPoints
      timestamp
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.UserXPSByUserIdAndTimestampQueryVariables,
  APITypes.UserXPSByUserIdAndTimestampQuery
>;
export const getArtwork = /* GraphQL */ `query GetArtwork($id: ID!) {
  getArtwork(id: $id) {
    id
    isCurated
    isFeatured
    hasAudio
    hasAR
    primaryImage
    primaryImageSmall
    additionalImages
    arImage
    departmentId
    department
    departmentDescription
    departmentImageUrl
    objectType
    title
    culture
    artistDisplayName
    objectDate
    objectURL
    medium
    dimensions
    classification
    galleryNumber
    tags
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetArtworkQueryVariables,
  APITypes.GetArtworkQuery
>;
export const listArtworks = /* GraphQL */ `query ListArtworks(
  $filter: ModelArtworkFilterInput
  $limit: Int
  $nextToken: String
) {
  listArtworks(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      isCurated
      isFeatured
      hasAudio
      hasAR
      primaryImage
      primaryImageSmall
      additionalImages
      arImage
      departmentId
      department
      departmentDescription
      departmentImageUrl
      objectType
      title
      culture
      artistDisplayName
      objectDate
      objectURL
      medium
      dimensions
      classification
      galleryNumber
      tags
      description
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListArtworksQueryVariables,
  APITypes.ListArtworksQuery
>;
export const getDepartment = /* GraphQL */ `query GetDepartment($id: ID!) {
  getDepartment(id: $id) {
    id
    displayName
    description
    coverImage
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetDepartmentQueryVariables,
  APITypes.GetDepartmentQuery
>;
export const listDepartments = /* GraphQL */ `query ListDepartments(
  $filter: ModelDepartmentFilterInput
  $limit: Int
  $nextToken: String
) {
  listDepartments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      displayName
      description
      coverImage
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListDepartmentsQueryVariables,
  APITypes.ListDepartmentsQuery
>;
export const getAudioContent = /* GraphQL */ `query GetAudioContent($id: ID!) {
  getAudioContent(id: $id) {
    id
    artworkId
    audioURL
    transcript
    duration
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAudioContentQueryVariables,
  APITypes.GetAudioContentQuery
>;
export const listAudioContents = /* GraphQL */ `query ListAudioContents(
  $filter: ModelAudioContentFilterInput
  $limit: Int
  $nextToken: String
) {
  listAudioContents(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      artworkId
      audioURL
      transcript
      duration
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAudioContentsQueryVariables,
  APITypes.ListAudioContentsQuery
>;
export const audioContentsByArtworkIdAndId = /* GraphQL */ `query AudioContentsByArtworkIdAndId(
  $artworkId: ID!
  $id: ModelIDKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelAudioContentFilterInput
  $limit: Int
  $nextToken: String
) {
  audioContentsByArtworkIdAndId(
    artworkId: $artworkId
    id: $id
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      artworkId
      audioURL
      transcript
      duration
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.AudioContentsByArtworkIdAndIdQueryVariables,
  APITypes.AudioContentsByArtworkIdAndIdQuery
>;
export const getArtFact = /* GraphQL */ `query GetArtFact($id: ID!) {
  getArtFact(id: $id) {
    id
    artworkId
    content
    isActive
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetArtFactQueryVariables,
  APITypes.GetArtFactQuery
>;
export const listArtFacts = /* GraphQL */ `query ListArtFacts(
  $filter: ModelArtFactFilterInput
  $limit: Int
  $nextToken: String
) {
  listArtFacts(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      artworkId
      content
      isActive
      timestamp
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListArtFactsQueryVariables,
  APITypes.ListArtFactsQuery
>;
export const artFactsByArtworkIdAndTimestamp = /* GraphQL */ `query ArtFactsByArtworkIdAndTimestamp(
  $artworkId: ID!
  $timestamp: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelArtFactFilterInput
  $limit: Int
  $nextToken: String
) {
  artFactsByArtworkIdAndTimestamp(
    artworkId: $artworkId
    timestamp: $timestamp
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      artworkId
      content
      isActive
      timestamp
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ArtFactsByArtworkIdAndTimestampQueryVariables,
  APITypes.ArtFactsByArtworkIdAndTimestampQuery
>;
export const getQuest = /* GraphQL */ `query GetQuest($id: ID!) {
  getQuest(id: $id) {
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
}
` as GeneratedQuery<APITypes.GetQuestQueryVariables, APITypes.GetQuestQuery>;
export const listQuests = /* GraphQL */ `query ListQuests(
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
}
` as GeneratedQuery<
  APITypes.ListQuestsQueryVariables,
  APITypes.ListQuestsQuery
>;
export const getRank = /* GraphQL */ `query GetRank($id: ID!) {
  getRank(id: $id) {
    id
    title
    minXP
    maxXP
    icon
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetRankQueryVariables, APITypes.GetRankQuery>;
export const listRanks = /* GraphQL */ `query ListRanks(
  $filter: ModelRankFilterInput
  $limit: Int
  $nextToken: String
) {
  listRanks(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      minXP
      maxXP
      icon
      description
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListRanksQueryVariables, APITypes.ListRanksQuery>;
