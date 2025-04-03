// types.ts

export type Club = {
  id: string;
  Name: string;
  Image: string;
  latitude: number;
  longitude: number;
  Rating: number;
  Tags: string[];
  Address: string;
};

export type UserProfile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  // add any additional fields you need
};

// Define the bottom tab param list:
export type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
  Map: undefined;
  Global: undefined;
  ClubDetail: { club: Club };
  ProfileSettings: undefined;
  UserProfile: { user: UserProfile };
};

// Define type-safe navigation routes for the root stack:
export type RootStackParamList = {
  Main: undefined;
  ClubDetail: { club: Club };
  ProfileSettings: undefined;
  UserProfile: { profile: UserProfile };
};

export type GlobalStackParamList = {
  ClubDetail: { club: Club };
  ProfileSettings: undefined;
  UserProfile: { user: UserProfile };
};
