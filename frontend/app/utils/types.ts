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
  hours: RegularOpeningHours;
};

export type UserProfile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
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

export type FriendStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "friends";

export interface RegularOpeningHours {
  openNow?: boolean; // Provided flag (we won't rely on it for dynamic computation)
  periods?: {
    open: { day: number; hour: number; minute: number };
    close: { day: number; hour: number; minute: number };
  }[];
  weekdayDescriptions?: string[];
  nextCloseTime?: string;
}
export interface GoogleReview {
  review_id: string;
  club_id: string;
  rating: number;
  text: string;
  relative_publish_time_description: string;
  author_display_name: string | null;
  author_photo_uri: string | null;
  publish_time: string; // ISO timestamp
  google_maps_uri: string | null;
}
export interface AppReview {
  id: string;
  club_id: string;
  user_id: string;
  rating: number;
  text: string;
  created_at: string;
}
