import { z } from 'zod'
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  I18NLocaleCode: { input: any; output: any; }
};

export type DeleteMutationResponse = {
  __typename?: 'DeleteMutationResponse';
  documentId: Scalars['ID']['output'];
};

export type PublicationStatus =
  | 'DRAFT'
  | 'PUBLISHED';

export type IdFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  or?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  not?: InputMaybe<IdFilterInput>;
  eq?: InputMaybe<Scalars['ID']['input']>;
  eqi?: InputMaybe<Scalars['ID']['input']>;
  ne?: InputMaybe<Scalars['ID']['input']>;
  nei?: InputMaybe<Scalars['ID']['input']>;
  startsWith?: InputMaybe<Scalars['ID']['input']>;
  endsWith?: InputMaybe<Scalars['ID']['input']>;
  contains?: InputMaybe<Scalars['ID']['input']>;
  notContains?: InputMaybe<Scalars['ID']['input']>;
  containsi?: InputMaybe<Scalars['ID']['input']>;
  notContainsi?: InputMaybe<Scalars['ID']['input']>;
  gt?: InputMaybe<Scalars['ID']['input']>;
  gte?: InputMaybe<Scalars['ID']['input']>;
  lt?: InputMaybe<Scalars['ID']['input']>;
  lte?: InputMaybe<Scalars['ID']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type BooleanFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  not?: InputMaybe<BooleanFilterInput>;
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  eqi?: InputMaybe<Scalars['Boolean']['input']>;
  ne?: InputMaybe<Scalars['Boolean']['input']>;
  nei?: InputMaybe<Scalars['Boolean']['input']>;
  startsWith?: InputMaybe<Scalars['Boolean']['input']>;
  endsWith?: InputMaybe<Scalars['Boolean']['input']>;
  contains?: InputMaybe<Scalars['Boolean']['input']>;
  notContains?: InputMaybe<Scalars['Boolean']['input']>;
  containsi?: InputMaybe<Scalars['Boolean']['input']>;
  notContainsi?: InputMaybe<Scalars['Boolean']['input']>;
  gt?: InputMaybe<Scalars['Boolean']['input']>;
  gte?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['Boolean']['input']>;
  lte?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
};

export type StringFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  or?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  not?: InputMaybe<StringFilterInput>;
  eq?: InputMaybe<Scalars['String']['input']>;
  eqi?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  nei?: InputMaybe<Scalars['String']['input']>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
  endsWith?: InputMaybe<Scalars['String']['input']>;
  contains?: InputMaybe<Scalars['String']['input']>;
  notContains?: InputMaybe<Scalars['String']['input']>;
  containsi?: InputMaybe<Scalars['String']['input']>;
  notContainsi?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type IntFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  not?: InputMaybe<IntFilterInput>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  eqi?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  nei?: InputMaybe<Scalars['Int']['input']>;
  startsWith?: InputMaybe<Scalars['Int']['input']>;
  endsWith?: InputMaybe<Scalars['Int']['input']>;
  contains?: InputMaybe<Scalars['Int']['input']>;
  notContains?: InputMaybe<Scalars['Int']['input']>;
  containsi?: InputMaybe<Scalars['Int']['input']>;
  notContainsi?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
};

export type FloatFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  not?: InputMaybe<FloatFilterInput>;
  eq?: InputMaybe<Scalars['Float']['input']>;
  eqi?: InputMaybe<Scalars['Float']['input']>;
  ne?: InputMaybe<Scalars['Float']['input']>;
  nei?: InputMaybe<Scalars['Float']['input']>;
  startsWith?: InputMaybe<Scalars['Float']['input']>;
  endsWith?: InputMaybe<Scalars['Float']['input']>;
  contains?: InputMaybe<Scalars['Float']['input']>;
  notContains?: InputMaybe<Scalars['Float']['input']>;
  containsi?: InputMaybe<Scalars['Float']['input']>;
  notContainsi?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
};

export type DateTimeFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  or?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  not?: InputMaybe<DateTimeFilterInput>;
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  eqi?: InputMaybe<Scalars['DateTime']['input']>;
  ne?: InputMaybe<Scalars['DateTime']['input']>;
  nei?: InputMaybe<Scalars['DateTime']['input']>;
  startsWith?: InputMaybe<Scalars['DateTime']['input']>;
  endsWith?: InputMaybe<Scalars['DateTime']['input']>;
  contains?: InputMaybe<Scalars['DateTime']['input']>;
  notContains?: InputMaybe<Scalars['DateTime']['input']>;
  containsi?: InputMaybe<Scalars['DateTime']['input']>;
  notContainsi?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
};

export type JsonFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  or?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  not?: InputMaybe<JsonFilterInput>;
  eq?: InputMaybe<Scalars['JSON']['input']>;
  eqi?: InputMaybe<Scalars['JSON']['input']>;
  ne?: InputMaybe<Scalars['JSON']['input']>;
  nei?: InputMaybe<Scalars['JSON']['input']>;
  startsWith?: InputMaybe<Scalars['JSON']['input']>;
  endsWith?: InputMaybe<Scalars['JSON']['input']>;
  contains?: InputMaybe<Scalars['JSON']['input']>;
  notContains?: InputMaybe<Scalars['JSON']['input']>;
  containsi?: InputMaybe<Scalars['JSON']['input']>;
  notContainsi?: InputMaybe<Scalars['JSON']['input']>;
  gt?: InputMaybe<Scalars['JSON']['input']>;
  gte?: InputMaybe<Scalars['JSON']['input']>;
  lt?: InputMaybe<Scalars['JSON']['input']>;
  lte?: InputMaybe<Scalars['JSON']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
};

export type ComponentSharedSocialMediaInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  facebook?: InputMaybe<Scalars['String']['input']>;
  instagram?: InputMaybe<Scalars['String']['input']>;
  twitter?: InputMaybe<Scalars['String']['input']>;
  tiktok?: InputMaybe<Scalars['String']['input']>;
};

export type ComponentSharedSocialMedia = {
  __typename?: 'ComponentSharedSocialMedia';
  id: Scalars['ID']['output'];
  facebook?: Maybe<Scalars['String']['output']>;
  instagram?: Maybe<Scalars['String']['output']>;
  twitter?: Maybe<Scalars['String']['output']>;
  tiktok?: Maybe<Scalars['String']['output']>;
};

export type ComponentSharedSliderInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  files?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type ComponentSharedSlider = {
  __typename?: 'ComponentSharedSlider';
  id: Scalars['ID']['output'];
  files: Array<Maybe<UploadFile>>;
};


export type ComponentSharedSliderFilesArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ComponentSharedQuoteFiltersInput = {
  author?: InputMaybe<StringFilterInput>;
  body?: InputMaybe<JsonFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ComponentSharedQuoteFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<ComponentSharedQuoteFiltersInput>>>;
  not?: InputMaybe<ComponentSharedQuoteFiltersInput>;
};

export type ComponentSharedQuoteInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  author?: InputMaybe<Scalars['String']['input']>;
  body?: InputMaybe<Scalars['JSON']['input']>;
};

export type ComponentSharedQuote = {
  __typename?: 'ComponentSharedQuote';
  id: Scalars['ID']['output'];
  author: Scalars['String']['output'];
  body: Scalars['JSON']['output'];
};

export type ComponentSharedLinkInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  href?: InputMaybe<Scalars['String']['input']>;
};

export type ComponentSharedLink = {
  __typename?: 'ComponentSharedLink';
  id: Scalars['ID']['output'];
  text: Scalars['String']['output'];
  href: Scalars['String']['output'];
};

export type ComponentSharedCopyrightInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  legalname?: InputMaybe<Scalars['String']['input']>;
  yearStart?: InputMaybe<Scalars['Int']['input']>;
  autoYear?: InputMaybe<Scalars['Boolean']['input']>;
  yearOverride?: InputMaybe<Scalars['Int']['input']>;
  extraText?: InputMaybe<Scalars['String']['input']>;
};

export type ComponentSharedCopyright = {
  __typename?: 'ComponentSharedCopyright';
  id: Scalars['ID']['output'];
  legalname: Scalars['String']['output'];
  yearStart?: Maybe<Scalars['Int']['output']>;
  autoYear?: Maybe<Scalars['Boolean']['output']>;
  yearOverride?: Maybe<Scalars['Int']['output']>;
  extraText?: Maybe<Scalars['String']['output']>;
};

export type ComponentSectionsTestimonialFiltersInput = {
  author_quote?: InputMaybe<ComponentSharedQuoteFiltersInput>;
  organization?: InputMaybe<StringFilterInput>;
  age?: InputMaybe<IntFilterInput>;
  author_role?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ComponentSectionsTestimonialFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<ComponentSectionsTestimonialFiltersInput>>>;
  not?: InputMaybe<ComponentSectionsTestimonialFiltersInput>;
};

export type ComponentSectionsTestimonialInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  author_quote?: InputMaybe<ComponentSharedQuoteInput>;
  organization?: InputMaybe<Scalars['String']['input']>;
  picture?: InputMaybe<Scalars['ID']['input']>;
  age?: InputMaybe<Scalars['Int']['input']>;
  author_role?: InputMaybe<Scalars['String']['input']>;
};

export type ComponentSectionsTestimonial = {
  __typename?: 'ComponentSectionsTestimonial';
  id: Scalars['ID']['output'];
  author_quote: ComponentSharedQuote;
  organization?: Maybe<Scalars['String']['output']>;
  picture: UploadFile;
  age?: Maybe<Scalars['Int']['output']>;
  author_role?: Maybe<Scalars['String']['output']>;
};

export type ComponentSectionsTeamFiltersInput = {
  full_name?: InputMaybe<StringFilterInput>;
  role?: InputMaybe<StringFilterInput>;
  organization?: InputMaybe<StringFilterInput>;
  about?: InputMaybe<JsonFilterInput>;
  email?: InputMaybe<StringFilterInput>;
  age?: InputMaybe<IntFilterInput>;
  phone_number?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ComponentSectionsTeamFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<ComponentSectionsTeamFiltersInput>>>;
  not?: InputMaybe<ComponentSectionsTeamFiltersInput>;
};

export type ComponentSectionsTeamInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  full_name?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  organization?: InputMaybe<Scalars['String']['input']>;
  about?: InputMaybe<Scalars['JSON']['input']>;
  picture?: InputMaybe<Scalars['ID']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  age?: InputMaybe<Scalars['Int']['input']>;
  phone_number?: InputMaybe<Scalars['String']['input']>;
};

export type ComponentSectionsTeam = {
  __typename?: 'ComponentSectionsTeam';
  id: Scalars['ID']['output'];
  full_name: Scalars['String']['output'];
  role?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Scalars['String']['output']>;
  about?: Maybe<Scalars['JSON']['output']>;
  picture: UploadFile;
  email?: Maybe<Scalars['String']['output']>;
  age?: Maybe<Scalars['Int']['output']>;
  phone_number?: Maybe<Scalars['String']['output']>;
};

export type UploadFileFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  alternativeText?: InputMaybe<StringFilterInput>;
  caption?: InputMaybe<StringFilterInput>;
  width?: InputMaybe<IntFilterInput>;
  height?: InputMaybe<IntFilterInput>;
  formats?: InputMaybe<JsonFilterInput>;
  hash?: InputMaybe<StringFilterInput>;
  ext?: InputMaybe<StringFilterInput>;
  mime?: InputMaybe<StringFilterInput>;
  size?: InputMaybe<FloatFilterInput>;
  url?: InputMaybe<StringFilterInput>;
  previewUrl?: InputMaybe<StringFilterInput>;
  provider?: InputMaybe<StringFilterInput>;
  provider_metadata?: InputMaybe<JsonFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<UploadFileFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<UploadFileFiltersInput>>>;
  not?: InputMaybe<UploadFileFiltersInput>;
};

export type UploadFile = {
  __typename?: 'UploadFile';
  documentId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  alternativeText?: Maybe<Scalars['String']['output']>;
  caption?: Maybe<Scalars['String']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  formats?: Maybe<Scalars['JSON']['output']>;
  hash: Scalars['String']['output'];
  ext?: Maybe<Scalars['String']['output']>;
  mime: Scalars['String']['output'];
  size: Scalars['Float']['output'];
  url: Scalars['String']['output'];
  previewUrl?: Maybe<Scalars['String']['output']>;
  provider: Scalars['String']['output'];
  provider_metadata?: Maybe<Scalars['JSON']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type I18NLocaleFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  code?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<I18NLocaleFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<I18NLocaleFiltersInput>>>;
  not?: InputMaybe<I18NLocaleFiltersInput>;
};

export type I18NLocale = {
  __typename?: 'I18NLocale';
  documentId: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ReviewWorkflowsWorkflowFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  stages?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  stageRequiredToPublish?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  contentTypes?: InputMaybe<JsonFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ReviewWorkflowsWorkflowFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<ReviewWorkflowsWorkflowFiltersInput>>>;
  not?: InputMaybe<ReviewWorkflowsWorkflowFiltersInput>;
};

export type ReviewWorkflowsWorkflowInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  stages?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  stageRequiredToPublish?: InputMaybe<Scalars['ID']['input']>;
  contentTypes?: InputMaybe<Scalars['JSON']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type ReviewWorkflowsWorkflow = {
  __typename?: 'ReviewWorkflowsWorkflow';
  documentId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  stages: Array<Maybe<ReviewWorkflowsWorkflowStage>>;
  stageRequiredToPublish?: Maybe<ReviewWorkflowsWorkflowStage>;
  contentTypes: Scalars['JSON']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type ReviewWorkflowsWorkflowStagesArgs = {
  filters?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ReviewWorkflowsWorkflowStageFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  color?: InputMaybe<StringFilterInput>;
  workflow?: InputMaybe<ReviewWorkflowsWorkflowFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>>>;
  not?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
};

export type ReviewWorkflowsWorkflowStageInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  workflow?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type ReviewWorkflowsWorkflowStage = {
  __typename?: 'ReviewWorkflowsWorkflowStage';
  documentId: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  workflow?: Maybe<ReviewWorkflowsWorkflow>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UsersPermissionsPermissionFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  action?: InputMaybe<StringFilterInput>;
  role?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsPermissionFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsPermissionFiltersInput>>>;
  not?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
};

export type UsersPermissionsPermission = {
  __typename?: 'UsersPermissionsPermission';
  documentId: Scalars['ID']['output'];
  action: Scalars['String']['output'];
  role?: Maybe<UsersPermissionsRole>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UsersPermissionsRoleFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  type?: InputMaybe<StringFilterInput>;
  permissions?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
  users?: InputMaybe<UsersPermissionsUserFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsRoleFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsRoleFiltersInput>>>;
  not?: InputMaybe<UsersPermissionsRoleFiltersInput>;
};

export type UsersPermissionsRoleInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UsersPermissionsRole = {
  __typename?: 'UsersPermissionsRole';
  documentId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  permissions: Array<Maybe<UsersPermissionsPermission>>;
  users: Array<Maybe<UsersPermissionsUser>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type UsersPermissionsRolePermissionsArgs = {
  filters?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsRoleUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UsersPermissionsUserFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  username?: InputMaybe<StringFilterInput>;
  email?: InputMaybe<StringFilterInput>;
  provider?: InputMaybe<StringFilterInput>;
  confirmed?: InputMaybe<BooleanFilterInput>;
  blocked?: InputMaybe<BooleanFilterInput>;
  role?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>;
  not?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type UsersPermissionsUserInput = {
  username?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  confirmed?: InputMaybe<Scalars['Boolean']['input']>;
  blocked?: InputMaybe<Scalars['Boolean']['input']>;
  role?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
};

export type UsersPermissionsUser = {
  __typename?: 'UsersPermissionsUser';
  documentId: Scalars['ID']['output'];
  username: Scalars['String']['output'];
  email: Scalars['String']['output'];
  provider?: Maybe<Scalars['String']['output']>;
  confirmed?: Maybe<Scalars['Boolean']['output']>;
  blocked?: Maybe<Scalars['Boolean']['output']>;
  role?: Maybe<UsersPermissionsRole>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UsersPermissionsUserEntityResponse = {
  __typename?: 'UsersPermissionsUserEntityResponse';
  data?: Maybe<UsersPermissionsUser>;
};

export type NavigationAudienceFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  key?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<NavigationAudienceFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<NavigationAudienceFiltersInput>>>;
  not?: InputMaybe<NavigationAudienceFiltersInput>;
};

export type NavigationAudienceInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type NavigationAudience = {
  __typename?: 'NavigationAudience';
  documentId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  key?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type NavigationNavigationFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  visible?: InputMaybe<BooleanFilterInput>;
  items?: InputMaybe<NavigationNavigationItemFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<NavigationNavigationFiltersInput>;
  and?: InputMaybe<Array<InputMaybe<NavigationNavigationFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<NavigationNavigationFiltersInput>>>;
  not?: InputMaybe<NavigationNavigationFiltersInput>;
};

export type NavigationNavigationInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  visible?: InputMaybe<Scalars['Boolean']['input']>;
  items?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type NavigationNavigation = {
  __typename?: 'NavigationNavigation';
  documentId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  visible?: Maybe<Scalars['Boolean']['output']>;
  items: Array<Maybe<NavigationNavigationItem>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
};


export type NavigationNavigationItemsArgs = {
  filters?: InputMaybe<NavigationNavigationItemFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Enum_Navigationnavigationitem_Type =
  | 'INTERNAL'
  | 'EXTERNAL'
  | 'WRAPPER';

export type NavigationNavigationItemFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  title?: InputMaybe<StringFilterInput>;
  type?: InputMaybe<StringFilterInput>;
  path?: InputMaybe<StringFilterInput>;
  externalPath?: InputMaybe<StringFilterInput>;
  uiRouterKey?: InputMaybe<StringFilterInput>;
  menuAttached?: InputMaybe<BooleanFilterInput>;
  order?: InputMaybe<IntFilterInput>;
  collapsed?: InputMaybe<BooleanFilterInput>;
  autoSync?: InputMaybe<BooleanFilterInput>;
  parent?: InputMaybe<NavigationNavigationItemFiltersInput>;
  master?: InputMaybe<NavigationNavigationFiltersInput>;
  audience?: InputMaybe<NavigationAudienceFiltersInput>;
  additionalFields?: InputMaybe<JsonFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<NavigationNavigationItemFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<NavigationNavigationItemFiltersInput>>>;
  not?: InputMaybe<NavigationNavigationItemFiltersInput>;
};

export type NavigationNavigationItemInput = {
  title?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Enum_Navigationnavigationitem_Type>;
  path?: InputMaybe<Scalars['String']['input']>;
  externalPath?: InputMaybe<Scalars['String']['input']>;
  uiRouterKey?: InputMaybe<Scalars['String']['input']>;
  menuAttached?: InputMaybe<Scalars['Boolean']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  collapsed?: InputMaybe<Scalars['Boolean']['input']>;
  autoSync?: InputMaybe<Scalars['Boolean']['input']>;
  parent?: InputMaybe<Scalars['ID']['input']>;
  master?: InputMaybe<Scalars['ID']['input']>;
  audience?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  additionalFields?: InputMaybe<Scalars['JSON']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type NavigationNavigationItem = {
  __typename?: 'NavigationNavigationItem';
  documentId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  type?: Maybe<Enum_Navigationnavigationitem_Type>;
  path?: Maybe<Scalars['String']['output']>;
  externalPath?: Maybe<Scalars['String']['output']>;
  uiRouterKey?: Maybe<Scalars['String']['output']>;
  menuAttached?: Maybe<Scalars['Boolean']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  collapsed?: Maybe<Scalars['Boolean']['output']>;
  autoSync?: Maybe<Scalars['Boolean']['output']>;
  master?: Maybe<NavigationNavigation>;
  audience: Array<Maybe<NavigationAudience>>;
  additionalFields?: Maybe<Scalars['JSON']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type NavigationNavigationItemAudienceArgs = {
  filters?: InputMaybe<NavigationAudienceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type FooterInput = {
  privacyLink?: InputMaybe<ComponentSharedLinkInput>;
  termsLink?: InputMaybe<ComponentSharedLinkInput>;
  Socials?: InputMaybe<ComponentSharedSocialMediaInput>;
  Copyright?: InputMaybe<ComponentSharedCopyrightInput>;
  partnersGallery?: InputMaybe<ComponentSharedSliderInput>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type Footer = {
  __typename?: 'Footer';
  documentId: Scalars['ID']['output'];
  privacyLink?: Maybe<ComponentSharedLink>;
  termsLink?: Maybe<ComponentSharedLink>;
  Socials?: Maybe<ComponentSharedSocialMedia>;
  Copyright?: Maybe<ComponentSharedCopyright>;
  partnersGallery?: Maybe<ComponentSharedSlider>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
};

export type HomepageInput = {
  legend?: InputMaybe<Scalars['String']['input']>;
  Testimonials?: InputMaybe<Array<InputMaybe<ComponentSectionsTestimonialInput>>>;
  Teams?: InputMaybe<Array<InputMaybe<ComponentSectionsTeamInput>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type Homepage = {
  __typename?: 'Homepage';
  documentId: Scalars['ID']['output'];
  legend?: Maybe<Scalars['String']['output']>;
  Testimonials?: Maybe<Array<Maybe<ComponentSectionsTestimonial>>>;
  Teams?: Maybe<Array<Maybe<ComponentSectionsTeam>>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
};


export type HomepageTestimonialsArgs = {
  filters?: InputMaybe<ComponentSectionsTestimonialFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type HomepageTeamsArgs = {
  filters?: InputMaybe<ComponentSectionsTeamFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Enum_Post_Platform =
  | 'instagram'
  | 'facebook';

export type Enum_Post_Media_Kind =
  | 'reel'
  | 'post';

export type PostFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  platform?: InputMaybe<StringFilterInput>;
  media_kind?: InputMaybe<StringFilterInput>;
  permalink?: InputMaybe<StringFilterInput>;
  external_id?: InputMaybe<StringFilterInput>;
  owner_handle?: InputMaybe<StringFilterInput>;
  caption?: InputMaybe<StringFilterInput>;
  like_count?: InputMaybe<IntFilterInput>;
  comment_count?: InputMaybe<IntFilterInput>;
  view_count?: InputMaybe<IntFilterInput>;
  posted_at?: InputMaybe<DateTimeFilterInput>;
  thumbnail_url?: InputMaybe<StringFilterInput>;
  is_featured?: InputMaybe<BooleanFilterInput>;
  raw?: InputMaybe<JsonFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<PostFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<PostFiltersInput>>>;
  not?: InputMaybe<PostFiltersInput>;
};

export type PostInput = {
  platform?: InputMaybe<Enum_Post_Platform>;
  media_kind?: InputMaybe<Enum_Post_Media_Kind>;
  permalink?: InputMaybe<Scalars['String']['input']>;
  external_id?: InputMaybe<Scalars['String']['input']>;
  owner_handle?: InputMaybe<Scalars['String']['input']>;
  caption?: InputMaybe<Scalars['String']['input']>;
  like_count?: InputMaybe<Scalars['Int']['input']>;
  comment_count?: InputMaybe<Scalars['Int']['input']>;
  view_count?: InputMaybe<Scalars['Int']['input']>;
  posted_at?: InputMaybe<Scalars['DateTime']['input']>;
  source?: InputMaybe<Scalars['ID']['input']>;
  thumbnail_url?: InputMaybe<Scalars['String']['input']>;
  is_featured?: InputMaybe<Scalars['Boolean']['input']>;
  raw?: InputMaybe<Scalars['JSON']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type Post = {
  __typename?: 'Post';
  documentId: Scalars['ID']['output'];
  platform: Enum_Post_Platform;
  media_kind: Enum_Post_Media_Kind;
  permalink: Scalars['String']['output'];
  external_id?: Maybe<Scalars['String']['output']>;
  owner_handle?: Maybe<Scalars['String']['output']>;
  caption?: Maybe<Scalars['String']['output']>;
  like_count?: Maybe<Scalars['Int']['output']>;
  comment_count?: Maybe<Scalars['Int']['output']>;
  view_count?: Maybe<Scalars['Int']['output']>;
  posted_at?: Maybe<Scalars['DateTime']['output']>;
  source?: Maybe<UploadFile>;
  thumbnail_url?: Maybe<Scalars['String']['output']>;
  is_featured?: Maybe<Scalars['Boolean']['output']>;
  raw?: Maybe<Scalars['JSON']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type Enum_Socialpage_Provider =
  | 'facebook'
  | 'instagram';

export type SocialPageFiltersInput = {
  documentId?: InputMaybe<IdFilterInput>;
  provider?: InputMaybe<StringFilterInput>;
  page_id?: InputMaybe<StringFilterInput>;
  ig_business_id?: InputMaybe<StringFilterInput>;
  page_name?: InputMaybe<StringFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  user_access_token?: InputMaybe<StringFilterInput>;
  page_access_token?: InputMaybe<StringFilterInput>;
  expires_at?: InputMaybe<DateTimeFilterInput>;
  admin_id?: InputMaybe<IntFilterInput>;
  state?: InputMaybe<StringFilterInput>;
  scopes?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  and?: InputMaybe<Array<InputMaybe<SocialPageFiltersInput>>>;
  or?: InputMaybe<Array<InputMaybe<SocialPageFiltersInput>>>;
  not?: InputMaybe<SocialPageFiltersInput>;
};

export type SocialPageInput = {
  provider?: InputMaybe<Enum_Socialpage_Provider>;
  page_id?: InputMaybe<Scalars['String']['input']>;
  ig_business_id?: InputMaybe<Scalars['String']['input']>;
  page_name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  user_access_token?: InputMaybe<Scalars['String']['input']>;
  page_access_token?: InputMaybe<Scalars['String']['input']>;
  expires_at?: InputMaybe<Scalars['DateTime']['input']>;
  admin_id?: InputMaybe<Scalars['Int']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  scopes?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type SocialPage = {
  __typename?: 'SocialPage';
  documentId: Scalars['ID']['output'];
  provider?: Maybe<Enum_Socialpage_Provider>;
  page_id?: Maybe<Scalars['String']['output']>;
  ig_business_id?: Maybe<Scalars['String']['output']>;
  page_name?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  user_access_token: Scalars['String']['output'];
  page_access_token?: Maybe<Scalars['String']['output']>;
  expires_at: Scalars['DateTime']['output'];
  admin_id: Scalars['Int']['output'];
  state?: Maybe<Scalars['String']['output']>;
  scopes?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type FileInfoInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  alternativeText?: InputMaybe<Scalars['String']['input']>;
  caption?: InputMaybe<Scalars['String']['input']>;
};

export type UsersPermissionsMe = {
  __typename?: 'UsersPermissionsMe';
  id: Scalars['ID']['output'];
  documentId: Scalars['ID']['output'];
  username: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  confirmed?: Maybe<Scalars['Boolean']['output']>;
  blocked?: Maybe<Scalars['Boolean']['output']>;
  role?: Maybe<UsersPermissionsMeRole>;
};

export type UsersPermissionsMeRole = {
  __typename?: 'UsersPermissionsMeRole';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type UsersPermissionsRegisterInput = {
  username: Scalars['String']['input'];
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type UsersPermissionsLoginInput = {
  identifier: Scalars['String']['input'];
  password: Scalars['String']['input'];
  provider?: Scalars['String']['input'];
};

export type UsersPermissionsPasswordPayload = {
  __typename?: 'UsersPermissionsPasswordPayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsLoginPayload = {
  __typename?: 'UsersPermissionsLoginPayload';
  jwt?: Maybe<Scalars['String']['output']>;
  user: UsersPermissionsMe;
};

export type UsersPermissionsCreateRolePayload = {
  __typename?: 'UsersPermissionsCreateRolePayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsUpdateRolePayload = {
  __typename?: 'UsersPermissionsUpdateRolePayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsDeleteRolePayload = {
  __typename?: 'UsersPermissionsDeleteRolePayload';
  ok: Scalars['Boolean']['output'];
};

export type PaginationArg = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  start?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type Query = {
  __typename?: 'Query';
  uploadFile?: Maybe<UploadFile>;
  uploadFiles: Array<Maybe<UploadFile>>;
  i18NLocale?: Maybe<I18NLocale>;
  i18NLocales: Array<Maybe<I18NLocale>>;
  reviewWorkflowsWorkflow?: Maybe<ReviewWorkflowsWorkflow>;
  reviewWorkflowsWorkflows: Array<Maybe<ReviewWorkflowsWorkflow>>;
  reviewWorkflowsWorkflowStage?: Maybe<ReviewWorkflowsWorkflowStage>;
  reviewWorkflowsWorkflowStages: Array<Maybe<ReviewWorkflowsWorkflowStage>>;
  usersPermissionsRole?: Maybe<UsersPermissionsRole>;
  usersPermissionsRoles: Array<Maybe<UsersPermissionsRole>>;
  usersPermissionsUser?: Maybe<UsersPermissionsUser>;
  usersPermissionsUsers: Array<Maybe<UsersPermissionsUser>>;
  navigationAudience?: Maybe<NavigationAudience>;
  navigationAudiences: Array<Maybe<NavigationAudience>>;
  navigationNavigation?: Maybe<NavigationNavigation>;
  navigationNavigations: Array<Maybe<NavigationNavigation>>;
  navigationNavigationItem?: Maybe<NavigationNavigationItem>;
  navigationNavigationItems: Array<Maybe<NavigationNavigationItem>>;
  footer?: Maybe<Footer>;
  homepage?: Maybe<Homepage>;
  post?: Maybe<Post>;
  posts: Array<Maybe<Post>>;
  socialPage?: Maybe<SocialPage>;
  socialPages: Array<Maybe<SocialPage>>;
  me?: Maybe<UsersPermissionsMe>;
};


export type QueryUploadFileArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUploadFilesArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryI18NLocaleArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryI18NLocalesArgs = {
  filters?: InputMaybe<I18NLocaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflowArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflowsArgs = {
  filters?: InputMaybe<ReviewWorkflowsWorkflowFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflowStageArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflowStagesArgs = {
  filters?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsRoleArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsRolesArgs = {
  filters?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsUserArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryNavigationAudienceArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryNavigationAudiencesArgs = {
  filters?: InputMaybe<NavigationAudienceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryNavigationNavigationArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryNavigationNavigationsArgs = {
  filters?: InputMaybe<NavigationNavigationFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryNavigationNavigationItemArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryNavigationNavigationItemsArgs = {
  filters?: InputMaybe<NavigationNavigationItemFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryFooterArgs = {
  status?: InputMaybe<PublicationStatus>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryHomepageArgs = {
  status?: InputMaybe<PublicationStatus>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type QueryPostArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryPostsArgs = {
  filters?: InputMaybe<PostFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySocialPageArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySocialPagesArgs = {
  filters?: InputMaybe<SocialPageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createReviewWorkflowsWorkflow?: Maybe<ReviewWorkflowsWorkflow>;
  updateReviewWorkflowsWorkflow?: Maybe<ReviewWorkflowsWorkflow>;
  deleteReviewWorkflowsWorkflow?: Maybe<DeleteMutationResponse>;
  createReviewWorkflowsWorkflowStage?: Maybe<ReviewWorkflowsWorkflowStage>;
  updateReviewWorkflowsWorkflowStage?: Maybe<ReviewWorkflowsWorkflowStage>;
  deleteReviewWorkflowsWorkflowStage?: Maybe<DeleteMutationResponse>;
  createNavigationAudience?: Maybe<NavigationAudience>;
  updateNavigationAudience?: Maybe<NavigationAudience>;
  deleteNavigationAudience?: Maybe<DeleteMutationResponse>;
  createNavigationNavigation?: Maybe<NavigationNavigation>;
  updateNavigationNavigation?: Maybe<NavigationNavigation>;
  deleteNavigationNavigation?: Maybe<DeleteMutationResponse>;
  createNavigationNavigationItem?: Maybe<NavigationNavigationItem>;
  updateNavigationNavigationItem?: Maybe<NavigationNavigationItem>;
  deleteNavigationNavigationItem?: Maybe<DeleteMutationResponse>;
  updateFooter?: Maybe<Footer>;
  deleteFooter?: Maybe<DeleteMutationResponse>;
  updateHomepage?: Maybe<Homepage>;
  deleteHomepage?: Maybe<DeleteMutationResponse>;
  createPost?: Maybe<Post>;
  updatePost?: Maybe<Post>;
  deletePost?: Maybe<DeleteMutationResponse>;
  createSocialPage?: Maybe<SocialPage>;
  updateSocialPage?: Maybe<SocialPage>;
  deleteSocialPage?: Maybe<DeleteMutationResponse>;
  updateUploadFile: UploadFile;
  deleteUploadFile?: Maybe<UploadFile>;
  /** Create a new role */
  createUsersPermissionsRole?: Maybe<UsersPermissionsCreateRolePayload>;
  /** Update an existing role */
  updateUsersPermissionsRole?: Maybe<UsersPermissionsUpdateRolePayload>;
  /** Delete an existing role */
  deleteUsersPermissionsRole?: Maybe<UsersPermissionsDeleteRolePayload>;
  /** Create a new user */
  createUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  /** Update an existing user */
  updateUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  /** Delete an existing user */
  deleteUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  login: UsersPermissionsLoginPayload;
  /** Register a user */
  register: UsersPermissionsLoginPayload;
  /** Request a reset password token */
  forgotPassword?: Maybe<UsersPermissionsPasswordPayload>;
  /** Reset user password. Confirm with a code (resetToken from forgotPassword) */
  resetPassword?: Maybe<UsersPermissionsLoginPayload>;
  /** Change user password. Confirm with the current password. */
  changePassword?: Maybe<UsersPermissionsLoginPayload>;
  /** Confirm an email users email address */
  emailConfirmation?: Maybe<UsersPermissionsLoginPayload>;
};


export type MutationCreateReviewWorkflowsWorkflowArgs = {
  status?: InputMaybe<PublicationStatus>;
  data: ReviewWorkflowsWorkflowInput;
};


export type MutationUpdateReviewWorkflowsWorkflowArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
  data: ReviewWorkflowsWorkflowInput;
};


export type MutationDeleteReviewWorkflowsWorkflowArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationCreateReviewWorkflowsWorkflowStageArgs = {
  status?: InputMaybe<PublicationStatus>;
  data: ReviewWorkflowsWorkflowStageInput;
};


export type MutationUpdateReviewWorkflowsWorkflowStageArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
  data: ReviewWorkflowsWorkflowStageInput;
};


export type MutationDeleteReviewWorkflowsWorkflowStageArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationCreateNavigationAudienceArgs = {
  status?: InputMaybe<PublicationStatus>;
  data: NavigationAudienceInput;
};


export type MutationUpdateNavigationAudienceArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
  data: NavigationAudienceInput;
};


export type MutationDeleteNavigationAudienceArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationCreateNavigationNavigationArgs = {
  status?: InputMaybe<PublicationStatus>;
  data: NavigationNavigationInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateNavigationNavigationArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
  data: NavigationNavigationInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteNavigationNavigationArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreateNavigationNavigationItemArgs = {
  status?: InputMaybe<PublicationStatus>;
  data: NavigationNavigationItemInput;
};


export type MutationUpdateNavigationNavigationItemArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
  data: NavigationNavigationItemInput;
};


export type MutationDeleteNavigationNavigationItemArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationUpdateFooterArgs = {
  status?: InputMaybe<PublicationStatus>;
  data: FooterInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteFooterArgs = {
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationUpdateHomepageArgs = {
  status?: InputMaybe<PublicationStatus>;
  data: HomepageInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteHomepageArgs = {
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationCreatePostArgs = {
  status?: InputMaybe<PublicationStatus>;
  data: PostInput;
};


export type MutationUpdatePostArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
  data: PostInput;
};


export type MutationDeletePostArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationCreateSocialPageArgs = {
  status?: InputMaybe<PublicationStatus>;
  data: SocialPageInput;
};


export type MutationUpdateSocialPageArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
  data: SocialPageInput;
};


export type MutationDeleteSocialPageArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationUpdateUploadFileArgs = {
  id: Scalars['ID']['input'];
  info?: InputMaybe<FileInfoInput>;
};


export type MutationDeleteUploadFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateUsersPermissionsRoleArgs = {
  data: UsersPermissionsRoleInput;
};


export type MutationUpdateUsersPermissionsRoleArgs = {
  id: Scalars['ID']['input'];
  data: UsersPermissionsRoleInput;
};


export type MutationDeleteUsersPermissionsRoleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateUsersPermissionsUserArgs = {
  data: UsersPermissionsUserInput;
};


export type MutationUpdateUsersPermissionsUserArgs = {
  id: Scalars['ID']['input'];
  data: UsersPermissionsUserInput;
};


export type MutationDeleteUsersPermissionsUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  input: UsersPermissionsLoginInput;
};


export type MutationRegisterArgs = {
  input: UsersPermissionsRegisterInput;
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  password: Scalars['String']['input'];
  passwordConfirmation: Scalars['String']['input'];
  code: Scalars['String']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  password: Scalars['String']['input'];
  passwordConfirmation: Scalars['String']['input'];
};


export type MutationEmailConfirmationArgs = {
  confirmation: Scalars['String']['input'];
};


type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const PublicationStatusSchema = z.enum(['DRAFT', 'PUBLISHED']);

export const Enum_Navigationnavigationitem_TypeSchema = z.enum(['INTERNAL', 'EXTERNAL', 'WRAPPER']);

export const Enum_Post_PlatformSchema = z.enum(['instagram', 'facebook']);

export const Enum_Post_Media_KindSchema = z.enum(['reel', 'post']);

export const Enum_Socialpage_ProviderSchema = z.enum(['facebook', 'instagram']);

export function DeleteMutationResponseSchema(): z.ZodObject<Properties<DeleteMutationResponse>> {
  return z.object({
    __typename: z.literal('DeleteMutationResponse').optional(),
    documentId: z.string()
  })
}

export function IdFilterInputSchema(): z.ZodObject<Properties<IdFilterInput>> {
  return z.object({
    and: z.array(z.string().nullable()).nullish(),
    or: z.array(z.string().nullable()).nullish(),
    not: z.lazy(() => IdFilterInputSchema().nullish()),
    eq: z.string().nullish(),
    eqi: z.string().nullish(),
    ne: z.string().nullish(),
    nei: z.string().nullish(),
    startsWith: z.string().nullish(),
    endsWith: z.string().nullish(),
    contains: z.string().nullish(),
    notContains: z.string().nullish(),
    containsi: z.string().nullish(),
    notContainsi: z.string().nullish(),
    gt: z.string().nullish(),
    gte: z.string().nullish(),
    lt: z.string().nullish(),
    lte: z.string().nullish(),
    null: z.boolean().nullish(),
    notNull: z.boolean().nullish(),
    in: z.array(z.string().nullable()).nullish(),
    notIn: z.array(z.string().nullable()).nullish(),
    between: z.array(z.string().nullable()).nullish()
  })
}

export function BooleanFilterInputSchema(): z.ZodObject<Properties<BooleanFilterInput>> {
  return z.object({
    and: z.array(z.boolean().nullable()).nullish(),
    or: z.array(z.boolean().nullable()).nullish(),
    not: z.lazy(() => BooleanFilterInputSchema().nullish()),
    eq: z.boolean().nullish(),
    eqi: z.boolean().nullish(),
    ne: z.boolean().nullish(),
    nei: z.boolean().nullish(),
    startsWith: z.boolean().nullish(),
    endsWith: z.boolean().nullish(),
    contains: z.boolean().nullish(),
    notContains: z.boolean().nullish(),
    containsi: z.boolean().nullish(),
    notContainsi: z.boolean().nullish(),
    gt: z.boolean().nullish(),
    gte: z.boolean().nullish(),
    lt: z.boolean().nullish(),
    lte: z.boolean().nullish(),
    null: z.boolean().nullish(),
    notNull: z.boolean().nullish(),
    in: z.array(z.boolean().nullable()).nullish(),
    notIn: z.array(z.boolean().nullable()).nullish(),
    between: z.array(z.boolean().nullable()).nullish()
  })
}

export function StringFilterInputSchema(): z.ZodObject<Properties<StringFilterInput>> {
  return z.object({
    and: z.array(z.string().nullable()).nullish(),
    or: z.array(z.string().nullable()).nullish(),
    not: z.lazy(() => StringFilterInputSchema().nullish()),
    eq: z.string().nullish(),
    eqi: z.string().nullish(),
    ne: z.string().nullish(),
    nei: z.string().nullish(),
    startsWith: z.string().nullish(),
    endsWith: z.string().nullish(),
    contains: z.string().nullish(),
    notContains: z.string().nullish(),
    containsi: z.string().nullish(),
    notContainsi: z.string().nullish(),
    gt: z.string().nullish(),
    gte: z.string().nullish(),
    lt: z.string().nullish(),
    lte: z.string().nullish(),
    null: z.boolean().nullish(),
    notNull: z.boolean().nullish(),
    in: z.array(z.string().nullable()).nullish(),
    notIn: z.array(z.string().nullable()).nullish(),
    between: z.array(z.string().nullable()).nullish()
  })
}

export function IntFilterInputSchema(): z.ZodObject<Properties<IntFilterInput>> {
  return z.object({
    and: z.array(z.number().nullable()).nullish(),
    or: z.array(z.number().nullable()).nullish(),
    not: z.lazy(() => IntFilterInputSchema().nullish()),
    eq: z.number().nullish(),
    eqi: z.number().nullish(),
    ne: z.number().nullish(),
    nei: z.number().nullish(),
    startsWith: z.number().nullish(),
    endsWith: z.number().nullish(),
    contains: z.number().nullish(),
    notContains: z.number().nullish(),
    containsi: z.number().nullish(),
    notContainsi: z.number().nullish(),
    gt: z.number().nullish(),
    gte: z.number().nullish(),
    lt: z.number().nullish(),
    lte: z.number().nullish(),
    null: z.boolean().nullish(),
    notNull: z.boolean().nullish(),
    in: z.array(z.number().nullable()).nullish(),
    notIn: z.array(z.number().nullable()).nullish(),
    between: z.array(z.number().nullable()).nullish()
  })
}

export function FloatFilterInputSchema(): z.ZodObject<Properties<FloatFilterInput>> {
  return z.object({
    and: z.array(z.number().nullable()).nullish(),
    or: z.array(z.number().nullable()).nullish(),
    not: z.lazy(() => FloatFilterInputSchema().nullish()),
    eq: z.number().nullish(),
    eqi: z.number().nullish(),
    ne: z.number().nullish(),
    nei: z.number().nullish(),
    startsWith: z.number().nullish(),
    endsWith: z.number().nullish(),
    contains: z.number().nullish(),
    notContains: z.number().nullish(),
    containsi: z.number().nullish(),
    notContainsi: z.number().nullish(),
    gt: z.number().nullish(),
    gte: z.number().nullish(),
    lt: z.number().nullish(),
    lte: z.number().nullish(),
    null: z.boolean().nullish(),
    notNull: z.boolean().nullish(),
    in: z.array(z.number().nullable()).nullish(),
    notIn: z.array(z.number().nullable()).nullish(),
    between: z.array(z.number().nullable()).nullish()
  })
}

export function DateTimeFilterInputSchema(): z.ZodObject<Properties<DateTimeFilterInput>> {
  return z.object({
    and: z.array(z.string().datetime().nullable()).nullish(),
    or: z.array(z.string().datetime().nullable()).nullish(),
    not: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    eq: z.string().datetime().nullish(),
    eqi: z.string().datetime().nullish(),
    ne: z.string().datetime().nullish(),
    nei: z.string().datetime().nullish(),
    startsWith: z.string().datetime().nullish(),
    endsWith: z.string().datetime().nullish(),
    contains: z.string().datetime().nullish(),
    notContains: z.string().datetime().nullish(),
    containsi: z.string().datetime().nullish(),
    notContainsi: z.string().datetime().nullish(),
    gt: z.string().datetime().nullish(),
    gte: z.string().datetime().nullish(),
    lt: z.string().datetime().nullish(),
    lte: z.string().datetime().nullish(),
    null: z.boolean().nullish(),
    notNull: z.boolean().nullish(),
    in: z.array(z.string().datetime().nullable()).nullish(),
    notIn: z.array(z.string().datetime().nullable()).nullish(),
    between: z.array(z.string().datetime().nullable()).nullish()
  })
}

export function JsonFilterInputSchema(): z.ZodObject<Properties<JsonFilterInput>> {
  return z.object({
    and: z.array(z.any().nullable()).nullish(),
    or: z.array(z.any().nullable()).nullish(),
    not: z.lazy(() => JsonFilterInputSchema().nullish()),
    eq: z.any().nullish(),
    eqi: z.any().nullish(),
    ne: z.any().nullish(),
    nei: z.any().nullish(),
    startsWith: z.any().nullish(),
    endsWith: z.any().nullish(),
    contains: z.any().nullish(),
    notContains: z.any().nullish(),
    containsi: z.any().nullish(),
    notContainsi: z.any().nullish(),
    gt: z.any().nullish(),
    gte: z.any().nullish(),
    lt: z.any().nullish(),
    lte: z.any().nullish(),
    null: z.boolean().nullish(),
    notNull: z.boolean().nullish(),
    in: z.array(z.any().nullable()).nullish(),
    notIn: z.array(z.any().nullable()).nullish(),
    between: z.array(z.any().nullable()).nullish()
  })
}

export function ComponentSharedSocialMediaInputSchema(): z.ZodObject<Properties<ComponentSharedSocialMediaInput>> {
  return z.object({
    id: z.string().nullish(),
    facebook: z.string().nullish(),
    instagram: z.string().nullish(),
    twitter: z.string().nullish(),
    tiktok: z.string().nullish()
  })
}

export function ComponentSharedSocialMediaSchema(): z.ZodObject<Properties<ComponentSharedSocialMedia>> {
  return z.object({
    __typename: z.literal('ComponentSharedSocialMedia').optional(),
    id: z.string(),
    facebook: z.string().nullish(),
    instagram: z.string().nullish(),
    twitter: z.string().nullish(),
    tiktok: z.string().nullish()
  })
}

export function ComponentSharedSliderInputSchema(): z.ZodObject<Properties<ComponentSharedSliderInput>> {
  return z.object({
    id: z.string().nullish(),
    files: z.array(z.string().nullable()).nullish()
  })
}

export function ComponentSharedSliderSchema(): z.ZodObject<Properties<ComponentSharedSlider>> {
  return z.object({
    __typename: z.literal('ComponentSharedSlider').optional(),
    id: z.string(),
    files: z.array(UploadFileSchema().nullable())
  })
}

export function ComponentSharedSliderFilesArgsSchema(): z.ZodObject<Properties<ComponentSharedSliderFilesArgs>> {
  return z.object({
    filters: z.lazy(() => UploadFileFiltersInputSchema().nullish()),
    pagination: PaginationArgSchema().nullish(),
    sort: z.array(z.string().nullable()).nullish()
  })
}

export function ComponentSharedQuoteFiltersInputSchema(): z.ZodObject<Properties<ComponentSharedQuoteFiltersInput>> {
  return z.object({
    author: z.lazy(() => StringFilterInputSchema().nullish()),
    body: z.lazy(() => JsonFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => ComponentSharedQuoteFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => ComponentSharedQuoteFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => ComponentSharedQuoteFiltersInputSchema().nullish())
  })
}

export function ComponentSharedQuoteInputSchema(): z.ZodObject<Properties<ComponentSharedQuoteInput>> {
  return z.object({
    id: z.string().nullish(),
    author: z.string().nullish(),
    body: z.any().nullish()
  })
}

export function ComponentSharedQuoteSchema(): z.ZodObject<Properties<ComponentSharedQuote>> {
  return z.object({
    __typename: z.literal('ComponentSharedQuote').optional(),
    id: z.string(),
    author: z.string(),
    body: z.any()
  })
}

export function ComponentSharedLinkInputSchema(): z.ZodObject<Properties<ComponentSharedLinkInput>> {
  return z.object({
    id: z.string().nullish(),
    text: z.string().nullish(),
    href: z.string().nullish()
  })
}

export function ComponentSharedLinkSchema(): z.ZodObject<Properties<ComponentSharedLink>> {
  return z.object({
    __typename: z.literal('ComponentSharedLink').optional(),
    id: z.string(),
    text: z.string(),
    href: z.string()
  })
}

export function ComponentSharedCopyrightInputSchema(): z.ZodObject<Properties<ComponentSharedCopyrightInput>> {
  return z.object({
    id: z.string().nullish(),
    legalname: z.string().nullish(),
    yearStart: z.number().nullish(),
    autoYear: z.boolean().nullish(),
    yearOverride: z.number().nullish(),
    extraText: z.string().nullish()
  })
}

export function ComponentSharedCopyrightSchema(): z.ZodObject<Properties<ComponentSharedCopyright>> {
  return z.object({
    __typename: z.literal('ComponentSharedCopyright').optional(),
    id: z.string(),
    legalname: z.string(),
    yearStart: z.number().nullish(),
    autoYear: z.boolean().nullish(),
    yearOverride: z.number().nullish(),
    extraText: z.string().nullish()
  })
}

export function ComponentSectionsTestimonialFiltersInputSchema(): z.ZodObject<Properties<ComponentSectionsTestimonialFiltersInput>> {
  return z.object({
    author_quote: z.lazy(() => ComponentSharedQuoteFiltersInputSchema().nullish()),
    organization: z.lazy(() => StringFilterInputSchema().nullish()),
    age: z.lazy(() => IntFilterInputSchema().nullish()),
    author_role: z.lazy(() => StringFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => ComponentSectionsTestimonialFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => ComponentSectionsTestimonialFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => ComponentSectionsTestimonialFiltersInputSchema().nullish())
  })
}

export function ComponentSectionsTestimonialInputSchema(): z.ZodObject<Properties<ComponentSectionsTestimonialInput>> {
  return z.object({
    id: z.string().nullish(),
    author_quote: z.lazy(() => ComponentSharedQuoteInputSchema().nullish()),
    organization: z.string().nullish(),
    picture: z.string().nullish(),
    age: z.number().nullish(),
    author_role: z.string().nullish()
  })
}

export function ComponentSectionsTestimonialSchema(): z.ZodObject<Properties<ComponentSectionsTestimonial>> {
  return z.object({
    __typename: z.literal('ComponentSectionsTestimonial').optional(),
    id: z.string(),
    author_quote: ComponentSharedQuoteSchema(),
    organization: z.string().nullish(),
    picture: UploadFileSchema(),
    age: z.number().nullish(),
    author_role: z.string().nullish()
  })
}

export function ComponentSectionsTeamFiltersInputSchema(): z.ZodObject<Properties<ComponentSectionsTeamFiltersInput>> {
  return z.object({
    full_name: z.lazy(() => StringFilterInputSchema().nullish()),
    role: z.lazy(() => StringFilterInputSchema().nullish()),
    organization: z.lazy(() => StringFilterInputSchema().nullish()),
    about: z.lazy(() => JsonFilterInputSchema().nullish()),
    email: z.lazy(() => StringFilterInputSchema().nullish()),
    age: z.lazy(() => IntFilterInputSchema().nullish()),
    phone_number: z.lazy(() => StringFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => ComponentSectionsTeamFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => ComponentSectionsTeamFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => ComponentSectionsTeamFiltersInputSchema().nullish())
  })
}

export function ComponentSectionsTeamInputSchema(): z.ZodObject<Properties<ComponentSectionsTeamInput>> {
  return z.object({
    id: z.string().nullish(),
    full_name: z.string().nullish(),
    role: z.string().nullish(),
    organization: z.string().nullish(),
    about: z.any().nullish(),
    picture: z.string().nullish(),
    email: z.string().nullish(),
    age: z.number().nullish(),
    phone_number: z.string().nullish()
  })
}

export function ComponentSectionsTeamSchema(): z.ZodObject<Properties<ComponentSectionsTeam>> {
  return z.object({
    __typename: z.literal('ComponentSectionsTeam').optional(),
    id: z.string(),
    full_name: z.string(),
    role: z.string().nullish(),
    organization: z.string().nullish(),
    about: z.any().nullish(),
    picture: UploadFileSchema(),
    email: z.string().nullish(),
    age: z.number().nullish(),
    phone_number: z.string().nullish()
  })
}

export function UploadFileFiltersInputSchema(): z.ZodObject<Properties<UploadFileFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    name: z.lazy(() => StringFilterInputSchema().nullish()),
    alternativeText: z.lazy(() => StringFilterInputSchema().nullish()),
    caption: z.lazy(() => StringFilterInputSchema().nullish()),
    width: z.lazy(() => IntFilterInputSchema().nullish()),
    height: z.lazy(() => IntFilterInputSchema().nullish()),
    formats: z.lazy(() => JsonFilterInputSchema().nullish()),
    hash: z.lazy(() => StringFilterInputSchema().nullish()),
    ext: z.lazy(() => StringFilterInputSchema().nullish()),
    mime: z.lazy(() => StringFilterInputSchema().nullish()),
    size: z.lazy(() => FloatFilterInputSchema().nullish()),
    url: z.lazy(() => StringFilterInputSchema().nullish()),
    previewUrl: z.lazy(() => StringFilterInputSchema().nullish()),
    provider: z.lazy(() => StringFilterInputSchema().nullish()),
    provider_metadata: z.lazy(() => JsonFilterInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => UploadFileFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => UploadFileFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => UploadFileFiltersInputSchema().nullish())
  })
}

export function UploadFileSchema(): z.ZodObject<Properties<UploadFile>> {
  return z.object({
    __typename: z.literal('UploadFile').optional(),
    documentId: z.string(),
    name: z.string(),
    alternativeText: z.string().nullish(),
    caption: z.string().nullish(),
    width: z.number().nullish(),
    height: z.number().nullish(),
    formats: z.any().nullish(),
    hash: z.string(),
    ext: z.string().nullish(),
    mime: z.string(),
    size: z.number(),
    url: z.string(),
    previewUrl: z.string().nullish(),
    provider: z.string(),
    provider_metadata: z.any().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function I18NLocaleFiltersInputSchema(): z.ZodObject<Properties<I18NLocaleFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    name: z.lazy(() => StringFilterInputSchema().nullish()),
    code: z.lazy(() => StringFilterInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => I18NLocaleFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => I18NLocaleFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => I18NLocaleFiltersInputSchema().nullish())
  })
}

export function I18NLocaleSchema(): z.ZodObject<Properties<I18NLocale>> {
  return z.object({
    __typename: z.literal('I18NLocale').optional(),
    documentId: z.string(),
    name: z.string().nullish(),
    code: z.string().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function ReviewWorkflowsWorkflowFiltersInputSchema(): z.ZodObject<Properties<ReviewWorkflowsWorkflowFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    name: z.lazy(() => StringFilterInputSchema().nullish()),
    stages: z.lazy(() => ReviewWorkflowsWorkflowStageFiltersInputSchema().nullish()),
    stageRequiredToPublish: z.lazy(() => ReviewWorkflowsWorkflowStageFiltersInputSchema().nullish()),
    contentTypes: z.lazy(() => JsonFilterInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => ReviewWorkflowsWorkflowFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => ReviewWorkflowsWorkflowFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => ReviewWorkflowsWorkflowFiltersInputSchema().nullish())
  })
}

export function ReviewWorkflowsWorkflowInputSchema(): z.ZodObject<Properties<ReviewWorkflowsWorkflowInput>> {
  return z.object({
    name: z.string().nullish(),
    stages: z.array(z.string().nullable()).nullish(),
    stageRequiredToPublish: z.string().nullish(),
    contentTypes: z.any().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function ReviewWorkflowsWorkflowSchema(): z.ZodObject<Properties<ReviewWorkflowsWorkflow>> {
  return z.object({
    __typename: z.literal('ReviewWorkflowsWorkflow').optional(),
    documentId: z.string(),
    name: z.string(),
    stages: z.array(ReviewWorkflowsWorkflowStageSchema().nullable()),
    stageRequiredToPublish: ReviewWorkflowsWorkflowStageSchema().nullish(),
    contentTypes: z.any(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function ReviewWorkflowsWorkflowStagesArgsSchema(): z.ZodObject<Properties<ReviewWorkflowsWorkflowStagesArgs>> {
  return z.object({
    filters: z.lazy(() => ReviewWorkflowsWorkflowStageFiltersInputSchema().nullish()),
    pagination: PaginationArgSchema().nullish(),
    sort: z.array(z.string().nullable()).nullish()
  })
}

export function ReviewWorkflowsWorkflowStageFiltersInputSchema(): z.ZodObject<Properties<ReviewWorkflowsWorkflowStageFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    name: z.lazy(() => StringFilterInputSchema().nullish()),
    color: z.lazy(() => StringFilterInputSchema().nullish()),
    workflow: z.lazy(() => ReviewWorkflowsWorkflowFiltersInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => ReviewWorkflowsWorkflowStageFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => ReviewWorkflowsWorkflowStageFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => ReviewWorkflowsWorkflowStageFiltersInputSchema().nullish())
  })
}

export function ReviewWorkflowsWorkflowStageInputSchema(): z.ZodObject<Properties<ReviewWorkflowsWorkflowStageInput>> {
  return z.object({
    name: z.string().nullish(),
    color: z.string().nullish(),
    workflow: z.string().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function ReviewWorkflowsWorkflowStageSchema(): z.ZodObject<Properties<ReviewWorkflowsWorkflowStage>> {
  return z.object({
    __typename: z.literal('ReviewWorkflowsWorkflowStage').optional(),
    documentId: z.string(),
    name: z.string().nullish(),
    color: z.string().nullish(),
    workflow: ReviewWorkflowsWorkflowSchema().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function UsersPermissionsPermissionFiltersInputSchema(): z.ZodObject<Properties<UsersPermissionsPermissionFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    action: z.lazy(() => StringFilterInputSchema().nullish()),
    role: z.lazy(() => UsersPermissionsRoleFiltersInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => UsersPermissionsPermissionFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => UsersPermissionsPermissionFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => UsersPermissionsPermissionFiltersInputSchema().nullish())
  })
}

export function UsersPermissionsPermissionSchema(): z.ZodObject<Properties<UsersPermissionsPermission>> {
  return z.object({
    __typename: z.literal('UsersPermissionsPermission').optional(),
    documentId: z.string(),
    action: z.string(),
    role: UsersPermissionsRoleSchema().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function UsersPermissionsRoleFiltersInputSchema(): z.ZodObject<Properties<UsersPermissionsRoleFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    name: z.lazy(() => StringFilterInputSchema().nullish()),
    description: z.lazy(() => StringFilterInputSchema().nullish()),
    type: z.lazy(() => StringFilterInputSchema().nullish()),
    permissions: z.lazy(() => UsersPermissionsPermissionFiltersInputSchema().nullish()),
    users: z.lazy(() => UsersPermissionsUserFiltersInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => UsersPermissionsRoleFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => UsersPermissionsRoleFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => UsersPermissionsRoleFiltersInputSchema().nullish())
  })
}

export function UsersPermissionsRoleInputSchema(): z.ZodObject<Properties<UsersPermissionsRoleInput>> {
  return z.object({
    name: z.string().nullish(),
    description: z.string().nullish(),
    type: z.string().nullish(),
    permissions: z.array(z.string().nullable()).nullish(),
    users: z.array(z.string().nullable()).nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function UsersPermissionsRoleSchema(): z.ZodObject<Properties<UsersPermissionsRole>> {
  return z.object({
    __typename: z.literal('UsersPermissionsRole').optional(),
    documentId: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    type: z.string().nullish(),
    permissions: z.array(UsersPermissionsPermissionSchema().nullable()),
    users: z.array(UsersPermissionsUserSchema().nullable()),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function UsersPermissionsRolePermissionsArgsSchema(): z.ZodObject<Properties<UsersPermissionsRolePermissionsArgs>> {
  return z.object({
    filters: z.lazy(() => UsersPermissionsPermissionFiltersInputSchema().nullish()),
    pagination: PaginationArgSchema().nullish(),
    sort: z.array(z.string().nullable()).nullish()
  })
}

export function UsersPermissionsRoleUsersArgsSchema(): z.ZodObject<Properties<UsersPermissionsRoleUsersArgs>> {
  return z.object({
    filters: z.lazy(() => UsersPermissionsUserFiltersInputSchema().nullish()),
    pagination: PaginationArgSchema().nullish(),
    sort: z.array(z.string().nullable()).nullish()
  })
}

export function UsersPermissionsUserFiltersInputSchema(): z.ZodObject<Properties<UsersPermissionsUserFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    username: z.lazy(() => StringFilterInputSchema().nullish()),
    email: z.lazy(() => StringFilterInputSchema().nullish()),
    provider: z.lazy(() => StringFilterInputSchema().nullish()),
    confirmed: z.lazy(() => BooleanFilterInputSchema().nullish()),
    blocked: z.lazy(() => BooleanFilterInputSchema().nullish()),
    role: z.lazy(() => UsersPermissionsRoleFiltersInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => UsersPermissionsUserFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => UsersPermissionsUserFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => UsersPermissionsUserFiltersInputSchema().nullish())
  })
}

export function UsersPermissionsUserInputSchema(): z.ZodObject<Properties<UsersPermissionsUserInput>> {
  return z.object({
    username: z.string().nullish(),
    email: z.string().nullish(),
    provider: z.string().nullish(),
    confirmed: z.boolean().nullish(),
    blocked: z.boolean().nullish(),
    role: z.string().nullish(),
    publishedAt: z.string().datetime().nullish(),
    password: z.string().nullish()
  })
}

export function UsersPermissionsUserSchema(): z.ZodObject<Properties<UsersPermissionsUser>> {
  return z.object({
    __typename: z.literal('UsersPermissionsUser').optional(),
    documentId: z.string(),
    username: z.string(),
    email: z.string(),
    provider: z.string().nullish(),
    confirmed: z.boolean().nullish(),
    blocked: z.boolean().nullish(),
    role: UsersPermissionsRoleSchema().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function UsersPermissionsUserEntityResponseSchema(): z.ZodObject<Properties<UsersPermissionsUserEntityResponse>> {
  return z.object({
    __typename: z.literal('UsersPermissionsUserEntityResponse').optional(),
    data: UsersPermissionsUserSchema().nullish()
  })
}

export function NavigationAudienceFiltersInputSchema(): z.ZodObject<Properties<NavigationAudienceFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    name: z.lazy(() => StringFilterInputSchema().nullish()),
    key: z.lazy(() => StringFilterInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => NavigationAudienceFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => NavigationAudienceFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => NavigationAudienceFiltersInputSchema().nullish())
  })
}

export function NavigationAudienceInputSchema(): z.ZodObject<Properties<NavigationAudienceInput>> {
  return z.object({
    name: z.string().nullish(),
    key: z.string().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function NavigationAudienceSchema(): z.ZodObject<Properties<NavigationAudience>> {
  return z.object({
    __typename: z.literal('NavigationAudience').optional(),
    documentId: z.string(),
    name: z.string(),
    key: z.string().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function NavigationNavigationFiltersInputSchema(): z.ZodObject<Properties<NavigationNavigationFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    name: z.lazy(() => StringFilterInputSchema().nullish()),
    slug: z.lazy(() => StringFilterInputSchema().nullish()),
    visible: z.lazy(() => BooleanFilterInputSchema().nullish()),
    items: z.lazy(() => NavigationNavigationItemFiltersInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    locale: z.lazy(() => StringFilterInputSchema().nullish()),
    localizations: z.lazy(() => NavigationNavigationFiltersInputSchema().nullish()),
    and: z.array(z.lazy(() => NavigationNavigationFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => NavigationNavigationFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => NavigationNavigationFiltersInputSchema().nullish())
  })
}

export function NavigationNavigationInputSchema(): z.ZodObject<Properties<NavigationNavigationInput>> {
  return z.object({
    name: z.string().nullish(),
    slug: z.string().nullish(),
    visible: z.boolean().nullish(),
    items: z.array(z.string().nullable()).nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function NavigationNavigationSchema(): z.ZodObject<Properties<NavigationNavigation>> {
  return z.object({
    __typename: z.literal('NavigationNavigation').optional(),
    documentId: z.string(),
    name: z.string(),
    slug: z.string(),
    visible: z.boolean().nullish(),
    items: z.array(NavigationNavigationItemSchema().nullable()),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish(),
    locale: z.string().nullish()
  })
}

export function NavigationNavigationItemsArgsSchema(): z.ZodObject<Properties<NavigationNavigationItemsArgs>> {
  return z.object({
    filters: z.lazy(() => NavigationNavigationItemFiltersInputSchema().nullish()),
    pagination: PaginationArgSchema().nullish(),
    sort: z.array(z.string().nullable()).nullish()
  })
}

export function NavigationNavigationItemFiltersInputSchema(): z.ZodObject<Properties<NavigationNavigationItemFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    title: z.lazy(() => StringFilterInputSchema().nullish()),
    type: z.lazy(() => StringFilterInputSchema().nullish()),
    path: z.lazy(() => StringFilterInputSchema().nullish()),
    externalPath: z.lazy(() => StringFilterInputSchema().nullish()),
    uiRouterKey: z.lazy(() => StringFilterInputSchema().nullish()),
    menuAttached: z.lazy(() => BooleanFilterInputSchema().nullish()),
    order: z.lazy(() => IntFilterInputSchema().nullish()),
    collapsed: z.lazy(() => BooleanFilterInputSchema().nullish()),
    autoSync: z.lazy(() => BooleanFilterInputSchema().nullish()),
    parent: z.lazy(() => NavigationNavigationItemFiltersInputSchema().nullish()),
    master: z.lazy(() => NavigationNavigationFiltersInputSchema().nullish()),
    audience: z.lazy(() => NavigationAudienceFiltersInputSchema().nullish()),
    additionalFields: z.lazy(() => JsonFilterInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => NavigationNavigationItemFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => NavigationNavigationItemFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => NavigationNavigationItemFiltersInputSchema().nullish())
  })
}

export function NavigationNavigationItemInputSchema(): z.ZodObject<Properties<NavigationNavigationItemInput>> {
  return z.object({
    title: z.string().nullish(),
    type: Enum_Navigationnavigationitem_TypeSchema.nullish(),
    path: z.string().nullish(),
    externalPath: z.string().nullish(),
    uiRouterKey: z.string().nullish(),
    menuAttached: z.boolean().nullish(),
    order: z.number().nullish(),
    collapsed: z.boolean().nullish(),
    autoSync: z.boolean().nullish(),
    parent: z.string().nullish(),
    master: z.string().nullish(),
    audience: z.array(z.string().nullable()).nullish(),
    additionalFields: z.any().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function NavigationNavigationItemSchema(): z.ZodObject<Properties<NavigationNavigationItem>> {
  return z.object({
    __typename: z.literal('NavigationNavigationItem').optional(),
    documentId: z.string(),
    title: z.string(),
    type: Enum_Navigationnavigationitem_TypeSchema.nullish(),
    path: z.string().nullish(),
    externalPath: z.string().nullish(),
    uiRouterKey: z.string().nullish(),
    menuAttached: z.boolean().nullish(),
    order: z.number().nullish(),
    collapsed: z.boolean().nullish(),
    autoSync: z.boolean().nullish(),
    master: NavigationNavigationSchema().nullish(),
    audience: z.array(NavigationAudienceSchema().nullable()),
    additionalFields: z.any().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function NavigationNavigationItemAudienceArgsSchema(): z.ZodObject<Properties<NavigationNavigationItemAudienceArgs>> {
  return z.object({
    filters: z.lazy(() => NavigationAudienceFiltersInputSchema().nullish()),
    pagination: PaginationArgSchema().nullish(),
    sort: z.array(z.string().nullable()).nullish()
  })
}

export function FooterInputSchema(): z.ZodObject<Properties<FooterInput>> {
  return z.object({
    privacyLink: z.lazy(() => ComponentSharedLinkInputSchema().nullish()),
    termsLink: z.lazy(() => ComponentSharedLinkInputSchema().nullish()),
    Socials: z.lazy(() => ComponentSharedSocialMediaInputSchema().nullish()),
    Copyright: z.lazy(() => ComponentSharedCopyrightInputSchema().nullish()),
    partnersGallery: z.lazy(() => ComponentSharedSliderInputSchema().nullish()),
    publishedAt: z.string().datetime().nullish()
  })
}

export function FooterSchema(): z.ZodObject<Properties<Footer>> {
  return z.object({
    __typename: z.literal('Footer').optional(),
    documentId: z.string(),
    privacyLink: ComponentSharedLinkSchema().nullish(),
    termsLink: ComponentSharedLinkSchema().nullish(),
    Socials: ComponentSharedSocialMediaSchema().nullish(),
    Copyright: ComponentSharedCopyrightSchema().nullish(),
    partnersGallery: ComponentSharedSliderSchema().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish(),
    locale: z.string().nullish()
  })
}

export function HomepageInputSchema(): z.ZodObject<Properties<HomepageInput>> {
  return z.object({
    legend: z.string().nullish(),
    Testimonials: z.array(z.lazy(() => ComponentSectionsTestimonialInputSchema().nullable())).nullish(),
    Teams: z.array(z.lazy(() => ComponentSectionsTeamInputSchema().nullable())).nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function HomepageSchema(): z.ZodObject<Properties<Homepage>> {
  return z.object({
    __typename: z.literal('Homepage').optional(),
    documentId: z.string(),
    legend: z.string().nullish(),
    Testimonials: z.array(ComponentSectionsTestimonialSchema().nullable()).nullish(),
    Teams: z.array(ComponentSectionsTeamSchema().nullable()).nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish(),
    locale: z.string().nullish()
  })
}

export function HomepageTestimonialsArgsSchema(): z.ZodObject<Properties<HomepageTestimonialsArgs>> {
  return z.object({
    filters: z.lazy(() => ComponentSectionsTestimonialFiltersInputSchema().nullish()),
    pagination: PaginationArgSchema().nullish(),
    sort: z.array(z.string().nullable()).nullish()
  })
}

export function HomepageTeamsArgsSchema(): z.ZodObject<Properties<HomepageTeamsArgs>> {
  return z.object({
    filters: z.lazy(() => ComponentSectionsTeamFiltersInputSchema().nullish()),
    pagination: PaginationArgSchema().nullish(),
    sort: z.array(z.string().nullable()).nullish()
  })
}

export function PostFiltersInputSchema(): z.ZodObject<Properties<PostFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    platform: z.lazy(() => StringFilterInputSchema().nullish()),
    media_kind: z.lazy(() => StringFilterInputSchema().nullish()),
    permalink: z.lazy(() => StringFilterInputSchema().nullish()),
    external_id: z.lazy(() => StringFilterInputSchema().nullish()),
    owner_handle: z.lazy(() => StringFilterInputSchema().nullish()),
    caption: z.lazy(() => StringFilterInputSchema().nullish()),
    like_count: z.lazy(() => IntFilterInputSchema().nullish()),
    comment_count: z.lazy(() => IntFilterInputSchema().nullish()),
    view_count: z.lazy(() => IntFilterInputSchema().nullish()),
    posted_at: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    thumbnail_url: z.lazy(() => StringFilterInputSchema().nullish()),
    is_featured: z.lazy(() => BooleanFilterInputSchema().nullish()),
    raw: z.lazy(() => JsonFilterInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => PostFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => PostFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => PostFiltersInputSchema().nullish())
  })
}

export function PostInputSchema(): z.ZodObject<Properties<PostInput>> {
  return z.object({
    platform: Enum_Post_PlatformSchema.nullish(),
    media_kind: Enum_Post_Media_KindSchema.nullish(),
    permalink: z.string().nullish(),
    external_id: z.string().nullish(),
    owner_handle: z.string().nullish(),
    caption: z.string().nullish(),
    like_count: z.number().nullish(),
    comment_count: z.number().nullish(),
    view_count: z.number().nullish(),
    posted_at: z.string().datetime().nullish(),
    source: z.string().nullish(),
    thumbnail_url: z.string().nullish(),
    is_featured: z.boolean().nullish(),
    raw: z.any().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function PostSchema(): z.ZodObject<Properties<Post>> {
  return z.object({
    __typename: z.literal('Post').optional(),
    documentId: z.string(),
    platform: Enum_Post_PlatformSchema,
    media_kind: Enum_Post_Media_KindSchema,
    permalink: z.string(),
    external_id: z.string().nullish(),
    owner_handle: z.string().nullish(),
    caption: z.string().nullish(),
    like_count: z.number().nullish(),
    comment_count: z.number().nullish(),
    view_count: z.number().nullish(),
    posted_at: z.string().datetime().nullish(),
    source: UploadFileSchema().nullish(),
    thumbnail_url: z.string().nullish(),
    is_featured: z.boolean().nullish(),
    raw: z.any().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function SocialPageFiltersInputSchema(): z.ZodObject<Properties<SocialPageFiltersInput>> {
  return z.object({
    documentId: z.lazy(() => IdFilterInputSchema().nullish()),
    provider: z.lazy(() => StringFilterInputSchema().nullish()),
    page_id: z.lazy(() => StringFilterInputSchema().nullish()),
    ig_business_id: z.lazy(() => StringFilterInputSchema().nullish()),
    page_name: z.lazy(() => StringFilterInputSchema().nullish()),
    slug: z.lazy(() => StringFilterInputSchema().nullish()),
    user_access_token: z.lazy(() => StringFilterInputSchema().nullish()),
    page_access_token: z.lazy(() => StringFilterInputSchema().nullish()),
    expires_at: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    admin_id: z.lazy(() => IntFilterInputSchema().nullish()),
    state: z.lazy(() => StringFilterInputSchema().nullish()),
    scopes: z.lazy(() => StringFilterInputSchema().nullish()),
    createdAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    updatedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    publishedAt: z.lazy(() => DateTimeFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => SocialPageFiltersInputSchema().nullable())).nullish(),
    or: z.array(z.lazy(() => SocialPageFiltersInputSchema().nullable())).nullish(),
    not: z.lazy(() => SocialPageFiltersInputSchema().nullish())
  })
}

export function SocialPageInputSchema(): z.ZodObject<Properties<SocialPageInput>> {
  return z.object({
    provider: Enum_Socialpage_ProviderSchema.nullish(),
    page_id: z.string().nullish(),
    ig_business_id: z.string().nullish(),
    page_name: z.string().nullish(),
    slug: z.string().nullish(),
    user_access_token: z.string().nullish(),
    page_access_token: z.string().nullish(),
    expires_at: z.string().datetime().nullish(),
    admin_id: z.number().nullish(),
    state: z.string().nullish(),
    scopes: z.string().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function SocialPageSchema(): z.ZodObject<Properties<SocialPage>> {
  return z.object({
    __typename: z.literal('SocialPage').optional(),
    documentId: z.string(),
    provider: Enum_Socialpage_ProviderSchema.nullish(),
    page_id: z.string().nullish(),
    ig_business_id: z.string().nullish(),
    page_name: z.string().nullish(),
    slug: z.string().nullish(),
    user_access_token: z.string(),
    page_access_token: z.string().nullish(),
    expires_at: z.string().datetime(),
    admin_id: z.number(),
    state: z.string().nullish(),
    scopes: z.string().nullish(),
    createdAt: z.string().datetime().nullish(),
    updatedAt: z.string().datetime().nullish(),
    publishedAt: z.string().datetime().nullish()
  })
}

export function FileInfoInputSchema(): z.ZodObject<Properties<FileInfoInput>> {
  return z.object({
    name: z.string().nullish(),
    alternativeText: z.string().nullish(),
    caption: z.string().nullish()
  })
}

export function UsersPermissionsMeSchema(): z.ZodObject<Properties<UsersPermissionsMe>> {
  return z.object({
    __typename: z.literal('UsersPermissionsMe').optional(),
    id: z.string(),
    documentId: z.string(),
    username: z.string(),
    email: z.string().nullish(),
    confirmed: z.boolean().nullish(),
    blocked: z.boolean().nullish(),
    role: UsersPermissionsMeRoleSchema().nullish()
  })
}

export function UsersPermissionsMeRoleSchema(): z.ZodObject<Properties<UsersPermissionsMeRole>> {
  return z.object({
    __typename: z.literal('UsersPermissionsMeRole').optional(),
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    type: z.string().nullish()
  })
}

export function UsersPermissionsRegisterInputSchema(): z.ZodObject<Properties<UsersPermissionsRegisterInput>> {
  return z.object({
    username: z.string(),
    email: z.string(),
    password: z.string()
  })
}

export function UsersPermissionsLoginInputSchema(): z.ZodObject<Properties<UsersPermissionsLoginInput>> {
  return z.object({
    identifier: z.string(),
    password: z.string(),
    provider: z.string().default("local")
  })
}

export function UsersPermissionsPasswordPayloadSchema(): z.ZodObject<Properties<UsersPermissionsPasswordPayload>> {
  return z.object({
    __typename: z.literal('UsersPermissionsPasswordPayload').optional(),
    ok: z.boolean()
  })
}

export function UsersPermissionsLoginPayloadSchema(): z.ZodObject<Properties<UsersPermissionsLoginPayload>> {
  return z.object({
    __typename: z.literal('UsersPermissionsLoginPayload').optional(),
    jwt: z.string().nullish(),
    user: UsersPermissionsMeSchema()
  })
}

export function UsersPermissionsCreateRolePayloadSchema(): z.ZodObject<Properties<UsersPermissionsCreateRolePayload>> {
  return z.object({
    __typename: z.literal('UsersPermissionsCreateRolePayload').optional(),
    ok: z.boolean()
  })
}

export function UsersPermissionsUpdateRolePayloadSchema(): z.ZodObject<Properties<UsersPermissionsUpdateRolePayload>> {
  return z.object({
    __typename: z.literal('UsersPermissionsUpdateRolePayload').optional(),
    ok: z.boolean()
  })
}

export function UsersPermissionsDeleteRolePayloadSchema(): z.ZodObject<Properties<UsersPermissionsDeleteRolePayload>> {
  return z.object({
    __typename: z.literal('UsersPermissionsDeleteRolePayload').optional(),
    ok: z.boolean()
  })
}

export function PaginationArgSchema(): z.ZodObject<Properties<PaginationArg>> {
  return z.object({
    page: z.number().nullish(),
    pageSize: z.number().nullish(),
    start: z.number().nullish(),
    limit: z.number().nullish()
  })
}
