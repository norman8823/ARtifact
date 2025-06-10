/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateUserInput = {
  id?: string | null,
  username: string,
  email: string,
  phone?: string | null,
  profileImage?: string | null,
  isPremium?: boolean | null,
  remainingFreeScans?: number | null,
  xpPoints?: number | null,
};

export type ModelUserConditionInput = {
  username?: ModelStringInput | null,
  email?: ModelStringInput | null,
  phone?: ModelStringInput | null,
  profileImage?: ModelStringInput | null,
  isPremium?: ModelBooleanInput | null,
  remainingFreeScans?: ModelIntInput | null,
  xpPoints?: ModelIntInput | null,
  and?: Array< ModelUserConditionInput | null > | null,
  or?: Array< ModelUserConditionInput | null > | null,
  not?: ModelUserConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  owner?: ModelStringInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type ModelBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type User = {
  __typename: "User",
  id: string,
  username: string,
  email: string,
  phone?: string | null,
  profileImage?: string | null,
  isPremium?: boolean | null,
  remainingFreeScans?: number | null,
  xpPoints?: number | null,
  createdAt: string,
  updatedAt: string,
  owner?: string | null,
};

export type UpdateUserInput = {
  id: string,
  username?: string | null,
  email?: string | null,
  phone?: string | null,
  profileImage?: string | null,
  isPremium?: boolean | null,
  remainingFreeScans?: number | null,
  xpPoints?: number | null,
};

export type DeleteUserInput = {
  id: string,
};

export type CreateArtworkInput = {
  id?: string | null,
  isCurated?: boolean | null,
  isFeatured?: boolean | null,
  hasAudio?: boolean | null,
  hasAR?: boolean | null,
  primaryImage?: string | null,
  primaryImageSmall?: string | null,
  additionalImages?: Array< string | null > | null,
  arImage?: string | null,
  departmentId: string,
  department?: string | null,
  departmentDescription?: string | null,
  departmentImageUrl?: string | null,
  objectType?: string | null,
  title: string,
  culture?: string | null,
  artistDisplayName?: string | null,
  objectDate?: string | null,
  objectURL?: string | null,
  medium?: string | null,
  dimensions?: string | null,
  classification?: string | null,
  galleryNumber?: string | null,
  tags?: Array< string | null > | null,
  description?: string | null,
};

export type ModelArtworkConditionInput = {
  isCurated?: ModelBooleanInput | null,
  isFeatured?: ModelBooleanInput | null,
  hasAudio?: ModelBooleanInput | null,
  hasAR?: ModelBooleanInput | null,
  primaryImage?: ModelStringInput | null,
  primaryImageSmall?: ModelStringInput | null,
  additionalImages?: ModelStringInput | null,
  arImage?: ModelStringInput | null,
  departmentId?: ModelIDInput | null,
  department?: ModelStringInput | null,
  departmentDescription?: ModelStringInput | null,
  departmentImageUrl?: ModelStringInput | null,
  objectType?: ModelStringInput | null,
  title?: ModelStringInput | null,
  culture?: ModelStringInput | null,
  artistDisplayName?: ModelStringInput | null,
  objectDate?: ModelStringInput | null,
  objectURL?: ModelStringInput | null,
  medium?: ModelStringInput | null,
  dimensions?: ModelStringInput | null,
  classification?: ModelStringInput | null,
  galleryNumber?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  description?: ModelStringInput | null,
  and?: Array< ModelArtworkConditionInput | null > | null,
  or?: Array< ModelArtworkConditionInput | null > | null,
  not?: ModelArtworkConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type Artwork = {
  __typename: "Artwork",
  id: string,
  isCurated?: boolean | null,
  isFeatured?: boolean | null,
  hasAudio?: boolean | null,
  hasAR?: boolean | null,
  primaryImage?: string | null,
  primaryImageSmall?: string | null,
  additionalImages?: Array< string | null > | null,
  arImage?: string | null,
  departmentId: string,
  department?: string | null,
  departmentDescription?: string | null,
  departmentImageUrl?: string | null,
  objectType?: string | null,
  title: string,
  culture?: string | null,
  artistDisplayName?: string | null,
  objectDate?: string | null,
  objectURL?: string | null,
  medium?: string | null,
  dimensions?: string | null,
  classification?: string | null,
  galleryNumber?: string | null,
  tags?: Array< string | null > | null,
  description?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateArtworkInput = {
  id: string,
  isCurated?: boolean | null,
  isFeatured?: boolean | null,
  hasAudio?: boolean | null,
  hasAR?: boolean | null,
  primaryImage?: string | null,
  primaryImageSmall?: string | null,
  additionalImages?: Array< string | null > | null,
  arImage?: string | null,
  departmentId?: string | null,
  department?: string | null,
  departmentDescription?: string | null,
  departmentImageUrl?: string | null,
  objectType?: string | null,
  title?: string | null,
  culture?: string | null,
  artistDisplayName?: string | null,
  objectDate?: string | null,
  objectURL?: string | null,
  medium?: string | null,
  dimensions?: string | null,
  classification?: string | null,
  galleryNumber?: string | null,
  tags?: Array< string | null > | null,
  description?: string | null,
};

export type DeleteArtworkInput = {
  id: string,
};

export type CreateFavoritedInput = {
  id?: string | null,
  userId: string,
  artworkId: string,
  timestamp?: string | null,
};

export type ModelFavoritedConditionInput = {
  userId?: ModelIDInput | null,
  artworkId?: ModelIDInput | null,
  timestamp?: ModelStringInput | null,
  and?: Array< ModelFavoritedConditionInput | null > | null,
  or?: Array< ModelFavoritedConditionInput | null > | null,
  not?: ModelFavoritedConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  owner?: ModelStringInput | null,
};

export type Favorited = {
  __typename: "Favorited",
  id: string,
  userId: string,
  artworkId: string,
  timestamp?: string | null,
  createdAt: string,
  updatedAt: string,
  owner?: string | null,
};

export type UpdateFavoritedInput = {
  id: string,
  userId?: string | null,
  artworkId?: string | null,
  timestamp?: string | null,
};

export type DeleteFavoritedInput = {
  id: string,
};

export type CreateVisitedInput = {
  id?: string | null,
  userId: string,
  artworkId: string,
  timestamp?: string | null,
};

export type ModelVisitedConditionInput = {
  userId?: ModelIDInput | null,
  artworkId?: ModelIDInput | null,
  timestamp?: ModelStringInput | null,
  and?: Array< ModelVisitedConditionInput | null > | null,
  or?: Array< ModelVisitedConditionInput | null > | null,
  not?: ModelVisitedConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  owner?: ModelStringInput | null,
};

export type Visited = {
  __typename: "Visited",
  id: string,
  userId: string,
  artworkId: string,
  timestamp?: string | null,
  createdAt: string,
  updatedAt: string,
  owner?: string | null,
};

export type UpdateVisitedInput = {
  id: string,
  userId?: string | null,
  artworkId?: string | null,
  timestamp?: string | null,
};

export type DeleteVisitedInput = {
  id: string,
};

export type CreateDepartmentInput = {
  id?: string | null,
  displayName: string,
  description?: string | null,
  coverImage?: string | null,
};

export type ModelDepartmentConditionInput = {
  displayName?: ModelStringInput | null,
  description?: ModelStringInput | null,
  coverImage?: ModelStringInput | null,
  and?: Array< ModelDepartmentConditionInput | null > | null,
  or?: Array< ModelDepartmentConditionInput | null > | null,
  not?: ModelDepartmentConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type Department = {
  __typename: "Department",
  id: string,
  displayName: string,
  description?: string | null,
  coverImage?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateDepartmentInput = {
  id: string,
  displayName?: string | null,
  description?: string | null,
  coverImage?: string | null,
};

export type DeleteDepartmentInput = {
  id: string,
};

export type CreateAudioContentInput = {
  id?: string | null,
  artworkId: string,
  audioURL?: string | null,
  transcript?: string | null,
  duration?: number | null,
};

export type ModelAudioContentConditionInput = {
  artworkId?: ModelIDInput | null,
  audioURL?: ModelStringInput | null,
  transcript?: ModelStringInput | null,
  duration?: ModelIntInput | null,
  and?: Array< ModelAudioContentConditionInput | null > | null,
  or?: Array< ModelAudioContentConditionInput | null > | null,
  not?: ModelAudioContentConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type AudioContent = {
  __typename: "AudioContent",
  id: string,
  artworkId: string,
  audioURL?: string | null,
  transcript?: string | null,
  duration?: number | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateAudioContentInput = {
  id: string,
  artworkId?: string | null,
  audioURL?: string | null,
  transcript?: string | null,
  duration?: number | null,
};

export type DeleteAudioContentInput = {
  id: string,
};

export type CreateArtFactInput = {
  id?: string | null,
  artworkId: string,
  content?: string | null,
  isActive?: boolean | null,
  timestamp?: string | null,
};

export type ModelArtFactConditionInput = {
  artworkId?: ModelIDInput | null,
  content?: ModelStringInput | null,
  isActive?: ModelBooleanInput | null,
  timestamp?: ModelStringInput | null,
  and?: Array< ModelArtFactConditionInput | null > | null,
  or?: Array< ModelArtFactConditionInput | null > | null,
  not?: ModelArtFactConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ArtFact = {
  __typename: "ArtFact",
  id: string,
  artworkId: string,
  content?: string | null,
  isActive?: boolean | null,
  timestamp?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateArtFactInput = {
  id: string,
  artworkId?: string | null,
  content?: string | null,
  isActive?: boolean | null,
  timestamp?: string | null,
};

export type DeleteArtFactInput = {
  id: string,
};

export type CreateQuestInput = {
  id?: string | null,
  title: string,
  description?: string | null,
  icon?: string | null,
  xpReward?: number | null,
  requiredArtworks?: Array< string | null > | null,
  isPremium?: boolean | null,
  galleryMap?: string | null,
};

export type ModelQuestConditionInput = {
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  icon?: ModelStringInput | null,
  xpReward?: ModelIntInput | null,
  requiredArtworks?: ModelStringInput | null,
  isPremium?: ModelBooleanInput | null,
  galleryMap?: ModelStringInput | null,
  and?: Array< ModelQuestConditionInput | null > | null,
  or?: Array< ModelQuestConditionInput | null > | null,
  not?: ModelQuestConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type Quest = {
  __typename: "Quest",
  id: string,
  title: string,
  description?: string | null,
  icon?: string | null,
  xpReward?: number | null,
  requiredArtworks?: Array< string | null > | null,
  isPremium?: boolean | null,
  galleryMap?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateQuestInput = {
  id: string,
  title?: string | null,
  description?: string | null,
  icon?: string | null,
  xpReward?: number | null,
  requiredArtworks?: Array< string | null > | null,
  isPremium?: boolean | null,
  galleryMap?: string | null,
};

export type DeleteQuestInput = {
  id: string,
};

export type CreateUserQuestInput = {
  id?: string | null,
  userId: string,
  questId: string,
  title: string,
  description?: string | null,
  icon?: string | null,
  xpReward?: number | null,
  requiredArtworks?: Array< string | null > | null,
  artworksVisited?: Array< string | null > | null,
  galleryMap?: string | null,
  isCompleted?: boolean | null,
  timestamp?: string | null,
};

export type ModelUserQuestConditionInput = {
  userId?: ModelIDInput | null,
  questId?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  icon?: ModelStringInput | null,
  xpReward?: ModelIntInput | null,
  requiredArtworks?: ModelStringInput | null,
  artworksVisited?: ModelStringInput | null,
  galleryMap?: ModelStringInput | null,
  isCompleted?: ModelBooleanInput | null,
  timestamp?: ModelStringInput | null,
  and?: Array< ModelUserQuestConditionInput | null > | null,
  or?: Array< ModelUserQuestConditionInput | null > | null,
  not?: ModelUserQuestConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  owner?: ModelStringInput | null,
};

export type UserQuest = {
  __typename: "UserQuest",
  id: string,
  userId: string,
  questId: string,
  title: string,
  description?: string | null,
  icon?: string | null,
  xpReward?: number | null,
  requiredArtworks?: Array< string | null > | null,
  artworksVisited?: Array< string | null > | null,
  galleryMap?: string | null,
  isCompleted?: boolean | null,
  timestamp?: string | null,
  createdAt: string,
  updatedAt: string,
  owner?: string | null,
};

export type UpdateUserQuestInput = {
  id: string,
  userId?: string | null,
  questId?: string | null,
  title?: string | null,
  description?: string | null,
  icon?: string | null,
  xpReward?: number | null,
  requiredArtworks?: Array< string | null > | null,
  artworksVisited?: Array< string | null > | null,
  galleryMap?: string | null,
  isCompleted?: boolean | null,
  timestamp?: string | null,
};

export type DeleteUserQuestInput = {
  id: string,
};

export type CreateRankInput = {
  id?: string | null,
  title: string,
  minXP?: number | null,
  maxXP?: number | null,
  icon?: string | null,
  description?: string | null,
};

export type ModelRankConditionInput = {
  title?: ModelStringInput | null,
  minXP?: ModelIntInput | null,
  maxXP?: ModelIntInput | null,
  icon?: ModelStringInput | null,
  description?: ModelStringInput | null,
  and?: Array< ModelRankConditionInput | null > | null,
  or?: Array< ModelRankConditionInput | null > | null,
  not?: ModelRankConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type Rank = {
  __typename: "Rank",
  id: string,
  title: string,
  minXP?: number | null,
  maxXP?: number | null,
  icon?: string | null,
  description?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateRankInput = {
  id: string,
  title?: string | null,
  minXP?: number | null,
  maxXP?: number | null,
  icon?: string | null,
  description?: string | null,
};

export type DeleteRankInput = {
  id: string,
};

export type CreateUserXPInput = {
  id?: string | null,
  userId: string,
  xpPoints?: number | null,
  timestamp?: string | null,
};

export type ModelUserXPConditionInput = {
  userId?: ModelIDInput | null,
  xpPoints?: ModelIntInput | null,
  timestamp?: ModelStringInput | null,
  and?: Array< ModelUserXPConditionInput | null > | null,
  or?: Array< ModelUserXPConditionInput | null > | null,
  not?: ModelUserXPConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  owner?: ModelStringInput | null,
};

export type UserXP = {
  __typename: "UserXP",
  id: string,
  userId: string,
  xpPoints?: number | null,
  timestamp?: string | null,
  createdAt: string,
  updatedAt: string,
  owner?: string | null,
};

export type UpdateUserXPInput = {
  id: string,
  userId?: string | null,
  xpPoints?: number | null,
  timestamp?: string | null,
};

export type DeleteUserXPInput = {
  id: string,
};

export type ModelUserFilterInput = {
  id?: ModelIDInput | null,
  username?: ModelStringInput | null,
  email?: ModelStringInput | null,
  phone?: ModelStringInput | null,
  profileImage?: ModelStringInput | null,
  isPremium?: ModelBooleanInput | null,
  remainingFreeScans?: ModelIntInput | null,
  xpPoints?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserFilterInput | null > | null,
  or?: Array< ModelUserFilterInput | null > | null,
  not?: ModelUserFilterInput | null,
  owner?: ModelStringInput | null,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
};

export type ModelFavoritedFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  artworkId?: ModelIDInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelFavoritedFilterInput | null > | null,
  or?: Array< ModelFavoritedFilterInput | null > | null,
  not?: ModelFavoritedFilterInput | null,
  owner?: ModelStringInput | null,
};

export type ModelFavoritedConnection = {
  __typename: "ModelFavoritedConnection",
  items:  Array<Favorited | null >,
  nextToken?: string | null,
};

export type ModelVisitedFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  artworkId?: ModelIDInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelVisitedFilterInput | null > | null,
  or?: Array< ModelVisitedFilterInput | null > | null,
  not?: ModelVisitedFilterInput | null,
  owner?: ModelStringInput | null,
};

export type ModelVisitedConnection = {
  __typename: "ModelVisitedConnection",
  items:  Array<Visited | null >,
  nextToken?: string | null,
};

export type ModelUserQuestFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  questId?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  icon?: ModelStringInput | null,
  xpReward?: ModelIntInput | null,
  requiredArtworks?: ModelStringInput | null,
  artworksVisited?: ModelStringInput | null,
  galleryMap?: ModelStringInput | null,
  isCompleted?: ModelBooleanInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserQuestFilterInput | null > | null,
  or?: Array< ModelUserQuestFilterInput | null > | null,
  not?: ModelUserQuestFilterInput | null,
  owner?: ModelStringInput | null,
};

export type ModelUserQuestConnection = {
  __typename: "ModelUserQuestConnection",
  items:  Array<UserQuest | null >,
  nextToken?: string | null,
};

export type ModelUserXPFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  xpPoints?: ModelIntInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserXPFilterInput | null > | null,
  or?: Array< ModelUserXPFilterInput | null > | null,
  not?: ModelUserXPFilterInput | null,
  owner?: ModelStringInput | null,
};

export type ModelUserXPConnection = {
  __typename: "ModelUserXPConnection",
  items:  Array<UserXP | null >,
  nextToken?: string | null,
};

export type ModelIDKeyConditionInput = {
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelStringKeyConditionInput = {
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
};

export type ModelArtworkFilterInput = {
  id?: ModelIDInput | null,
  isCurated?: ModelBooleanInput | null,
  isFeatured?: ModelBooleanInput | null,
  hasAudio?: ModelBooleanInput | null,
  hasAR?: ModelBooleanInput | null,
  primaryImage?: ModelStringInput | null,
  primaryImageSmall?: ModelStringInput | null,
  additionalImages?: ModelStringInput | null,
  arImage?: ModelStringInput | null,
  departmentId?: ModelIDInput | null,
  department?: ModelStringInput | null,
  departmentDescription?: ModelStringInput | null,
  departmentImageUrl?: ModelStringInput | null,
  objectType?: ModelStringInput | null,
  title?: ModelStringInput | null,
  culture?: ModelStringInput | null,
  artistDisplayName?: ModelStringInput | null,
  objectDate?: ModelStringInput | null,
  objectURL?: ModelStringInput | null,
  medium?: ModelStringInput | null,
  dimensions?: ModelStringInput | null,
  classification?: ModelStringInput | null,
  galleryNumber?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  description?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelArtworkFilterInput | null > | null,
  or?: Array< ModelArtworkFilterInput | null > | null,
  not?: ModelArtworkFilterInput | null,
};

export type ModelArtworkConnection = {
  __typename: "ModelArtworkConnection",
  items:  Array<Artwork | null >,
  nextToken?: string | null,
};

export type ModelDepartmentFilterInput = {
  id?: ModelIDInput | null,
  displayName?: ModelStringInput | null,
  description?: ModelStringInput | null,
  coverImage?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelDepartmentFilterInput | null > | null,
  or?: Array< ModelDepartmentFilterInput | null > | null,
  not?: ModelDepartmentFilterInput | null,
};

export type ModelDepartmentConnection = {
  __typename: "ModelDepartmentConnection",
  items:  Array<Department | null >,
  nextToken?: string | null,
};

export type ModelAudioContentFilterInput = {
  id?: ModelIDInput | null,
  artworkId?: ModelIDInput | null,
  audioURL?: ModelStringInput | null,
  transcript?: ModelStringInput | null,
  duration?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelAudioContentFilterInput | null > | null,
  or?: Array< ModelAudioContentFilterInput | null > | null,
  not?: ModelAudioContentFilterInput | null,
};

export type ModelAudioContentConnection = {
  __typename: "ModelAudioContentConnection",
  items:  Array<AudioContent | null >,
  nextToken?: string | null,
};

export type ModelArtFactFilterInput = {
  id?: ModelIDInput | null,
  artworkId?: ModelIDInput | null,
  content?: ModelStringInput | null,
  isActive?: ModelBooleanInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelArtFactFilterInput | null > | null,
  or?: Array< ModelArtFactFilterInput | null > | null,
  not?: ModelArtFactFilterInput | null,
};

export type ModelArtFactConnection = {
  __typename: "ModelArtFactConnection",
  items:  Array<ArtFact | null >,
  nextToken?: string | null,
};

export type ModelQuestFilterInput = {
  id?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  icon?: ModelStringInput | null,
  xpReward?: ModelIntInput | null,
  requiredArtworks?: ModelStringInput | null,
  isPremium?: ModelBooleanInput | null,
  galleryMap?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelQuestFilterInput | null > | null,
  or?: Array< ModelQuestFilterInput | null > | null,
  not?: ModelQuestFilterInput | null,
};

export type ModelQuestConnection = {
  __typename: "ModelQuestConnection",
  items:  Array<Quest | null >,
  nextToken?: string | null,
};

export type ModelRankFilterInput = {
  id?: ModelIDInput | null,
  title?: ModelStringInput | null,
  minXP?: ModelIntInput | null,
  maxXP?: ModelIntInput | null,
  icon?: ModelStringInput | null,
  description?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelRankFilterInput | null > | null,
  or?: Array< ModelRankFilterInput | null > | null,
  not?: ModelRankFilterInput | null,
};

export type ModelRankConnection = {
  __typename: "ModelRankConnection",
  items:  Array<Rank | null >,
  nextToken?: string | null,
};

export type ModelSubscriptionUserFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  username?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  phone?: ModelSubscriptionStringInput | null,
  profileImage?: ModelSubscriptionStringInput | null,
  isPremium?: ModelSubscriptionBooleanInput | null,
  remainingFreeScans?: ModelSubscriptionIntInput | null,
  xpPoints?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserFilterInput | null > | null,
  owner?: ModelStringInput | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
};

export type ModelSubscriptionIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionFavoritedFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionIDInput | null,
  artworkId?: ModelSubscriptionIDInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionFavoritedFilterInput | null > | null,
  or?: Array< ModelSubscriptionFavoritedFilterInput | null > | null,
  owner?: ModelStringInput | null,
};

export type ModelSubscriptionVisitedFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionIDInput | null,
  artworkId?: ModelSubscriptionIDInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionVisitedFilterInput | null > | null,
  or?: Array< ModelSubscriptionVisitedFilterInput | null > | null,
  owner?: ModelStringInput | null,
};

export type ModelSubscriptionUserQuestFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionIDInput | null,
  questId?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  icon?: ModelSubscriptionStringInput | null,
  xpReward?: ModelSubscriptionIntInput | null,
  requiredArtworks?: ModelSubscriptionStringInput | null,
  artworksVisited?: ModelSubscriptionStringInput | null,
  galleryMap?: ModelSubscriptionStringInput | null,
  isCompleted?: ModelSubscriptionBooleanInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserQuestFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserQuestFilterInput | null > | null,
  owner?: ModelStringInput | null,
};

export type ModelSubscriptionUserXPFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionIDInput | null,
  xpPoints?: ModelSubscriptionIntInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserXPFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserXPFilterInput | null > | null,
  owner?: ModelStringInput | null,
};

export type ModelSubscriptionArtworkFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  isCurated?: ModelSubscriptionBooleanInput | null,
  isFeatured?: ModelSubscriptionBooleanInput | null,
  hasAudio?: ModelSubscriptionBooleanInput | null,
  hasAR?: ModelSubscriptionBooleanInput | null,
  primaryImage?: ModelSubscriptionStringInput | null,
  primaryImageSmall?: ModelSubscriptionStringInput | null,
  additionalImages?: ModelSubscriptionStringInput | null,
  arImage?: ModelSubscriptionStringInput | null,
  departmentId?: ModelSubscriptionIDInput | null,
  department?: ModelSubscriptionStringInput | null,
  departmentDescription?: ModelSubscriptionStringInput | null,
  departmentImageUrl?: ModelSubscriptionStringInput | null,
  objectType?: ModelSubscriptionStringInput | null,
  title?: ModelSubscriptionStringInput | null,
  culture?: ModelSubscriptionStringInput | null,
  artistDisplayName?: ModelSubscriptionStringInput | null,
  objectDate?: ModelSubscriptionStringInput | null,
  objectURL?: ModelSubscriptionStringInput | null,
  medium?: ModelSubscriptionStringInput | null,
  dimensions?: ModelSubscriptionStringInput | null,
  classification?: ModelSubscriptionStringInput | null,
  galleryNumber?: ModelSubscriptionStringInput | null,
  tags?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionArtworkFilterInput | null > | null,
  or?: Array< ModelSubscriptionArtworkFilterInput | null > | null,
};

export type ModelSubscriptionDepartmentFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  displayName?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  coverImage?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionDepartmentFilterInput | null > | null,
  or?: Array< ModelSubscriptionDepartmentFilterInput | null > | null,
};

export type ModelSubscriptionAudioContentFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  artworkId?: ModelSubscriptionIDInput | null,
  audioURL?: ModelSubscriptionStringInput | null,
  transcript?: ModelSubscriptionStringInput | null,
  duration?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionAudioContentFilterInput | null > | null,
  or?: Array< ModelSubscriptionAudioContentFilterInput | null > | null,
};

export type ModelSubscriptionArtFactFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  artworkId?: ModelSubscriptionIDInput | null,
  content?: ModelSubscriptionStringInput | null,
  isActive?: ModelSubscriptionBooleanInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionArtFactFilterInput | null > | null,
  or?: Array< ModelSubscriptionArtFactFilterInput | null > | null,
};

export type ModelSubscriptionQuestFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  icon?: ModelSubscriptionStringInput | null,
  xpReward?: ModelSubscriptionIntInput | null,
  requiredArtworks?: ModelSubscriptionStringInput | null,
  isPremium?: ModelSubscriptionBooleanInput | null,
  galleryMap?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionQuestFilterInput | null > | null,
  or?: Array< ModelSubscriptionQuestFilterInput | null > | null,
};

export type ModelSubscriptionRankFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  minXP?: ModelSubscriptionIntInput | null,
  maxXP?: ModelSubscriptionIntInput | null,
  icon?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionRankFilterInput | null > | null,
  or?: Array< ModelSubscriptionRankFilterInput | null > | null,
};

export type CreateUserMutationVariables = {
  input: CreateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    phone?: string | null,
    profileImage?: string | null,
    isPremium?: boolean | null,
    remainingFreeScans?: number | null,
    xpPoints?: number | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    phone?: string | null,
    profileImage?: string | null,
    isPremium?: boolean | null,
    remainingFreeScans?: number | null,
    xpPoints?: number | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type DeleteUserMutationVariables = {
  input: DeleteUserInput,
  condition?: ModelUserConditionInput | null,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    phone?: string | null,
    profileImage?: string | null,
    isPremium?: boolean | null,
    remainingFreeScans?: number | null,
    xpPoints?: number | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type CreateArtworkMutationVariables = {
  input: CreateArtworkInput,
  condition?: ModelArtworkConditionInput | null,
};

export type CreateArtworkMutation = {
  createArtwork?:  {
    __typename: "Artwork",
    id: string,
    isCurated?: boolean | null,
    isFeatured?: boolean | null,
    hasAudio?: boolean | null,
    hasAR?: boolean | null,
    primaryImage?: string | null,
    primaryImageSmall?: string | null,
    additionalImages?: Array< string | null > | null,
    arImage?: string | null,
    departmentId: string,
    department?: string | null,
    departmentDescription?: string | null,
    departmentImageUrl?: string | null,
    objectType?: string | null,
    title: string,
    culture?: string | null,
    artistDisplayName?: string | null,
    objectDate?: string | null,
    objectURL?: string | null,
    medium?: string | null,
    dimensions?: string | null,
    classification?: string | null,
    galleryNumber?: string | null,
    tags?: Array< string | null > | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateArtworkMutationVariables = {
  input: UpdateArtworkInput,
  condition?: ModelArtworkConditionInput | null,
};

export type UpdateArtworkMutation = {
  updateArtwork?:  {
    __typename: "Artwork",
    id: string,
    isCurated?: boolean | null,
    isFeatured?: boolean | null,
    hasAudio?: boolean | null,
    hasAR?: boolean | null,
    primaryImage?: string | null,
    primaryImageSmall?: string | null,
    additionalImages?: Array< string | null > | null,
    arImage?: string | null,
    departmentId: string,
    department?: string | null,
    departmentDescription?: string | null,
    departmentImageUrl?: string | null,
    objectType?: string | null,
    title: string,
    culture?: string | null,
    artistDisplayName?: string | null,
    objectDate?: string | null,
    objectURL?: string | null,
    medium?: string | null,
    dimensions?: string | null,
    classification?: string | null,
    galleryNumber?: string | null,
    tags?: Array< string | null > | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteArtworkMutationVariables = {
  input: DeleteArtworkInput,
  condition?: ModelArtworkConditionInput | null,
};

export type DeleteArtworkMutation = {
  deleteArtwork?:  {
    __typename: "Artwork",
    id: string,
    isCurated?: boolean | null,
    isFeatured?: boolean | null,
    hasAudio?: boolean | null,
    hasAR?: boolean | null,
    primaryImage?: string | null,
    primaryImageSmall?: string | null,
    additionalImages?: Array< string | null > | null,
    arImage?: string | null,
    departmentId: string,
    department?: string | null,
    departmentDescription?: string | null,
    departmentImageUrl?: string | null,
    objectType?: string | null,
    title: string,
    culture?: string | null,
    artistDisplayName?: string | null,
    objectDate?: string | null,
    objectURL?: string | null,
    medium?: string | null,
    dimensions?: string | null,
    classification?: string | null,
    galleryNumber?: string | null,
    tags?: Array< string | null > | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateFavoritedMutationVariables = {
  input: CreateFavoritedInput,
  condition?: ModelFavoritedConditionInput | null,
};

export type CreateFavoritedMutation = {
  createFavorited?:  {
    __typename: "Favorited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type UpdateFavoritedMutationVariables = {
  input: UpdateFavoritedInput,
  condition?: ModelFavoritedConditionInput | null,
};

export type UpdateFavoritedMutation = {
  updateFavorited?:  {
    __typename: "Favorited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type DeleteFavoritedMutationVariables = {
  input: DeleteFavoritedInput,
  condition?: ModelFavoritedConditionInput | null,
};

export type DeleteFavoritedMutation = {
  deleteFavorited?:  {
    __typename: "Favorited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type CreateVisitedMutationVariables = {
  input: CreateVisitedInput,
  condition?: ModelVisitedConditionInput | null,
};

export type CreateVisitedMutation = {
  createVisited?:  {
    __typename: "Visited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type UpdateVisitedMutationVariables = {
  input: UpdateVisitedInput,
  condition?: ModelVisitedConditionInput | null,
};

export type UpdateVisitedMutation = {
  updateVisited?:  {
    __typename: "Visited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type DeleteVisitedMutationVariables = {
  input: DeleteVisitedInput,
  condition?: ModelVisitedConditionInput | null,
};

export type DeleteVisitedMutation = {
  deleteVisited?:  {
    __typename: "Visited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type CreateDepartmentMutationVariables = {
  input: CreateDepartmentInput,
  condition?: ModelDepartmentConditionInput | null,
};

export type CreateDepartmentMutation = {
  createDepartment?:  {
    __typename: "Department",
    id: string,
    displayName: string,
    description?: string | null,
    coverImage?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateDepartmentMutationVariables = {
  input: UpdateDepartmentInput,
  condition?: ModelDepartmentConditionInput | null,
};

export type UpdateDepartmentMutation = {
  updateDepartment?:  {
    __typename: "Department",
    id: string,
    displayName: string,
    description?: string | null,
    coverImage?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteDepartmentMutationVariables = {
  input: DeleteDepartmentInput,
  condition?: ModelDepartmentConditionInput | null,
};

export type DeleteDepartmentMutation = {
  deleteDepartment?:  {
    __typename: "Department",
    id: string,
    displayName: string,
    description?: string | null,
    coverImage?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateAudioContentMutationVariables = {
  input: CreateAudioContentInput,
  condition?: ModelAudioContentConditionInput | null,
};

export type CreateAudioContentMutation = {
  createAudioContent?:  {
    __typename: "AudioContent",
    id: string,
    artworkId: string,
    audioURL?: string | null,
    transcript?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateAudioContentMutationVariables = {
  input: UpdateAudioContentInput,
  condition?: ModelAudioContentConditionInput | null,
};

export type UpdateAudioContentMutation = {
  updateAudioContent?:  {
    __typename: "AudioContent",
    id: string,
    artworkId: string,
    audioURL?: string | null,
    transcript?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteAudioContentMutationVariables = {
  input: DeleteAudioContentInput,
  condition?: ModelAudioContentConditionInput | null,
};

export type DeleteAudioContentMutation = {
  deleteAudioContent?:  {
    __typename: "AudioContent",
    id: string,
    artworkId: string,
    audioURL?: string | null,
    transcript?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateArtFactMutationVariables = {
  input: CreateArtFactInput,
  condition?: ModelArtFactConditionInput | null,
};

export type CreateArtFactMutation = {
  createArtFact?:  {
    __typename: "ArtFact",
    id: string,
    artworkId: string,
    content?: string | null,
    isActive?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateArtFactMutationVariables = {
  input: UpdateArtFactInput,
  condition?: ModelArtFactConditionInput | null,
};

export type UpdateArtFactMutation = {
  updateArtFact?:  {
    __typename: "ArtFact",
    id: string,
    artworkId: string,
    content?: string | null,
    isActive?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteArtFactMutationVariables = {
  input: DeleteArtFactInput,
  condition?: ModelArtFactConditionInput | null,
};

export type DeleteArtFactMutation = {
  deleteArtFact?:  {
    __typename: "ArtFact",
    id: string,
    artworkId: string,
    content?: string | null,
    isActive?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateQuestMutationVariables = {
  input: CreateQuestInput,
  condition?: ModelQuestConditionInput | null,
};

export type CreateQuestMutation = {
  createQuest?:  {
    __typename: "Quest",
    id: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    isPremium?: boolean | null,
    galleryMap?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateQuestMutationVariables = {
  input: UpdateQuestInput,
  condition?: ModelQuestConditionInput | null,
};

export type UpdateQuestMutation = {
  updateQuest?:  {
    __typename: "Quest",
    id: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    isPremium?: boolean | null,
    galleryMap?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteQuestMutationVariables = {
  input: DeleteQuestInput,
  condition?: ModelQuestConditionInput | null,
};

export type DeleteQuestMutation = {
  deleteQuest?:  {
    __typename: "Quest",
    id: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    isPremium?: boolean | null,
    galleryMap?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateUserQuestMutationVariables = {
  input: CreateUserQuestInput,
  condition?: ModelUserQuestConditionInput | null,
};

export type CreateUserQuestMutation = {
  createUserQuest?:  {
    __typename: "UserQuest",
    id: string,
    userId: string,
    questId: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    artworksVisited?: Array< string | null > | null,
    galleryMap?: string | null,
    isCompleted?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type UpdateUserQuestMutationVariables = {
  input: UpdateUserQuestInput,
  condition?: ModelUserQuestConditionInput | null,
};

export type UpdateUserQuestMutation = {
  updateUserQuest?:  {
    __typename: "UserQuest",
    id: string,
    userId: string,
    questId: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    artworksVisited?: Array< string | null > | null,
    galleryMap?: string | null,
    isCompleted?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type DeleteUserQuestMutationVariables = {
  input: DeleteUserQuestInput,
  condition?: ModelUserQuestConditionInput | null,
};

export type DeleteUserQuestMutation = {
  deleteUserQuest?:  {
    __typename: "UserQuest",
    id: string,
    userId: string,
    questId: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    artworksVisited?: Array< string | null > | null,
    galleryMap?: string | null,
    isCompleted?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type CreateRankMutationVariables = {
  input: CreateRankInput,
  condition?: ModelRankConditionInput | null,
};

export type CreateRankMutation = {
  createRank?:  {
    __typename: "Rank",
    id: string,
    title: string,
    minXP?: number | null,
    maxXP?: number | null,
    icon?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateRankMutationVariables = {
  input: UpdateRankInput,
  condition?: ModelRankConditionInput | null,
};

export type UpdateRankMutation = {
  updateRank?:  {
    __typename: "Rank",
    id: string,
    title: string,
    minXP?: number | null,
    maxXP?: number | null,
    icon?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteRankMutationVariables = {
  input: DeleteRankInput,
  condition?: ModelRankConditionInput | null,
};

export type DeleteRankMutation = {
  deleteRank?:  {
    __typename: "Rank",
    id: string,
    title: string,
    minXP?: number | null,
    maxXP?: number | null,
    icon?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateUserXPMutationVariables = {
  input: CreateUserXPInput,
  condition?: ModelUserXPConditionInput | null,
};

export type CreateUserXPMutation = {
  createUserXP?:  {
    __typename: "UserXP",
    id: string,
    userId: string,
    xpPoints?: number | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type UpdateUserXPMutationVariables = {
  input: UpdateUserXPInput,
  condition?: ModelUserXPConditionInput | null,
};

export type UpdateUserXPMutation = {
  updateUserXP?:  {
    __typename: "UserXP",
    id: string,
    userId: string,
    xpPoints?: number | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type DeleteUserXPMutationVariables = {
  input: DeleteUserXPInput,
  condition?: ModelUserXPConditionInput | null,
};

export type DeleteUserXPMutation = {
  deleteUserXP?:  {
    __typename: "UserXP",
    id: string,
    userId: string,
    xpPoints?: number | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    phone?: string | null,
    profileImage?: string | null,
    isPremium?: boolean | null,
    remainingFreeScans?: number | null,
    xpPoints?: number | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      username: string,
      email: string,
      phone?: string | null,
      profileImage?: string | null,
      isPremium?: boolean | null,
      remainingFreeScans?: number | null,
      xpPoints?: number | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetFavoritedQueryVariables = {
  id: string,
};

export type GetFavoritedQuery = {
  getFavorited?:  {
    __typename: "Favorited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type ListFavoritedsQueryVariables = {
  filter?: ModelFavoritedFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListFavoritedsQuery = {
  listFavoriteds?:  {
    __typename: "ModelFavoritedConnection",
    items:  Array< {
      __typename: "Favorited",
      id: string,
      userId: string,
      artworkId: string,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetVisitedQueryVariables = {
  id: string,
};

export type GetVisitedQuery = {
  getVisited?:  {
    __typename: "Visited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type ListVisitedsQueryVariables = {
  filter?: ModelVisitedFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListVisitedsQuery = {
  listVisiteds?:  {
    __typename: "ModelVisitedConnection",
    items:  Array< {
      __typename: "Visited",
      id: string,
      userId: string,
      artworkId: string,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetUserQuestQueryVariables = {
  id: string,
};

export type GetUserQuestQuery = {
  getUserQuest?:  {
    __typename: "UserQuest",
    id: string,
    userId: string,
    questId: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    artworksVisited?: Array< string | null > | null,
    galleryMap?: string | null,
    isCompleted?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type ListUserQuestsQueryVariables = {
  filter?: ModelUserQuestFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserQuestsQuery = {
  listUserQuests?:  {
    __typename: "ModelUserQuestConnection",
    items:  Array< {
      __typename: "UserQuest",
      id: string,
      userId: string,
      questId: string,
      title: string,
      description?: string | null,
      icon?: string | null,
      xpReward?: number | null,
      requiredArtworks?: Array< string | null > | null,
      artworksVisited?: Array< string | null > | null,
      galleryMap?: string | null,
      isCompleted?: boolean | null,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetUserXPQueryVariables = {
  id: string,
};

export type GetUserXPQuery = {
  getUserXP?:  {
    __typename: "UserXP",
    id: string,
    userId: string,
    xpPoints?: number | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type ListUserXPSQueryVariables = {
  filter?: ModelUserXPFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserXPSQuery = {
  listUserXPS?:  {
    __typename: "ModelUserXPConnection",
    items:  Array< {
      __typename: "UserXP",
      id: string,
      userId: string,
      xpPoints?: number | null,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type FavoritedsByUserIdAndArtworkIdQueryVariables = {
  userId: string,
  artworkId?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelFavoritedFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type FavoritedsByUserIdAndArtworkIdQuery = {
  favoritedsByUserIdAndArtworkId?:  {
    __typename: "ModelFavoritedConnection",
    items:  Array< {
      __typename: "Favorited",
      id: string,
      userId: string,
      artworkId: string,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type VisitedsByUserIdAndArtworkIdQueryVariables = {
  userId: string,
  artworkId?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelVisitedFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type VisitedsByUserIdAndArtworkIdQuery = {
  visitedsByUserIdAndArtworkId?:  {
    __typename: "ModelVisitedConnection",
    items:  Array< {
      __typename: "Visited",
      id: string,
      userId: string,
      artworkId: string,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type UserQuestsByUserIdAndQuestIdQueryVariables = {
  userId: string,
  questId?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserQuestFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type UserQuestsByUserIdAndQuestIdQuery = {
  userQuestsByUserIdAndQuestId?:  {
    __typename: "ModelUserQuestConnection",
    items:  Array< {
      __typename: "UserQuest",
      id: string,
      userId: string,
      questId: string,
      title: string,
      description?: string | null,
      icon?: string | null,
      xpReward?: number | null,
      requiredArtworks?: Array< string | null > | null,
      artworksVisited?: Array< string | null > | null,
      galleryMap?: string | null,
      isCompleted?: boolean | null,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type UserXPSByUserIdAndTimestampQueryVariables = {
  userId: string,
  timestamp?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserXPFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type UserXPSByUserIdAndTimestampQuery = {
  userXPSByUserIdAndTimestamp?:  {
    __typename: "ModelUserXPConnection",
    items:  Array< {
      __typename: "UserXP",
      id: string,
      userId: string,
      xpPoints?: number | null,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetArtworkQueryVariables = {
  id: string,
};

export type GetArtworkQuery = {
  getArtwork?:  {
    __typename: "Artwork",
    id: string,
    isCurated?: boolean | null,
    isFeatured?: boolean | null,
    hasAudio?: boolean | null,
    hasAR?: boolean | null,
    primaryImage?: string | null,
    primaryImageSmall?: string | null,
    additionalImages?: Array< string | null > | null,
    arImage?: string | null,
    departmentId: string,
    department?: string | null,
    departmentDescription?: string | null,
    departmentImageUrl?: string | null,
    objectType?: string | null,
    title: string,
    culture?: string | null,
    artistDisplayName?: string | null,
    objectDate?: string | null,
    objectURL?: string | null,
    medium?: string | null,
    dimensions?: string | null,
    classification?: string | null,
    galleryNumber?: string | null,
    tags?: Array< string | null > | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListArtworksQueryVariables = {
  filter?: ModelArtworkFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListArtworksQuery = {
  listArtworks?:  {
    __typename: "ModelArtworkConnection",
    items:  Array< {
      __typename: "Artwork",
      id: string,
      isCurated?: boolean | null,
      isFeatured?: boolean | null,
      hasAudio?: boolean | null,
      hasAR?: boolean | null,
      primaryImage?: string | null,
      primaryImageSmall?: string | null,
      additionalImages?: Array< string | null > | null,
      arImage?: string | null,
      departmentId: string,
      department?: string | null,
      departmentDescription?: string | null,
      departmentImageUrl?: string | null,
      objectType?: string | null,
      title: string,
      culture?: string | null,
      artistDisplayName?: string | null,
      objectDate?: string | null,
      objectURL?: string | null,
      medium?: string | null,
      dimensions?: string | null,
      classification?: string | null,
      galleryNumber?: string | null,
      tags?: Array< string | null > | null,
      description?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetDepartmentQueryVariables = {
  id: string,
};

export type GetDepartmentQuery = {
  getDepartment?:  {
    __typename: "Department",
    id: string,
    displayName: string,
    description?: string | null,
    coverImage?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListDepartmentsQueryVariables = {
  filter?: ModelDepartmentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListDepartmentsQuery = {
  listDepartments?:  {
    __typename: "ModelDepartmentConnection",
    items:  Array< {
      __typename: "Department",
      id: string,
      displayName: string,
      description?: string | null,
      coverImage?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetAudioContentQueryVariables = {
  id: string,
};

export type GetAudioContentQuery = {
  getAudioContent?:  {
    __typename: "AudioContent",
    id: string,
    artworkId: string,
    audioURL?: string | null,
    transcript?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListAudioContentsQueryVariables = {
  filter?: ModelAudioContentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAudioContentsQuery = {
  listAudioContents?:  {
    __typename: "ModelAudioContentConnection",
    items:  Array< {
      __typename: "AudioContent",
      id: string,
      artworkId: string,
      audioURL?: string | null,
      transcript?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type AudioContentsByArtworkIdAndIdQueryVariables = {
  artworkId: string,
  id?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelAudioContentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type AudioContentsByArtworkIdAndIdQuery = {
  audioContentsByArtworkIdAndId?:  {
    __typename: "ModelAudioContentConnection",
    items:  Array< {
      __typename: "AudioContent",
      id: string,
      artworkId: string,
      audioURL?: string | null,
      transcript?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetArtFactQueryVariables = {
  id: string,
};

export type GetArtFactQuery = {
  getArtFact?:  {
    __typename: "ArtFact",
    id: string,
    artworkId: string,
    content?: string | null,
    isActive?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListArtFactsQueryVariables = {
  filter?: ModelArtFactFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListArtFactsQuery = {
  listArtFacts?:  {
    __typename: "ModelArtFactConnection",
    items:  Array< {
      __typename: "ArtFact",
      id: string,
      artworkId: string,
      content?: string | null,
      isActive?: boolean | null,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ArtFactsByArtworkIdAndTimestampQueryVariables = {
  artworkId: string,
  timestamp?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelArtFactFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ArtFactsByArtworkIdAndTimestampQuery = {
  artFactsByArtworkIdAndTimestamp?:  {
    __typename: "ModelArtFactConnection",
    items:  Array< {
      __typename: "ArtFact",
      id: string,
      artworkId: string,
      content?: string | null,
      isActive?: boolean | null,
      timestamp?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetQuestQueryVariables = {
  id: string,
};

export type GetQuestQuery = {
  getQuest?:  {
    __typename: "Quest",
    id: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    isPremium?: boolean | null,
    galleryMap?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListQuestsQueryVariables = {
  filter?: ModelQuestFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListQuestsQuery = {
  listQuests?:  {
    __typename: "ModelQuestConnection",
    items:  Array< {
      __typename: "Quest",
      id: string,
      title: string,
      description?: string | null,
      icon?: string | null,
      xpReward?: number | null,
      requiredArtworks?: Array< string | null > | null,
      isPremium?: boolean | null,
      galleryMap?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetRankQueryVariables = {
  id: string,
};

export type GetRankQuery = {
  getRank?:  {
    __typename: "Rank",
    id: string,
    title: string,
    minXP?: number | null,
    maxXP?: number | null,
    icon?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListRanksQueryVariables = {
  filter?: ModelRankFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListRanksQuery = {
  listRanks?:  {
    __typename: "ModelRankConnection",
    items:  Array< {
      __typename: "Rank",
      id: string,
      title: string,
      minXP?: number | null,
      maxXP?: number | null,
      icon?: string | null,
      description?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    phone?: string | null,
    profileImage?: string | null,
    isPremium?: boolean | null,
    remainingFreeScans?: number | null,
    xpPoints?: number | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    phone?: string | null,
    profileImage?: string | null,
    isPremium?: boolean | null,
    remainingFreeScans?: number | null,
    xpPoints?: number | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    phone?: string | null,
    profileImage?: string | null,
    isPremium?: boolean | null,
    remainingFreeScans?: number | null,
    xpPoints?: number | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnCreateFavoritedSubscriptionVariables = {
  filter?: ModelSubscriptionFavoritedFilterInput | null,
  owner?: string | null,
};

export type OnCreateFavoritedSubscription = {
  onCreateFavorited?:  {
    __typename: "Favorited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnUpdateFavoritedSubscriptionVariables = {
  filter?: ModelSubscriptionFavoritedFilterInput | null,
  owner?: string | null,
};

export type OnUpdateFavoritedSubscription = {
  onUpdateFavorited?:  {
    __typename: "Favorited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnDeleteFavoritedSubscriptionVariables = {
  filter?: ModelSubscriptionFavoritedFilterInput | null,
  owner?: string | null,
};

export type OnDeleteFavoritedSubscription = {
  onDeleteFavorited?:  {
    __typename: "Favorited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnCreateVisitedSubscriptionVariables = {
  filter?: ModelSubscriptionVisitedFilterInput | null,
  owner?: string | null,
};

export type OnCreateVisitedSubscription = {
  onCreateVisited?:  {
    __typename: "Visited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnUpdateVisitedSubscriptionVariables = {
  filter?: ModelSubscriptionVisitedFilterInput | null,
  owner?: string | null,
};

export type OnUpdateVisitedSubscription = {
  onUpdateVisited?:  {
    __typename: "Visited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnDeleteVisitedSubscriptionVariables = {
  filter?: ModelSubscriptionVisitedFilterInput | null,
  owner?: string | null,
};

export type OnDeleteVisitedSubscription = {
  onDeleteVisited?:  {
    __typename: "Visited",
    id: string,
    userId: string,
    artworkId: string,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnCreateUserQuestSubscriptionVariables = {
  filter?: ModelSubscriptionUserQuestFilterInput | null,
  owner?: string | null,
};

export type OnCreateUserQuestSubscription = {
  onCreateUserQuest?:  {
    __typename: "UserQuest",
    id: string,
    userId: string,
    questId: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    artworksVisited?: Array< string | null > | null,
    galleryMap?: string | null,
    isCompleted?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnUpdateUserQuestSubscriptionVariables = {
  filter?: ModelSubscriptionUserQuestFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUserQuestSubscription = {
  onUpdateUserQuest?:  {
    __typename: "UserQuest",
    id: string,
    userId: string,
    questId: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    artworksVisited?: Array< string | null > | null,
    galleryMap?: string | null,
    isCompleted?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnDeleteUserQuestSubscriptionVariables = {
  filter?: ModelSubscriptionUserQuestFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUserQuestSubscription = {
  onDeleteUserQuest?:  {
    __typename: "UserQuest",
    id: string,
    userId: string,
    questId: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    artworksVisited?: Array< string | null > | null,
    galleryMap?: string | null,
    isCompleted?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnCreateUserXPSubscriptionVariables = {
  filter?: ModelSubscriptionUserXPFilterInput | null,
  owner?: string | null,
};

export type OnCreateUserXPSubscription = {
  onCreateUserXP?:  {
    __typename: "UserXP",
    id: string,
    userId: string,
    xpPoints?: number | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnUpdateUserXPSubscriptionVariables = {
  filter?: ModelSubscriptionUserXPFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUserXPSubscription = {
  onUpdateUserXP?:  {
    __typename: "UserXP",
    id: string,
    userId: string,
    xpPoints?: number | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnDeleteUserXPSubscriptionVariables = {
  filter?: ModelSubscriptionUserXPFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUserXPSubscription = {
  onDeleteUserXP?:  {
    __typename: "UserXP",
    id: string,
    userId: string,
    xpPoints?: number | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnCreateArtworkSubscriptionVariables = {
  filter?: ModelSubscriptionArtworkFilterInput | null,
};

export type OnCreateArtworkSubscription = {
  onCreateArtwork?:  {
    __typename: "Artwork",
    id: string,
    isCurated?: boolean | null,
    isFeatured?: boolean | null,
    hasAudio?: boolean | null,
    hasAR?: boolean | null,
    primaryImage?: string | null,
    primaryImageSmall?: string | null,
    additionalImages?: Array< string | null > | null,
    arImage?: string | null,
    departmentId: string,
    department?: string | null,
    departmentDescription?: string | null,
    departmentImageUrl?: string | null,
    objectType?: string | null,
    title: string,
    culture?: string | null,
    artistDisplayName?: string | null,
    objectDate?: string | null,
    objectURL?: string | null,
    medium?: string | null,
    dimensions?: string | null,
    classification?: string | null,
    galleryNumber?: string | null,
    tags?: Array< string | null > | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateArtworkSubscriptionVariables = {
  filter?: ModelSubscriptionArtworkFilterInput | null,
};

export type OnUpdateArtworkSubscription = {
  onUpdateArtwork?:  {
    __typename: "Artwork",
    id: string,
    isCurated?: boolean | null,
    isFeatured?: boolean | null,
    hasAudio?: boolean | null,
    hasAR?: boolean | null,
    primaryImage?: string | null,
    primaryImageSmall?: string | null,
    additionalImages?: Array< string | null > | null,
    arImage?: string | null,
    departmentId: string,
    department?: string | null,
    departmentDescription?: string | null,
    departmentImageUrl?: string | null,
    objectType?: string | null,
    title: string,
    culture?: string | null,
    artistDisplayName?: string | null,
    objectDate?: string | null,
    objectURL?: string | null,
    medium?: string | null,
    dimensions?: string | null,
    classification?: string | null,
    galleryNumber?: string | null,
    tags?: Array< string | null > | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteArtworkSubscriptionVariables = {
  filter?: ModelSubscriptionArtworkFilterInput | null,
};

export type OnDeleteArtworkSubscription = {
  onDeleteArtwork?:  {
    __typename: "Artwork",
    id: string,
    isCurated?: boolean | null,
    isFeatured?: boolean | null,
    hasAudio?: boolean | null,
    hasAR?: boolean | null,
    primaryImage?: string | null,
    primaryImageSmall?: string | null,
    additionalImages?: Array< string | null > | null,
    arImage?: string | null,
    departmentId: string,
    department?: string | null,
    departmentDescription?: string | null,
    departmentImageUrl?: string | null,
    objectType?: string | null,
    title: string,
    culture?: string | null,
    artistDisplayName?: string | null,
    objectDate?: string | null,
    objectURL?: string | null,
    medium?: string | null,
    dimensions?: string | null,
    classification?: string | null,
    galleryNumber?: string | null,
    tags?: Array< string | null > | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateDepartmentSubscriptionVariables = {
  filter?: ModelSubscriptionDepartmentFilterInput | null,
};

export type OnCreateDepartmentSubscription = {
  onCreateDepartment?:  {
    __typename: "Department",
    id: string,
    displayName: string,
    description?: string | null,
    coverImage?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateDepartmentSubscriptionVariables = {
  filter?: ModelSubscriptionDepartmentFilterInput | null,
};

export type OnUpdateDepartmentSubscription = {
  onUpdateDepartment?:  {
    __typename: "Department",
    id: string,
    displayName: string,
    description?: string | null,
    coverImage?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteDepartmentSubscriptionVariables = {
  filter?: ModelSubscriptionDepartmentFilterInput | null,
};

export type OnDeleteDepartmentSubscription = {
  onDeleteDepartment?:  {
    __typename: "Department",
    id: string,
    displayName: string,
    description?: string | null,
    coverImage?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateAudioContentSubscriptionVariables = {
  filter?: ModelSubscriptionAudioContentFilterInput | null,
};

export type OnCreateAudioContentSubscription = {
  onCreateAudioContent?:  {
    __typename: "AudioContent",
    id: string,
    artworkId: string,
    audioURL?: string | null,
    transcript?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateAudioContentSubscriptionVariables = {
  filter?: ModelSubscriptionAudioContentFilterInput | null,
};

export type OnUpdateAudioContentSubscription = {
  onUpdateAudioContent?:  {
    __typename: "AudioContent",
    id: string,
    artworkId: string,
    audioURL?: string | null,
    transcript?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteAudioContentSubscriptionVariables = {
  filter?: ModelSubscriptionAudioContentFilterInput | null,
};

export type OnDeleteAudioContentSubscription = {
  onDeleteAudioContent?:  {
    __typename: "AudioContent",
    id: string,
    artworkId: string,
    audioURL?: string | null,
    transcript?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateArtFactSubscriptionVariables = {
  filter?: ModelSubscriptionArtFactFilterInput | null,
};

export type OnCreateArtFactSubscription = {
  onCreateArtFact?:  {
    __typename: "ArtFact",
    id: string,
    artworkId: string,
    content?: string | null,
    isActive?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateArtFactSubscriptionVariables = {
  filter?: ModelSubscriptionArtFactFilterInput | null,
};

export type OnUpdateArtFactSubscription = {
  onUpdateArtFact?:  {
    __typename: "ArtFact",
    id: string,
    artworkId: string,
    content?: string | null,
    isActive?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteArtFactSubscriptionVariables = {
  filter?: ModelSubscriptionArtFactFilterInput | null,
};

export type OnDeleteArtFactSubscription = {
  onDeleteArtFact?:  {
    __typename: "ArtFact",
    id: string,
    artworkId: string,
    content?: string | null,
    isActive?: boolean | null,
    timestamp?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateQuestSubscriptionVariables = {
  filter?: ModelSubscriptionQuestFilterInput | null,
};

export type OnCreateQuestSubscription = {
  onCreateQuest?:  {
    __typename: "Quest",
    id: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    isPremium?: boolean | null,
    galleryMap?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateQuestSubscriptionVariables = {
  filter?: ModelSubscriptionQuestFilterInput | null,
};

export type OnUpdateQuestSubscription = {
  onUpdateQuest?:  {
    __typename: "Quest",
    id: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    isPremium?: boolean | null,
    galleryMap?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteQuestSubscriptionVariables = {
  filter?: ModelSubscriptionQuestFilterInput | null,
};

export type OnDeleteQuestSubscription = {
  onDeleteQuest?:  {
    __typename: "Quest",
    id: string,
    title: string,
    description?: string | null,
    icon?: string | null,
    xpReward?: number | null,
    requiredArtworks?: Array< string | null > | null,
    isPremium?: boolean | null,
    galleryMap?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateRankSubscriptionVariables = {
  filter?: ModelSubscriptionRankFilterInput | null,
};

export type OnCreateRankSubscription = {
  onCreateRank?:  {
    __typename: "Rank",
    id: string,
    title: string,
    minXP?: number | null,
    maxXP?: number | null,
    icon?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateRankSubscriptionVariables = {
  filter?: ModelSubscriptionRankFilterInput | null,
};

export type OnUpdateRankSubscription = {
  onUpdateRank?:  {
    __typename: "Rank",
    id: string,
    title: string,
    minXP?: number | null,
    maxXP?: number | null,
    icon?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteRankSubscriptionVariables = {
  filter?: ModelSubscriptionRankFilterInput | null,
};

export type OnDeleteRankSubscription = {
  onDeleteRank?:  {
    __typename: "Rank",
    id: string,
    title: string,
    minXP?: number | null,
    maxXP?: number | null,
    icon?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};
