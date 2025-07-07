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
 * Fetches clubs from the Supabase database with pagination.
 * @param page The page number to fetch (1-based)
 * @param pageSize The number of items per page (default: 10)
 */
export const fetchClubs = async () => {
  try {
    const { data, error } = await supabase
      .from("Clubs")
      .select("*")
      .order("Name");

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
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
      status: "pending",
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
  // Try to delete a request sent by the current user (unsend)
  let { data, error } = await supabase.from("friendships").delete().match({
    requester_id: currentUserId,
    receiver_id: targetUserId,
    status: "pending",
  });

  // If nothing was deleted, try to delete a request received by the current user (decline)
  const nothingDeleted =
    !data || (Array.isArray(data) && (data as any[]).length === 0);
  if (nothingDeleted && !error) {
    const res = await supabase.from("friendships").delete().match({
      requester_id: targetUserId,
      receiver_id: currentUserId,
      status: "pending",
    });
    data = res.data;
    error = res.error;
  }

  return { data, error };
}

// 3. Accept Friend Request
// This assumes the current user is the receiver of the friend request.
export async function acceptFriendRequest(
  currentUserId: string,
  targetUserId: string
) {
  // First, let's check if the friendship record exists
  const { data: existingRecord, error: checkError } = await supabase
    .from("friendships")
    .select("*")
    .match({ requester_id: targetUserId, receiver_id: currentUserId });

  if (checkError) {
    console.error("Error checking existing record:", checkError);
    return { data: null, error: checkError };
  }

  if (!existingRecord || existingRecord.length === 0) {
    console.error("No friendship record found to update");
    return { data: null, error: new Error("No friendship record found") };
  }

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

  if (!friendship) return "none";

  if (friendship.status === "friends") return "friends";
  if (friendship.status === "pending") return "pending";

  return "none";
}

/**
 * Dynamically calculates whether the club is open based on its operating periods.
 * It converts the open and close times into "absolute minutes" relative to the start of the week.
 */
// TODO: This is a temporary function to check if the club is open.
// We should use the new isClubOpen function instead.
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
// TODO: This is a temporary function to get the operating hours for today.
export function getTodaysHours(hours: types.RegularOpeningHours, date: Date) {
  const currentDay = date.getDay();
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  // Helper function to convert day and time to minutes
  const toMinutes = (day: number, hour: number, minute: number) =>
    ((day + 7) % 7) * 24 * 60 + hour * 60 + minute;

  // Find the period that matches the given date
  for (const period of hours.periods || []) {
    let openMinutes = toMinutes(
      period.open.day,
      period.open.hour,
      period.open.minute
    );
    let closeMinutes = toMinutes(
      period.close.day,
      period.close.hour,
      period.close.minute
    );
    let currentTotalMinutes = toMinutes(
      currentDay,
      date.getHours(),
      date.getMinutes()
    );

    if (currentTotalMinutes < openMinutes && currentDay === period.open.day) {
      const weekdayIndex = (period.open.day + 6) % 7;
      const weekdayDescription =
        hours.weekdayDescriptions?.[weekdayIndex] || "";
      return [period, weekdayDescription];
    }
    if (
      openMinutes <= currentTotalMinutes &&
      currentTotalMinutes <= closeMinutes
    ) {
      // Find the corresponding weekday description
      const weekdayIndex = (period.open.day + 6) % 7;
      const weekdayDescription =
        hours.weekdayDescriptions?.[weekdayIndex] || "";
      return [period, weekdayDescription];
    }
    if (closeMinutes < openMinutes && openMinutes < currentTotalMinutes) {
      const weekdayIndex = (period.open.day + 6) % 7;
      const weekdayDescription =
        hours.weekdayDescriptions?.[weekdayIndex] || "";
      return [period, weekdayDescription];
    }
  }

  // If no matching period is found
  return [null, "Closed"];
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
      like_ids: [],
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
    .from("club_reviews")
    .insert([
      {
        club_id: clubId,
        user_id: userId,
        rating,
        music_genre: musicGenre,
        text: null, // no comment
        like_ids: [],
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
          last_name,
          active_club_id,
          active_club_closed,
          active_club:Clubs!active_club_id (
            id,
            Name,
            Image
          )
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
          active_club_closed,
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

/**
 * Fetch pending friend requests for a user
 */
export async function fetchPendingFriendRequests(
  userId: string
): Promise<types.UserProfile[]> {
  try {
    const { data, error } = await supabase
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
          active_club_closed,
          active_club:Clubs!active_club_id (
            id,
            Name,
            Image
          )
        )
      `
      )
      .eq("receiver_id", userId)
      .eq("status", "pending");

    if (error) {
      throw new Error(error.message);
    }

    if (!data) return [];

    // Extract the requester profiles
    const requesters: types.UserProfile[] = data.map(
      (friendship: any) => friendship.requester
    );

    return requesters;
  } catch (error) {
    console.error("Error fetching pending friend requests:", error);
    return [];
  }
}

/**
 * Calculates the next closing time for a club based on its operating hours
 */
function calculateClubClosingTime(
  clubHours: types.RegularOpeningHours
): string | null {
  console.log(
    "calculateClubClosingTime - clubHours:",
    JSON.stringify(clubHours, null, 2)
  );

  if (!clubHours?.periods || clubHours.periods.length === 0) {
    console.log("No periods found in club hours");
    return null;
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

  console.log(
    "Current day:",
    currentDay,
    "Current time (minutes):",
    currentTime
  );
  console.log("Current date:", now.toISOString());
  console.log(
    "User timezone:",
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  let nextClosingTime: Date | null = null;
  let minDaysUntilClose = Infinity;

  // Check each period to find the next closing time
  for (let period of clubHours.periods) {
    console.log("Checking period:", period);

    if (!period.open || !period.close) {
      console.log("Skipping period - missing open or close data");
      continue;
    }

    // Calculate days until this period's closing time
    let daysUntilClose = 0;

    if (period.close.day === currentDay) {
      // Close on the same day
      const closeTime = period.close.hour * 60 + period.close.minute;
      if (currentTime < closeTime) {
        // Club closes later today
        daysUntilClose = 0;
      } else {
        // Club already closed today, skip this period
        continue;
      }
    } else if (period.close.day > currentDay) {
      // Close on a future day this week
      daysUntilClose = period.close.day - currentDay;
    } else {
      // Close on a day next week (period spans midnight)
      daysUntilClose = 7 - currentDay + period.close.day;
    }

    console.log(
      "Period analysis:",
      "close day:",
      period.close.day,
      "close time:",
      period.close.hour + ":" + period.close.minute,
      "daysUntilClose:",
      daysUntilClose
    );

    // If this is the earliest closing time we've found, update our result
    if (daysUntilClose < minDaysUntilClose) {
      minDaysUntilClose = daysUntilClose;

      // Calculate the target date in user's local timezone
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysUntilClose);

      // Create the closing time in user's local timezone
      const closeDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        period.close.hour,
        period.close.minute,
        0,
        0
      );

      nextClosingTime = closeDate;

      console.log("Target date:", targetDate.toDateString());
      console.log("Closing time (local):", closeDate.toString());
    }
  }

  if (nextClosingTime) {
    // Create a proper timestamptz string in the user's local timezone
    const year = nextClosingTime.getFullYear();
    const month = String(nextClosingTime.getMonth() + 1).padStart(2, "0");
    const day = String(nextClosingTime.getDate()).padStart(2, "0");
    const hours = String(nextClosingTime.getHours()).padStart(2, "0");
    const minutes = String(nextClosingTime.getMinutes()).padStart(2, "0");
    const seconds = String(nextClosingTime.getSeconds()).padStart(2, "0");

    // Get timezone offset in minutes and convert to +/-HH:mm format
    const timezoneOffset = nextClosingTime.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(timezoneOffset / 60));
    const offsetMinutes = Math.abs(timezoneOffset % 60);
    const offsetSign = timezoneOffset <= 0 ? "+" : "-";
    const offsetString = `${offsetSign}${String(offsetHours).padStart(
      2,
      "0"
    )}:${String(offsetMinutes).padStart(2, "0")}`;

    // Format: YYYY-MM-DDTHH:mm:ss+/-HH:mm
    const timestamptz = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;

    console.log("Final closing time (timestamptz):", timestamptz);
    return timestamptz;
  }

  console.log("No closing time found");
  return null;
}

export async function updateUserActiveClub(
  userId: string,
  clubId: string | null
) {
  let updateData: {
    active_club_id: string | null;
    active_club_closed?: string | null;
  } = {
    active_club_id: clubId,
  };

  // If user is checking into a club, calculate the closing time
  if (clubId) {
    try {
      console.log("Checking into club:", clubId);

      // Get the club's hours
      const { data: club, error: clubError } = await supabase
        .from("Clubs")
        .select("hours")
        .eq("id", clubId)
        .single();

      console.log("Club data:", club, "Club error:", clubError);

      if (!clubError && club?.hours) {
        console.log("Club hours found, calculating closing time...");
        const closingTime = calculateClubClosingTime(club.hours);
        console.log("Calculated closing time:", closingTime);

        if (closingTime) {
          updateData.active_club_closed = closingTime;
          console.log("Set active_club_closed to:", closingTime);
        } else {
          console.log("No closing time calculated");
        }
      } else {
        console.log("No club hours found or error occurred");
      }
    } catch (error) {
      console.error("Error calculating club closing time:", error);
      // Continue without setting closing time if there's an error
    }
  } else {
    // If user is leaving a club, clear the closing time
    console.log("Leaving club, clearing active_club_closed");
    updateData.active_club_closed = null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select();

  console.log("updateUserActiveClub", data, error);
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

/**
 * Checks if the user's active club has closed and clears their attendance if so
 * This should be called when the app opens or when checking user status
 */
export async function checkAndClearExpiredAttendance(
  userId: string
): Promise<boolean> {
  try {
    // Get the user's current profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("active_club_id, active_club_closed")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return false;
    }

    // If user has an active club and a closing time
    if (profile.active_club_id && profile.active_club_closed) {
      const closingTime = new Date(profile.active_club_closed);
      const now = new Date();

      // If the closing time has passed, clear the attendance
      if (now > closingTime) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            active_club_id: null,
            active_club_closed: null,
          })
          .eq("id", userId);

        if (!updateError) {
          // Broadcast the profile update
          await supabase.channel("profile_changes").send({
            type: "broadcast",
            event: "profile_update",
            payload: {
              new: {
                id: userId,
                active_club_id: null,
                active_club_closed: null,
              },
            },
          });

          console.log(`Cleared expired attendance for user ${userId}`);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking expired attendance:", error);
    return false;
  }
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
        active_club_closed,
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

/**
 * Returns friends of the current user who are attending (active_club_id === clubId).
 * @param clubId - The club to check attendance for.
 * @param userId - The current user's id.
 * @returns Array of { id, avatar_url } for friends attending the club.
 */
export async function fetchFriendsAttending(
  clubId: string,
  userId: string
): Promise<{ id: string; avatar_url: string | null }[]> {
  const friends = await fetchUserFriends(userId);
  return friends
    .filter((friend) => friend.active_club_id === clubId)
    .map((friend) => ({
      id: friend.id,
      avatar_url: friend.avatar_url ?? null,
    }));
}

/**
 * Manually checks and clears expired attendance for all users
 * This can be called for testing or manual cleanup
 */
export async function checkAndClearAllExpiredAttendance(): Promise<{
  clearedCount: number;
  errors: string[];
}> {
  try {
    // Get all users with active clubs and closing times
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, active_club_id, active_club_closed")
      .not("active_club_id", "is", null)
      .not("active_club_closed", "is", null);

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return { clearedCount: 0, errors: [] };
    }

    const now = new Date();
    const usersToClear: string[] = [];
    const errors: string[] = [];

    // Check each profile for expired attendance
    for (const profile of profiles) {
      try {
        const closingTime = new Date(profile.active_club_closed);

        if (now > closingTime) {
          usersToClear.push(profile.id);
        }
      } catch (error) {
        errors.push(`Error processing profile ${profile.id}: ${error}`);
      }
    }

    // Clear attendance for all expired users
    if (usersToClear.length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          active_club_id: null,
          active_club_closed: null,
        })
        .in("id", usersToClear);

      if (updateError) {
        errors.push(`Error updating profiles: ${updateError.message}`);
      } else {
        // Broadcast the profile updates
        await supabase.channel("profile_changes").send({
          type: "broadcast",
          event: "attendance_cleared",
          payload: {
            clearedUsers: usersToClear,
            timestamp: now.toISOString(),
          },
        });
      }
    }

    return {
      clearedCount: usersToClear.length,
      errors,
    };
  } catch (error) {
    console.error("Error checking all expired attendance:", error);
    return {
      clearedCount: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}
