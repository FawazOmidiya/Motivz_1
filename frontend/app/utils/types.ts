// types.ts
import { RecurringConfig } from "../../../shared-types/recurring-events";

export type Club = {
  id: string;
  Name: string;
  Image: string;
  latitude: number;
  longitude: number;
  Rating: number;
  Tags?: string[];
  Address: string;
  hours?: RegularOpeningHours;
  music_schedule?: musicGenres;
  live_rating?: number;
  instagram_handle?: string | null;
};

export type UserProfile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  active_club_id?: string | null;
  active_club_closed?: string | null; // ISO datetime string when the club closes
  push_token?: string | null; // Expo push token for notifications
  bio?: string | null;
  favorite_music?: string[] | null;
  crowd_preferences?: string[] | null;
  nightlife_goals?: string[] | null;
  dress_code?: string[] | null;
  budget?: string | null;
  drinking_preference?: string | null;
  smoking_preference?: string | null;
  saved_events?: Record<string, string>[] | null;
  active_event_id?: string | null;
  last_active?: string | null; // ISO datetime string of when user last opened the app
  friends_count?: number; // Number of friends
  clubs_count?: number; // Number of favourite clubs
  events_count?: number; // Number of saved events
  date_of_birth?: Date | null; // Date object
  age?: number | null; // Calculated age from date_of_birth
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
  SignIn: undefined;
  SignUp: undefined;
  ProfileCompletion: {
    signUpInfo: {
      username: string;
      email: string;
      password: string;
    };
    googleUserData?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    googleTokens?: {
      idToken: string;
      accessToken: string;
    };
    appleUserData?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  ClubDetail: { club: Club };
  EventDetail: { eventId: string; event?: Event; club?: Club };
  ProfileSettings: undefined;
  UserProfile: { profile: UserProfile };
  FriendsList: { userId: string };
};

export type GlobalStackParamList = {
  ClubDetail: { club: Club };
  ProfileSettings: undefined;
  UserProfile: { user: UserProfile };
};

export type FriendStatus = "none" | "pending" | "friends";

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
  like_ids: string[];
  genres: string[];
}

export interface musicGenres {
  id: string;
  club_id: string;
  day_of_week: number;
  genres: string[];
  start_time: string;
  end_time: string;
  Rap?: number;
  HipHop?: number;
  Rock?: number;
  Pop?: number;
  Jazz?: number;
  EDM?: number;
  Country?: number;
  Reggae?: number;
  Blues?: number;
  RnB?: number;
  Soul?: number;
  Latin?: number;
  Afrobeats?: number;
  DanceHall?: number;
}

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

export interface Hours {
  [key: string]: {
    open: string;
    close: string;
  };
}

export interface Post {
  id: string;
  user_id: string;
  club_id: string | null;
  media_type: "photo" | "video";
  media_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number | 0;
  comments_count: number | 0;
  is_deleted: boolean | null;
  user?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  club?: {
    id: string;
    Name: string;
    Image: string;
  };
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface Event {
  id: string;
  club_id: string;
  title: string;
  caption?: string;
  poster_url?: string;
  ticket_link?: string;
  guestlist_available?: boolean;
  start_date: string;
  end_date: string;
  music_genres?: string[];
  attendees?: string[]; // Array of user IDs attending the event
  save_count?: number; // Number of times this event has been saved
  trending?: boolean; // Marks events as trending to prioritize them in user feeds
  created_at: string;
  updated_at: string;
  recurring_config?: RecurringConfig;
  // Trending properties
  is_trending?: boolean;
  has_friends_attending?: boolean;
  friends_attending_count?: number;
}
