export interface Club {
  id: string; // This is the primary key from Supabase
  Name: string;
  Address: string;
  Description?: string;
  Rating: number;
  Hours?: {
    periods: Array<{
      open: {
        day: number;
        hour: number;
        minute: number;
      };
      close: {
        day: number;
        hour: number;
        minute: number;
      };
    }>;
  };
  // Additional fields that might exist in your database
  latitude?: number;
  longitude?: number;
  Image?: string;
  website?: string;
  google_id?: string;
}

export interface Review {
  club_id: string; // This should match the club's id field
  rating: number;
  genres: string[];
  review_text?: string;
  crowd_level: "empty" | "quiet" | "moderate" | "busy" | "packed";
  user_id?: string; // Can be null for anonymous reviews
}

export interface CrowdLevel {
  value: "empty" | "quiet" | "moderate" | "busy" | "packed";
  label: string;
  icon: string;
  description: string;
}
