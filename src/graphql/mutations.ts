/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createUser = /* GraphQL */ `mutation CreateUser(
  $input: CreateUserInput!
  $condition: ModelUserConditionInput
) {
  createUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $input: UpdateUserInput!
  $condition: ModelUserConditionInput
) {
  updateUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $input: DeleteUserInput!
  $condition: ModelUserConditionInput
) {
  deleteUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const createArtwork = /* GraphQL */ `mutation CreateArtwork(
  $input: CreateArtworkInput!
  $condition: ModelArtworkConditionInput
) {
  createArtwork(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateArtworkMutationVariables,
  APITypes.CreateArtworkMutation
>;
export const updateArtwork = /* GraphQL */ `mutation UpdateArtwork(
  $input: UpdateArtworkInput!
  $condition: ModelArtworkConditionInput
) {
  updateArtwork(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateArtworkMutationVariables,
  APITypes.UpdateArtworkMutation
>;
export const deleteArtwork = /* GraphQL */ `mutation DeleteArtwork(
  $input: DeleteArtworkInput!
  $condition: ModelArtworkConditionInput
) {
  deleteArtwork(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteArtworkMutationVariables,
  APITypes.DeleteArtworkMutation
>;
export const createFavorited = /* GraphQL */ `mutation CreateFavorited(
  $input: CreateFavoritedInput!
  $condition: ModelFavoritedConditionInput
) {
  createFavorited(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateFavoritedMutationVariables,
  APITypes.CreateFavoritedMutation
>;
export const updateFavorited = /* GraphQL */ `mutation UpdateFavorited(
  $input: UpdateFavoritedInput!
  $condition: ModelFavoritedConditionInput
) {
  updateFavorited(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateFavoritedMutationVariables,
  APITypes.UpdateFavoritedMutation
>;
export const deleteFavorited = /* GraphQL */ `mutation DeleteFavorited(
  $input: DeleteFavoritedInput!
  $condition: ModelFavoritedConditionInput
) {
  deleteFavorited(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteFavoritedMutationVariables,
  APITypes.DeleteFavoritedMutation
>;
export const createVisited = /* GraphQL */ `mutation CreateVisited(
  $input: CreateVisitedInput!
  $condition: ModelVisitedConditionInput
) {
  createVisited(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateVisitedMutationVariables,
  APITypes.CreateVisitedMutation
>;
export const updateVisited = /* GraphQL */ `mutation UpdateVisited(
  $input: UpdateVisitedInput!
  $condition: ModelVisitedConditionInput
) {
  updateVisited(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateVisitedMutationVariables,
  APITypes.UpdateVisitedMutation
>;
export const deleteVisited = /* GraphQL */ `mutation DeleteVisited(
  $input: DeleteVisitedInput!
  $condition: ModelVisitedConditionInput
) {
  deleteVisited(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteVisitedMutationVariables,
  APITypes.DeleteVisitedMutation
>;
export const createDepartment = /* GraphQL */ `mutation CreateDepartment(
  $input: CreateDepartmentInput!
  $condition: ModelDepartmentConditionInput
) {
  createDepartment(input: $input, condition: $condition) {
    id
    displayName
    description
    coverImage
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateDepartmentMutationVariables,
  APITypes.CreateDepartmentMutation
>;
export const updateDepartment = /* GraphQL */ `mutation UpdateDepartment(
  $input: UpdateDepartmentInput!
  $condition: ModelDepartmentConditionInput
) {
  updateDepartment(input: $input, condition: $condition) {
    id
    displayName
    description
    coverImage
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateDepartmentMutationVariables,
  APITypes.UpdateDepartmentMutation
>;
export const deleteDepartment = /* GraphQL */ `mutation DeleteDepartment(
  $input: DeleteDepartmentInput!
  $condition: ModelDepartmentConditionInput
) {
  deleteDepartment(input: $input, condition: $condition) {
    id
    displayName
    description
    coverImage
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteDepartmentMutationVariables,
  APITypes.DeleteDepartmentMutation
>;
export const createAudioContent = /* GraphQL */ `mutation CreateAudioContent(
  $input: CreateAudioContentInput!
  $condition: ModelAudioContentConditionInput
) {
  createAudioContent(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateAudioContentMutationVariables,
  APITypes.CreateAudioContentMutation
>;
export const updateAudioContent = /* GraphQL */ `mutation UpdateAudioContent(
  $input: UpdateAudioContentInput!
  $condition: ModelAudioContentConditionInput
) {
  updateAudioContent(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateAudioContentMutationVariables,
  APITypes.UpdateAudioContentMutation
>;
export const deleteAudioContent = /* GraphQL */ `mutation DeleteAudioContent(
  $input: DeleteAudioContentInput!
  $condition: ModelAudioContentConditionInput
) {
  deleteAudioContent(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteAudioContentMutationVariables,
  APITypes.DeleteAudioContentMutation
>;
export const createArtFact = /* GraphQL */ `mutation CreateArtFact(
  $input: CreateArtFactInput!
  $condition: ModelArtFactConditionInput
) {
  createArtFact(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateArtFactMutationVariables,
  APITypes.CreateArtFactMutation
>;
export const updateArtFact = /* GraphQL */ `mutation UpdateArtFact(
  $input: UpdateArtFactInput!
  $condition: ModelArtFactConditionInput
) {
  updateArtFact(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateArtFactMutationVariables,
  APITypes.UpdateArtFactMutation
>;
export const deleteArtFact = /* GraphQL */ `mutation DeleteArtFact(
  $input: DeleteArtFactInput!
  $condition: ModelArtFactConditionInput
) {
  deleteArtFact(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteArtFactMutationVariables,
  APITypes.DeleteArtFactMutation
>;
export const createQuest = /* GraphQL */ `mutation CreateQuest(
  $input: CreateQuestInput!
  $condition: ModelQuestConditionInput
) {
  createQuest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateQuestMutationVariables,
  APITypes.CreateQuestMutation
>;
export const updateQuest = /* GraphQL */ `mutation UpdateQuest(
  $input: UpdateQuestInput!
  $condition: ModelQuestConditionInput
) {
  updateQuest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateQuestMutationVariables,
  APITypes.UpdateQuestMutation
>;
export const deleteQuest = /* GraphQL */ `mutation DeleteQuest(
  $input: DeleteQuestInput!
  $condition: ModelQuestConditionInput
) {
  deleteQuest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteQuestMutationVariables,
  APITypes.DeleteQuestMutation
>;
export const createUserQuest = /* GraphQL */ `mutation CreateUserQuest(
  $input: CreateUserQuestInput!
  $condition: ModelUserQuestConditionInput
) {
  createUserQuest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateUserQuestMutationVariables,
  APITypes.CreateUserQuestMutation
>;
export const updateUserQuest = /* GraphQL */ `mutation UpdateUserQuest(
  $input: UpdateUserQuestInput!
  $condition: ModelUserQuestConditionInput
) {
  updateUserQuest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserQuestMutationVariables,
  APITypes.UpdateUserQuestMutation
>;
export const deleteUserQuest = /* GraphQL */ `mutation DeleteUserQuest(
  $input: DeleteUserQuestInput!
  $condition: ModelUserQuestConditionInput
) {
  deleteUserQuest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserQuestMutationVariables,
  APITypes.DeleteUserQuestMutation
>;
export const createRank = /* GraphQL */ `mutation CreateRank(
  $input: CreateRankInput!
  $condition: ModelRankConditionInput
) {
  createRank(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateRankMutationVariables,
  APITypes.CreateRankMutation
>;
export const updateRank = /* GraphQL */ `mutation UpdateRank(
  $input: UpdateRankInput!
  $condition: ModelRankConditionInput
) {
  updateRank(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateRankMutationVariables,
  APITypes.UpdateRankMutation
>;
export const deleteRank = /* GraphQL */ `mutation DeleteRank(
  $input: DeleteRankInput!
  $condition: ModelRankConditionInput
) {
  deleteRank(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteRankMutationVariables,
  APITypes.DeleteRankMutation
>;
export const createUserXP = /* GraphQL */ `mutation CreateUserXP(
  $input: CreateUserXPInput!
  $condition: ModelUserXPConditionInput
) {
  createUserXP(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateUserXPMutationVariables,
  APITypes.CreateUserXPMutation
>;
export const updateUserXP = /* GraphQL */ `mutation UpdateUserXP(
  $input: UpdateUserXPInput!
  $condition: ModelUserXPConditionInput
) {
  updateUserXP(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserXPMutationVariables,
  APITypes.UpdateUserXPMutation
>;
export const deleteUserXP = /* GraphQL */ `mutation DeleteUserXP(
  $input: DeleteUserXPInput!
  $condition: ModelUserXPConditionInput
) {
  deleteUserXP(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserXPMutationVariables,
  APITypes.DeleteUserXPMutation
>;
