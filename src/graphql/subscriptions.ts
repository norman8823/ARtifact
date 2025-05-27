/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateUser = /* GraphQL */ `subscription OnCreateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onCreateUser(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onUpdateUser(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onDeleteUser(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onCreateFavorited = /* GraphQL */ `subscription OnCreateFavorited(
  $filter: ModelSubscriptionFavoritedFilterInput
  $owner: String
) {
  onCreateFavorited(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateFavoritedSubscriptionVariables,
  APITypes.OnCreateFavoritedSubscription
>;
export const onUpdateFavorited = /* GraphQL */ `subscription OnUpdateFavorited(
  $filter: ModelSubscriptionFavoritedFilterInput
  $owner: String
) {
  onUpdateFavorited(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateFavoritedSubscriptionVariables,
  APITypes.OnUpdateFavoritedSubscription
>;
export const onDeleteFavorited = /* GraphQL */ `subscription OnDeleteFavorited(
  $filter: ModelSubscriptionFavoritedFilterInput
  $owner: String
) {
  onDeleteFavorited(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteFavoritedSubscriptionVariables,
  APITypes.OnDeleteFavoritedSubscription
>;
export const onCreateVisited = /* GraphQL */ `subscription OnCreateVisited(
  $filter: ModelSubscriptionVisitedFilterInput
  $owner: String
) {
  onCreateVisited(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateVisitedSubscriptionVariables,
  APITypes.OnCreateVisitedSubscription
>;
export const onUpdateVisited = /* GraphQL */ `subscription OnUpdateVisited(
  $filter: ModelSubscriptionVisitedFilterInput
  $owner: String
) {
  onUpdateVisited(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateVisitedSubscriptionVariables,
  APITypes.OnUpdateVisitedSubscription
>;
export const onDeleteVisited = /* GraphQL */ `subscription OnDeleteVisited(
  $filter: ModelSubscriptionVisitedFilterInput
  $owner: String
) {
  onDeleteVisited(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteVisitedSubscriptionVariables,
  APITypes.OnDeleteVisitedSubscription
>;
export const onCreateUserQuest = /* GraphQL */ `subscription OnCreateUserQuest(
  $filter: ModelSubscriptionUserQuestFilterInput
  $owner: String
) {
  onCreateUserQuest(filter: $filter, owner: $owner) {
    id
    userId
    questId
    artworksVisited
    isCompleted
    timestamp
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateUserQuestSubscriptionVariables,
  APITypes.OnCreateUserQuestSubscription
>;
export const onUpdateUserQuest = /* GraphQL */ `subscription OnUpdateUserQuest(
  $filter: ModelSubscriptionUserQuestFilterInput
  $owner: String
) {
  onUpdateUserQuest(filter: $filter, owner: $owner) {
    id
    userId
    questId
    artworksVisited
    isCompleted
    timestamp
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateUserQuestSubscriptionVariables,
  APITypes.OnUpdateUserQuestSubscription
>;
export const onDeleteUserQuest = /* GraphQL */ `subscription OnDeleteUserQuest(
  $filter: ModelSubscriptionUserQuestFilterInput
  $owner: String
) {
  onDeleteUserQuest(filter: $filter, owner: $owner) {
    id
    userId
    questId
    artworksVisited
    isCompleted
    timestamp
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteUserQuestSubscriptionVariables,
  APITypes.OnDeleteUserQuestSubscription
>;
export const onCreateUserXP = /* GraphQL */ `subscription OnCreateUserXP(
  $filter: ModelSubscriptionUserXPFilterInput
  $owner: String
) {
  onCreateUserXP(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserXPSubscriptionVariables,
  APITypes.OnCreateUserXPSubscription
>;
export const onUpdateUserXP = /* GraphQL */ `subscription OnUpdateUserXP(
  $filter: ModelSubscriptionUserXPFilterInput
  $owner: String
) {
  onUpdateUserXP(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserXPSubscriptionVariables,
  APITypes.OnUpdateUserXPSubscription
>;
export const onDeleteUserXP = /* GraphQL */ `subscription OnDeleteUserXP(
  $filter: ModelSubscriptionUserXPFilterInput
  $owner: String
) {
  onDeleteUserXP(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserXPSubscriptionVariables,
  APITypes.OnDeleteUserXPSubscription
>;
export const onCreateArtwork = /* GraphQL */ `subscription OnCreateArtwork($filter: ModelSubscriptionArtworkFilterInput) {
  onCreateArtwork(filter: $filter) {
    id
    isCurated
    isFeatured
    hasAudio
    primaryImage
    primaryImageSmall
    additionalImages
    departmentId
    department
    objectType
    title
    culture
    artistDisplayName
    objectDate
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
` as GeneratedSubscription<
  APITypes.OnCreateArtworkSubscriptionVariables,
  APITypes.OnCreateArtworkSubscription
>;
export const onUpdateArtwork = /* GraphQL */ `subscription OnUpdateArtwork($filter: ModelSubscriptionArtworkFilterInput) {
  onUpdateArtwork(filter: $filter) {
    id
    isCurated
    isFeatured
    hasAudio
    primaryImage
    primaryImageSmall
    additionalImages
    departmentId
    department
    objectType
    title
    culture
    artistDisplayName
    objectDate
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
` as GeneratedSubscription<
  APITypes.OnUpdateArtworkSubscriptionVariables,
  APITypes.OnUpdateArtworkSubscription
>;
export const onDeleteArtwork = /* GraphQL */ `subscription OnDeleteArtwork($filter: ModelSubscriptionArtworkFilterInput) {
  onDeleteArtwork(filter: $filter) {
    id
    isCurated
    isFeatured
    hasAudio
    primaryImage
    primaryImageSmall
    additionalImages
    departmentId
    department
    objectType
    title
    culture
    artistDisplayName
    objectDate
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
` as GeneratedSubscription<
  APITypes.OnDeleteArtworkSubscriptionVariables,
  APITypes.OnDeleteArtworkSubscription
>;
export const onCreateDepartment = /* GraphQL */ `subscription OnCreateDepartment(
  $filter: ModelSubscriptionDepartmentFilterInput
) {
  onCreateDepartment(filter: $filter) {
    id
    displayName
    description
    coverImage
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateDepartmentSubscriptionVariables,
  APITypes.OnCreateDepartmentSubscription
>;
export const onUpdateDepartment = /* GraphQL */ `subscription OnUpdateDepartment(
  $filter: ModelSubscriptionDepartmentFilterInput
) {
  onUpdateDepartment(filter: $filter) {
    id
    displayName
    description
    coverImage
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateDepartmentSubscriptionVariables,
  APITypes.OnUpdateDepartmentSubscription
>;
export const onDeleteDepartment = /* GraphQL */ `subscription OnDeleteDepartment(
  $filter: ModelSubscriptionDepartmentFilterInput
) {
  onDeleteDepartment(filter: $filter) {
    id
    displayName
    description
    coverImage
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteDepartmentSubscriptionVariables,
  APITypes.OnDeleteDepartmentSubscription
>;
export const onCreateAudioContent = /* GraphQL */ `subscription OnCreateAudioContent(
  $filter: ModelSubscriptionAudioContentFilterInput
) {
  onCreateAudioContent(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAudioContentSubscriptionVariables,
  APITypes.OnCreateAudioContentSubscription
>;
export const onUpdateAudioContent = /* GraphQL */ `subscription OnUpdateAudioContent(
  $filter: ModelSubscriptionAudioContentFilterInput
) {
  onUpdateAudioContent(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAudioContentSubscriptionVariables,
  APITypes.OnUpdateAudioContentSubscription
>;
export const onDeleteAudioContent = /* GraphQL */ `subscription OnDeleteAudioContent(
  $filter: ModelSubscriptionAudioContentFilterInput
) {
  onDeleteAudioContent(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAudioContentSubscriptionVariables,
  APITypes.OnDeleteAudioContentSubscription
>;
export const onCreateArtFact = /* GraphQL */ `subscription OnCreateArtFact($filter: ModelSubscriptionArtFactFilterInput) {
  onCreateArtFact(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateArtFactSubscriptionVariables,
  APITypes.OnCreateArtFactSubscription
>;
export const onUpdateArtFact = /* GraphQL */ `subscription OnUpdateArtFact($filter: ModelSubscriptionArtFactFilterInput) {
  onUpdateArtFact(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateArtFactSubscriptionVariables,
  APITypes.OnUpdateArtFactSubscription
>;
export const onDeleteArtFact = /* GraphQL */ `subscription OnDeleteArtFact($filter: ModelSubscriptionArtFactFilterInput) {
  onDeleteArtFact(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteArtFactSubscriptionVariables,
  APITypes.OnDeleteArtFactSubscription
>;
export const onCreateQuest = /* GraphQL */ `subscription OnCreateQuest($filter: ModelSubscriptionQuestFilterInput) {
  onCreateQuest(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateQuestSubscriptionVariables,
  APITypes.OnCreateQuestSubscription
>;
export const onUpdateQuest = /* GraphQL */ `subscription OnUpdateQuest($filter: ModelSubscriptionQuestFilterInput) {
  onUpdateQuest(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateQuestSubscriptionVariables,
  APITypes.OnUpdateQuestSubscription
>;
export const onDeleteQuest = /* GraphQL */ `subscription OnDeleteQuest($filter: ModelSubscriptionQuestFilterInput) {
  onDeleteQuest(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteQuestSubscriptionVariables,
  APITypes.OnDeleteQuestSubscription
>;
export const onCreateRank = /* GraphQL */ `subscription OnCreateRank($filter: ModelSubscriptionRankFilterInput) {
  onCreateRank(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateRankSubscriptionVariables,
  APITypes.OnCreateRankSubscription
>;
export const onUpdateRank = /* GraphQL */ `subscription OnUpdateRank($filter: ModelSubscriptionRankFilterInput) {
  onUpdateRank(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateRankSubscriptionVariables,
  APITypes.OnUpdateRankSubscription
>;
export const onDeleteRank = /* GraphQL */ `subscription OnDeleteRank($filter: ModelSubscriptionRankFilterInput) {
  onDeleteRank(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteRankSubscriptionVariables,
  APITypes.OnDeleteRankSubscription
>;
