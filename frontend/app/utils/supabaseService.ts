import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseAuth } from "./supabaseAuth";
import type { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as types from "./types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY as string;

// ✅ Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
// Storage for image handling
export const storage = supabase.storage.from("avatars");
/**
 * Fetches all clubs from the Supabase database.
 */
export const fetchClubs = async () => {
  try {
    const { data, error } = await supabase.from("Clubs").select("*");

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return [];
  }
};

// Clubs
export const fetchSingleClub = async (clubId: string): Promise<types.Club> => {
  try {
    const { data, error } = await supabase
      .from("Clubs")
      .select("*")
      .eq("id", clubId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Club not found");
    }

    return data as types.Club;
  } catch (error) {
    console.error("Error fetching club:", error);
    throw error;
  }
};

export const searchClubsByName = async (ClubName: string) => {
  /**
   * Searches for clubs in the "clubs" table with a Name similar to the provided input.
   *
   * @param {string} searchTerm - The term to search for.
   * @returns {Promise<Array>} Array of clubs matching the search criteria, or an empty array on error.
   */
  try {
    const { data, error } = await supabase
      .from("Clubs")
      .select("*")
      .ilike("Name", `%${ClubName}%`);

    if (error) {
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error("Error searching clubs:", error);
    return [];
  }
};

export async function fetchEventsByClub(clubId: string) {
  const { data, error } = await supabase
    .from("Events")
    .select("*")
    .eq("club_id", clubId);

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  return data;
}

/**
 * Fetches all favourite clubs for a given profile.
 * Returns an array of objects with a `club` property containing the club details.
 *
 * @param {string} profileId - The ID of the profile.
 * @returns {Promise<Array>} Array of favourite clubs, or an empty array on error.
 */
export const fetchUserFavourites = async (profileId: string) => {
  try {
    const { data, error } = await supabase
      .from("profile_favourites")
      .select(`club:Clubs(*)`)
      .eq("profile_id", profileId);

    if (error) {
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error("Error fetching user favourites:", error);
    return [];
  }
};

/**
 * Checks if a club is favourited for a given profile.
 * Returns a boolean indicating whether the club-user pair exists.
 *
 * @param {string} profileId - The ID of the profile.
 * @param {string} clubId - The ID of the club being queried.
 * @returns {Promise<boolean>} Whether a favourite exists.
 */
export const queryUserFavouriteExists = async (
  profileId: string,
  clubId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAuth
      .from("profile_favourites")
      .select("*")
      .eq("profile_id", profileId)
      .eq("club_id", clubId);

    if (error) {
      throw new Error(error.message);
    }
    // If data array exists and has one or more records, return true.
    return data?.length > 0;
  } catch (error) {
    console.error("Error fetching user favourites:", error);
    return false;
  }
};

export async function addClubToFavourites(
  /**
   * Adds a club to the user's favourites if the user-club pair doesn't already exist.
   *
   * @param session - The current Supabase session.
   * @param club - The club object to add to favourites.
   * @returns A promise that resolves to true if the club was added,
   *          or false if the favourite already exists.
   * @throws An error if the user is not signed in or if the insert fails.
   */

  session: Session | null,
  club: types.Club
): Promise<boolean> {
  if (!session?.user) {
    throw new Error("Not signed in. Please sign in to add favourites.");
  }

  // Check if the user-club pair already exists

  const { data: existing, error: checkError } = await supabaseAuth
    .from("profile_favourites")
    .select("*")
    .eq("profile_id", session.user.id)
    .eq("club_id", club.id)
    .maybeSingle();

  if (checkError) {
    throw new Error(checkError.message);
  }

  if (existing) {
    // The favourite already exists; return false to indicate no new insert.
    return false;
  }

  // Insert the new favourite
  const { error } = await supabaseAuth.from("profile_favourites").insert({
    profile_id: session.user.id,
    club_id: club.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function removeClubFromFavourites(
  /**
   * Removes a club from the user's favourites.
   *
   * @param session - The current Supabase session.
   * @param club - The club object to remove from favourites.
   * @returns A promise that resolves to true if the club was removed.
   * @throws An error if the user is not signed in or if the deletion fails.
   */

  session: Session | null,
  club: types.Club
): Promise<boolean> {
  if (!session?.user) {
    throw new Error("Not signed in. Please sign in to remove favourites.");
  }

  const { error } = await supabaseAuth
    .from("profile_favourites")
    .delete()
    .eq("profile_id", session.user.id)
    .eq("club_id", club.id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export const searchUsersByName = async (
  searchTerm: string
): Promise<types.UserProfile[]> => {
  /**
   * Searches for users in the "profiles" table by username, first_name, or last_name.
   *
   * @param searchTerm - The term to search for.
   * @returns An array of user profiles matching the search criteria.
   */
  try {
    // Build an "or" clause: Supabase expects a comma-separated list.
    const query = `username.ilike.%${searchTerm}%, first_name.ilike.%${searchTerm}%, last_name.ilike.%${searchTerm}%`;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(query);
    if (error) {
      throw new Error(error.message);
    }
    console.log("Fetched users:", data);
    return data || [];
  } catch (err) {
    console.error("Error searching users:", err);
    return [];
  }
};

export const fetchUserProfile = async (userId: string): Promise<any> => {
  /**
   * Fetches the profile for the given user ID.
   *
   * @param userId - The ID of the user whose profile to fetch.
   * @returns A promise that resolves to the user's profile data.
   * @throws An error if the query fails.
   */

  const { data, error, status } = await supabaseAuth
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && status !== 406) {
    throw new Error(error.message);
  }

  return data;
};

// Friend Functions

// 1. Send Friend Request
export async function sendFriendRequest(
  currentUserId: string,
  targetUserId: string
) {
  const { data, error } = await supabase.from("friendships").insert([
    {
      requester_id: currentUserId,
      receiver_id: targetUserId,
      status: "friends",
    },
  ]);
  return { data, error };
}

// 2. Cancel Friend Request (or decline a received request)
// This deletes the friendship record regardless of direction.
export async function cancelFriendRequest(
  currentUserId: string,
  targetUserId: string
) {
  const { data, error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `(requester_id.eq.${currentUserId} and receiver_id.eq.${targetUserId}),(requester_id.eq.${targetUserId} and receiver_id.eq.${currentUserId})`
    );
  return { data, error };
}

// 3. Accept Friend Request
// This assumes the current user is the receiver of the friend request.
export async function acceptFriendRequest(
  currentUserId: string,
  targetUserId: string
) {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "friends" })
    .match({ requester_id: targetUserId, receiver_id: currentUserId });
  return { data, error };
}

// 4. Unfriend (delete the friendship)
export async function unfriend(currentUserId: string, targetUserId: string) {
  // Try to delete the friendship where currentUserId is the requester
  let { data, error } = await supabase
    .from("friendships")
    .delete()
    .match({ requester_id: currentUserId, receiver_id: targetUserId });

  // If no row was affected, try the reverse direction.
  if (!data && !error) {
    const res = await supabase
      .from("friendships")
      .delete()
      .match({ requester_id: targetUserId, receiver_id: currentUserId });
    data = res.data;
    error = res.error;
  }
  return { data, error };
}

// supabaseService.ts

export async function fetchFriendshipStatus(
  currentUserId: string,
  targetUserId: string
): Promise<types.FriendStatus> {
  // Query 1: Check if currentUser sent a friend request to targetUser
  const { data: sentData, error: sentError } = await supabase
    .from("friendships")
    .select("*")
    .eq("requester_id", currentUserId)
    .eq("receiver_id", targetUserId);
  if (sentError) throw sentError;

  // Query 2: Check if currentUser received a friend request from targetUser
  const { data: receivedData, error: receivedError } = await supabase
    .from("friendships")
    .select("*")
    .eq("requester_id", targetUserId)
    .eq("receiver_id", currentUserId);
  if (receivedError) throw receivedError;

  // Combine the results from both queries
  const combined = [...(sentData || []), ...(receivedData || [])];

  // Assuming there is only one friendship row for a pair of users
  const friendship = combined[0];

  if (friendship.status === "friends") return "friends";
  if (friendship.status === "pending") {
    // If the current user is the one who sent the request, status is pending_sent.
    if (friendship.requester_id === currentUserId) {
      return "pending_sent";
    } else {
      return "pending_received";
    }
  }
  return "none";
}

/**
 * Dynamically calculates whether the club is open based on its operating periods.
 * It converts the open and close times into "absolute minutes" relative to the start of the week.
 */
export function isClubOpenDynamic(hours: types.RegularOpeningHours): boolean {
  if (!hours.periods || hours.periods.length === 0) return false;

  const now = new Date();
  const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Convert a period's time into absolute minutes.
  const convertToAbsolute = (day: number, hour: number, minute: number) =>
    day * 1440 + hour * 60 + minute;

  // Check each period to see if current time falls within.
  for (let period of hours.periods) {
    let openAbs = convertToAbsolute(
      period.open.day,
      period.open.hour,
      period.open.minute
    );
    let closeAbs = convertToAbsolute(
      period.close.day,
      period.close.hour,
      period.close.minute
    );

    // If period spans midnight (or wraps to the next week), adjust closeAbs.
    if (closeAbs <= openAbs) {
      closeAbs += 7 * 1440;
    }

    // Convert current time to absolute minutes.
    let currentAbs = convertToAbsolute(
      currentDay,
      now.getHours(),
      now.getMinutes()
    );
    // If current time is before openAbs and the period spans midnight, add one week.
    if (currentAbs < openAbs) {
      currentAbs += 7 * 1440;
    }

    if (currentAbs >= openAbs && currentAbs < closeAbs) {
      return true;
    }
  }

  return false;
}
/**
 * Returns the operating hours string for today.
 * Assumes weekdayDescriptions is an array of 7 strings ordered as:
 * [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday].
 * JavaScript's getDay() returns 0 for Sunday, 1 for Monday, etc.
 */
export function getTodaysHours(hours: types.RegularOpeningHours): string {
  if (hours.weekdayDescriptions && hours.weekdayDescriptions.length === 7) {
    const currentDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const index = currentDay === 0 ? 6 : currentDay - 1; // Map Sunday (0) to index 6
    return hours.weekdayDescriptions[index];
  }
  return "";
}

export async function fetchClubGoogleReviews(
  clubId: string
): Promise<types.GoogleReview[]> {
  const { data, error } = await supabase
    .from("google_reviews")
    .select("*")
    .eq("club_id", clubId)
    .order("publish_time", { ascending: false });

  if (error) {
    console.error("Error fetching Google reviews:", error);
    return [];
  }
  return data || [];
}
export async function fetchClubAppReviews(
  clubId: string
): Promise<types.AppReview[]> {
  const { data, error } = await supabase
    .from("club_reviews")
    .select(
      `
      *,
      user_id:profiles (
        username
      )
    `
    )
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
/**
 * Inserts a new app review for a club.
 */
export async function addAppReview(
  clubId: string,
  userId: string,
  rating: number,
  musicGenre: string,
  text: string
) {
  const { data, error } = await supabase.from("club_reviews").insert([
    {
      club_id: clubId,
      user_id: userId,
      rating,
      text,
    },
  ]);
  return { data, error };
}
export async function addAppReviewSimple(
  clubId: string,
  userId: string,
  rating: number,
  musicGenre: string
) {
  const { data, error } = await supabase
    .from("app_reviews")
    .insert([
      {
        club_id: clubId,
        user_id: userId,
        rating,
        music_genre: musicGenre,
        text: null, // no comment
      },
    ])
    .select();
  return { data, error };
}

/**
 * Updates the user profile in the "profiles" table.
 * @param userId - The ID of the user.
 * @param updates - The fields to update.
 * @returns The updated data and any error that occurred.
 */
export async function updateUserProfile(
  userId: string,
  updates: { avatar_url?: string; username?: string; website?: string }
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  return { data, error };
}

// Live Music

export async function fetchClubMusicSchedules(
  clubId: string,
  dayNumber: number
): Promise<types.musicGenres | null> {
  const { data, error } = await supabase
    .from("ClubMusicSchedules")
    .select("*") // etc.
    .eq("club_id", clubId)
    .eq("day_of_week", dayNumber)
    .single();

  if (error) {
    console.error("Error fetching music counts:", error);
    return null;
  }

  return data;
}

type FriendshipResponse = {
  receiver: types.UserProfile;
  requester: types.UserProfile;
};

export async function fetchUserFriends(
  userId: string
): Promise<types.UserProfile[]> {
  try {
    // Fetch friends where user is the requester
    const { data: requesterData, error: requesterError } = await supabase
      .from("friendships")
      .select(
        `
        receiver:profiles!receiver_id (
          id,
          username,
          avatar_url,
          first_name,
          last_name
        )
      `
      )
      .eq("requester_id", userId)
      .eq("status", "friends");

    if (requesterError) {
      throw new Error(requesterError.message);
    }

    // Fetch friends where user is the receiver
    const { data: receiverData, error: receiverError } = await supabase
      .from("friendships")
      .select(
        `
        requester:profiles!requester_id (
          id,
          username,
          avatar_url,
          first_name,
          last_name, 
          active_club_id,
          active_club:Clubs!active_club_id (
            id,
            Name,
            Image
          ) 
        )
      `
      )
      .eq("receiver_id", userId)
      .eq("status", "friends");

    if (receiverError) {
      throw new Error(receiverError.message);
    }

    // Combine and map the friends data
    const allFriends: types.UserProfile[] = [
      ...(requesterData as unknown as FriendshipResponse[]).map(
        (item) => item.receiver
      ),
      ...(receiverData as unknown as FriendshipResponse[]).map(
        (item) => item.requester
      ),
    ];

    return allFriends;
  } catch (error) {
    console.error("Error fetching user friends:", error);
    return [];
  }
}
export async function updateUserActiveClub(
  userId: string,
  clubId: string | null
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ active_club_id: clubId })
    .eq("id", userId);

  if (!error) {
    // Broadcast the profile update
    await supabase.channel("profile_changes").send({
      type: "broadcast",
      event: "profile_update",
      payload: { new: data?.[0] },
    });
  }

  return { data, error };
}

export async function fetchFriendsActiveClubs(userId: string) {
  try {
    // First get all friends
    const friends = await fetchUserFriends(userId);

    // Then get their profiles with active club information
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        username,
        avatar_url,
        first_name,
        last_name,
        active_club_id,
        active_club:Clubs!active_club_id (
          id,
          Name,
          Image
        )
      `
      )
      .in(
        "id",
        friends.map((friend) => friend.id)
      );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching friends active clubs:", error);
    return [];
  }
}
