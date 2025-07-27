// types.ts

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
  EventDetail: { event: Event };
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
  };
  ClubDetail: { club: Club };
  EventDetail: { event: Event };
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
  start_date: string;
  end_date: string;
  music_genres?: string[];
  created_by: string;
  created_at: string;
  inserted_at: string;
  updated_at: string;
}
