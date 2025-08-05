// Backend Service for Railway API
// Handles API calls to the Django backend

import { Club } from "./Club";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  "https://motivz1-production.up.railway.app";

/**
 * Fetches all clubs from the Railway backend
 */
export const fetchClubsFromBackend = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/clubs/json/`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const clubs = await response.json();
    return clubs || [];
  } catch (error) {
    console.error("Error fetching clubs from backend:", error);
    return [];
  }
};

/**
 * Fetches a single club by ID from the Railway backend
 */
export const fetchSingleClubFromBackend = async (
  clubId: string
): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_URL}/clubs/${clubId}/`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Club not found");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.club;
  } catch (error) {
    console.error("Error fetching club from backend:", error);
    throw error;
  }
};

/**
 * Fetches trending status for a single club
 */
export const fetchClubTrendingStatus = async (
  clubId: string
): Promise<{
  is_trending: boolean;
  trending_score: number;
  recent_reviews_count: number;
  avg_rating: number;
}> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/clubs/${clubId}/trending-status/`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          is_trending: false,
          trending_score: 0,
          recent_reviews_count: 0,
          avg_rating: 0,
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching club trending status:", error);
    return {
      is_trending: false,
      trending_score: 0,
      recent_reviews_count: 0,
      avg_rating: 0,
    };
  }
};

/**
 * Searches clubs by name using the Railway backend
 * Note: This will need to be implemented on the backend if not already available
 */
export const searchClubsByNameFromBackend = async (
  clubName: string
): Promise<any[]> => {
  try {
    // For now, we'll fetch all clubs and filter client-side
    // TODO: Implement server-side search endpoint
    const allClubs = await fetchClubsFromBackend();
    const filteredClubs = allClubs.filter((club: any) =>
      club.Name.toLowerCase().includes(clubName.toLowerCase())
    );
    return filteredClubs;
  } catch (error) {
    console.error("Error searching clubs from backend:", error);
    return [];
  }
};

export const fetchFilteredClubs = async (params: {
  filter_open?: boolean;
  selected_genres?: string[];
  min_rating?: number;
}): Promise<any[]> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.filter_open) {
      queryParams.append("filter_open", "true");
    }
    if (params.selected_genres && params.selected_genres.length > 0) {
      queryParams.append("selected_genres", params.selected_genres.join(","));
    }
    if (params.min_rating && params.min_rating > 0) {
      queryParams.append("min_rating", params.min_rating.toString());
    }

    const response = await fetch(
      `${BACKEND_URL}/clubs/filtered/?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.clubs || [];
  } catch (error) {
    console.error("Error fetching filtered clubs:", error);
    return [];
  }
};

export const searchClubs = async (
  query: string,
  limit: number = 20
): Promise<any[]> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/clubs/search/?q=${encodeURIComponent(
        query
      )}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.clubs || [];
  } catch (error) {
    console.error("Error searching clubs:", error);
    return [];
  }
};

export const fetchFriendsAttending = async (
  clubId: string,
  userId: string
): Promise<{ id: string; avatar_url: string | null }[]> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/clubs/${clubId}/friends-attending/?user_id=${encodeURIComponent(
        userId
      )}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.friends || [];
  } catch (error) {
    console.error("Error fetching friends attending:", error);
    return [];
  }
};

export const fetchClubMusicSchedule = async (
  clubId: string,
  dayNumber: number
): Promise<any> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/clubs/${clubId}/music-schedule/?day=${dayNumber}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.music_schedule;
  } catch (error) {
    console.error("Error fetching club music schedule:", error);
    return null;
  }
};

export const fetchClubReviews = async (
  clubId: string,
  reviewType: "app" | "google" = "app"
): Promise<any[]> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/clubs/${clubId}/reviews/?type=${reviewType}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.reviews || [];
  } catch (error) {
    console.error("Error fetching club reviews:", error);
    return [];
  }
};

export const addClubReview = async (
  clubId: string,
  userId: string,
  rating: number,
  musicGenre: string,
  reviewText: string = ""
): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_URL}/clubs/${clubId}/add-review/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        rating: rating,
        music_genre: musicGenre,
        review_text: reviewText,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.review;
  } catch (error) {
    console.error("Error adding club review:", error);
    throw error;
  }
};
