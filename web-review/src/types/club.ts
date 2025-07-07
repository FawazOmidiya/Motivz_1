export interface Club {
  id: string;
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
}

export interface Review {
  club_id: string;
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
