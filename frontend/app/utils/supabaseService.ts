import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }

    // Clear any stored session data
    await AsyncStorage.removeItem("supabase.auth.token");

    return true;
  } catch (error) {
    console.error("Error during sign out:", error);
    throw error;
  }
}

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
export const fetchFullEvent = async (eventId: string): Promise<types.Event> => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();
    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Event not found");
    }

    return data as types.Event;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
};

export async function fetchEventsWithTrending(
  limit: number = 50,
  offset: number = 0,
  filters?: { genres?: string[]; date?: string }
): Promise<{ events: types.Event[]; hasMore: boolean }> {
  try {
    const now = new Date().toISOString();
    let query = supabase.from("events").select("*").gt("end_date", now);

    // Apply filters
    if (filters?.genres && filters.genres.length > 0) {
      query = query.contains("music_genres", filters.genres);
    }

    if (filters?.date) {
      const filterDate = new Date(filters.date);
      const startOfDay = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth(),
        filterDate.getDate()
      );
      const endOfDay = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth(),
        filterDate.getDate() + 1
      );

      query = query
        .gte("start_date", startOfDay.toISOString())
        .lt("start_date", endOfDay.toISOString());
    }

    // Order by trending first, then by start date
    const { data: events, error } = await query
      .order("trending", { ascending: false })
      .order("start_date", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      events: events || [],
      hasMore: (events?.length || 0) === limit,
    };
  } catch (error) {
    console.error("Error fetching events with trending:", error);
    return {
      events: [],
      hasMore: false,
    };
  }
}

export async function fetchEventsByIds(
  eventIds: string[]
): Promise<types.Event[]> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "get-events-by-ids",
      {
        body: { event_ids: eventIds },
      }
    );

    if (error) throw error;

    return data.events || [];
  } catch (error) {
    console.error("Error fetching events by IDs:", error);
    // Fallback to regular query
    const { data, error: fallbackError } = await supabase
      .from("events")
      .select("*")
      .in("id", eventIds);

    if (fallbackError) throw fallbackError;

    return data || [];
  }
}

export const fetchSingleEvent = async (eventId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        start_date,
        club_id,
        club:Clubs!club_id (
          id,
          Name,
          Image
        )
      `
      )
      .eq("id", eventId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Event not found");
    }

    return data;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
};

export const fetchRecentClubReviews = async (clubId: string) => {
  try {
    // Calculate timestamp for 5 hours ago
    const fiveHoursAgo = new Date(
      Date.now() - 5 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("club_reviews")
      .select("rating, created_at")
      .eq("club_id", clubId)
      .gte("created_at", fiveHoursAgo);

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching recent reviews:", error);
    return [];
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

export const searchEventsByName = async (eventName: string, date?: Date) => {
  /**
   * Searches for events in the "events" table with a title similar to the provided input.
   * Only returns future events (events that haven't ended yet).
   *
   * @param {string} eventName - The term to search for.
   * @param {Date} date - The date to filter events by.
   * @returns {Promise<Array>} Array of events matching the search criteria, or an empty array on error.
   */
  try {
    const currentDate = new Date();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("end_date", date?.toISOString() || currentDate.toISOString())
      .ilike("title", `%${eventName}%`);

    if (error) {
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error("Error searching events:", error);
    return [];
  }
};

export async function fetchEventsByClub(
  clubId: string
): Promise<types.Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("club_id", clubId)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  return data || [];
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
    const { data, error } = await supabase
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

  const { data: existing, error: checkError } = await supabase
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
  const { error } = await supabase.from("profile_favourites").insert({
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

  const { error } = await supabase
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
      .or(query)
      .limit(20);
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
   * Filters out ended saved events from saved_events.
   *
   * @param userId - The ID of the user whose profile to fetch.
   * @returns A promise that resolves to the user's profile data.
   * @throws An error if the query fails.
   */
  // Add timeout to prevent hanging
  const queryPromise = supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error("Query timeout after 10 seconds")),
      10000
    );
  });

  let data, error, status;
  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    data = result.data;
    error = result.error;
    status = result.status;
  } catch (timeoutError: any) {
    // If it's a timeout, return null instead of throwing
    if (timeoutError?.message?.includes("timeout")) {
      return null;
    }
    throw timeoutError;
  }

  if (error && status !== 406) {
    throw new Error(error.message);
  }

  if (status === 406 || !data) {
    return null;
  }

  // Filter out ended saved events
  if (data && data.saved_events) {
    const now = new Date();
    let savedEventsArray: any[] = [];

    // Handle different data types: array, object, or null/undefined
    if (Array.isArray(data.saved_events)) {
      savedEventsArray = data.saved_events;
    } else if (
      typeof data.saved_events === "object" &&
      data.saved_events !== null
    ) {
      // Convert object to array format [{eventId: {...}}]
      const keys = Object.keys(data.saved_events);
      if (keys.length > 0) {
        savedEventsArray = Object.entries(data.saved_events).map(
          ([eventId, eventData]) => ({ [eventId]: eventData })
        );
      }
    }

    // Filter out events that have ended
    const futureEvents = savedEventsArray.filter((savedEvent) => {
      if (!savedEvent || typeof savedEvent !== "object") {
        return false;
      }

      const eventId = Object.keys(savedEvent)[0];
      if (!eventId) {
        return false;
      }

      const eventData = savedEvent[eventId] as any;
      const endDate = eventData?.end_date;

      if (endDate) {
        try {
          const eventEndDate = new Date(endDate);
          // Only include events that haven't ended yet
          return eventEndDate > now;
        } catch (error) {
          // If we can't parse the date, include it (better to show than hide)
          console.warn(`Error parsing end_date for event ${eventId}:`, error);
          return true;
        }
      }

      // If no end_date, include it
      return true;
    });

    // Update the data with filtered saved_events
    data.saved_events = futureEvents.length > 0 ? futureEvents : null;
  }

  return data;
};

/**
 * Fetches only the saved events for a user, filtered to exclude ended events.
 *
 * @param userId - The ID of the user whose saved events to fetch.
 * @returns A promise that resolves to an array of saved events (filtered to only future events) or null.
 * @throws An error if the query fails.
 */
export const fetchUserSavedEvents = async (
  userId: string
): Promise<any[] | null> => {
  const { data, error, status } = await supabase
    .from("profiles")
    .select("saved_events")
    .eq("id", userId)
    .single();

  if (error && status !== 406) {
    throw new Error(error.message);
  }

  if (!data || !data.saved_events) {
    return null;
  }

  // Filter out ended saved events
  const now = new Date();
  let savedEventsArray: any[] = [];

  // Handle different data types: array, object, or null/undefined
  if (Array.isArray(data.saved_events)) {
    savedEventsArray = data.saved_events;
  } else if (
    typeof data.saved_events === "object" &&
    data.saved_events !== null
  ) {
    // Convert object to array format [{eventId: {...}}]
    const keys = Object.keys(data.saved_events);
    if (keys.length > 0) {
      savedEventsArray = Object.entries(data.saved_events).map(
        ([eventId, eventData]) => ({ [eventId]: eventData })
      );
    }
  }

  // Filter out events that have ended
  const futureEvents = savedEventsArray.filter((savedEvent) => {
    if (!savedEvent || typeof savedEvent !== "object") {
      return false;
    }

    const eventId = Object.keys(savedEvent)[0];
    if (!eventId) {
      return false;
    }

    const eventData = savedEvent[eventId] as any;
    const endDate = eventData?.end_date;

    if (endDate) {
      try {
        const eventEndDate = new Date(endDate);
        // Only include events that haven't ended yet
        return eventEndDate > now;
      } catch (error) {
        // If we can't parse the date, include it (better to show than hide)
        console.warn(`Error parsing end_date for event ${eventId}:`, error);
        return true;
      }
    }

    // If no end_date, include it
    return true;
  });

  return futureEvents.length > 0 ? futureEvents : null;
};

// Check if user profile exists and is complete
export const checkUserProfileComplete = async (
  userId: string
): Promise<{ exists: boolean; isComplete: boolean; profile?: any }> => {
  try {
    // Optimized: Only fetch is_complete field instead of entire profile
    // This is much faster and prevents timeouts
    const query = supabase
      .from("profiles")
      .select("is_complete")
      .eq("id", userId)
      .single();

    // Add timeout to prevent indefinite hangs
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Query timeout after 10 seconds"));
      }, 10000);
    });

    try {
      const result = await Promise.race([query, timeoutPromise]);
      const { data, error, status } = result;

      if (error && status !== 406) {
        // Profile doesn't exist or query failed
        return { exists: false, isComplete: false };
      }

      if (!data) {
        return { exists: false, isComplete: false };
      }

      // Use the is_complete field from the database
      const isComplete = !!data.is_complete;
      return { exists: true, isComplete };
    } catch (queryError: any) {
      // If it's a timeout, return false (profile doesn't exist or can't be determined)
      if (queryError?.message?.includes("timeout")) {
        console.error("Query timed out - network or connection issue");
        return { exists: false, isComplete: false };
      }

      // Profile doesn't exist or error occurred
      return { exists: false, isComplete: false };
    }
  } catch (error) {
    // Outer catch for any other errors
    console.error("Error checking user profile complete:", error);
    return { exists: false, isComplete: false };
  }
};

// Friend Functions

// 1. Send Friend Request
export async function sendFriendRequest(
  currentUserId: string,
  targetUserId: string
) {
  const { data, error } = await supabase
    .from("friendships")
    .insert([
      {
        requester_id: currentUserId,
        receiver_id: targetUserId,
        status: "pending",
      },
    ])
    .select(); // Explicitly request data to be returned

  // If friend request was sent successfully, send notification to the receiver
  if (!error && data && Array.isArray(data) && data.length > 0) {
    try {
      // Get the requester's name for the notification
      const { data: requesterProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, username")
        .eq("id", currentUserId)
        .single();

      const requesterName = requesterProfile
        ? `${requesterProfile.first_name} ${requesterProfile.last_name}`
        : "Someone";

      // Send notification to the receiver (only once)
      await sendNotificationToUser(
        targetUserId,
        "New Friend Request",
        `${requesterName} sent you a friend request!`,
        {
          type: "friend_request",
          requester_id: currentUserId,
          action: "view_requests",
        }
      );
    } catch (notificationError) {
      console.error(
        "Error sending friend request notification:",
        notificationError
      );
      // Don't fail the friend request if notification fails
    }
  }

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
    .match({ requester_id: targetUserId, receiver_id: currentUserId })
    .select(); // Explicitly request data to be returned

  // If friend request was accepted successfully, send notification to the requester
  if (!error && data && Array.isArray(data) && data.length > 0) {
    try {
      // Get the accepter's name for the notification
      const { data: accepterProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, username")
        .eq("id", currentUserId)
        .single();

      const accepterName = accepterProfile
        ? `${accepterProfile.first_name} ${accepterProfile.last_name}`
        : "Someone";

      // Send notification to the requester (only once)
      await sendNotificationToUser(
        targetUserId,
        "Friend Request Accepted",
        `${accepterName} accepted your friend request!`,
        {
          type: "friend_request_accepted",
          accepter_id: currentUserId,
          action: "view_profile",
        }
      );
    } catch (notificationError) {
      console.error(
        "Error sending friend request accepted notification:",
        notificationError
      );
      // Don't fail the friend request acceptance if notification fails
    }
  }

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

// Check if two users are friends
export async function areFriends(
  userId1: string,
  userId2: string
): Promise<boolean> {
  try {
    if (!userId1 || !userId2) return false;

    // Check if there's a friendship record in either direction with status "friends"
    const { data, error } = await supabase
      .from("friendships")
      .select("status")
      .or(
        `and(requester_id.eq.${userId1},receiver_id.eq.${userId2}),and(requester_id.eq.${userId2},receiver_id.eq.${userId1})`
      )
      .eq("status", "friends")
      .limit(1);

    if (error) {
      console.error("Error checking friendship status:", error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("Error checking friendship status:", error);
    return false;
  }
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
 * Calculates how long until a club opens today, or returns null if not opening today
 * @param hours The club's opening hours
 * @returns Object with timeUntilOpen in minutes and formatted string, or null if not opening today
 */
export function getTimeUntilOpen(hours: types.RegularOpeningHours): {
  minutes: number;
  formatted: string;
} | null {
  if (!hours.periods || hours.periods.length === 0) return null;

  const now = new Date();
  const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Convert a period's time into absolute minutes.
  const convertToAbsolute = (day: number, hour: number, minute: number) =>
    day * 1440 + hour * 60 + minute;

  let minTimeUntilOpen = Infinity;

  // Check each period to find the next opening time today
  for (let period of hours.periods) {
    // Only consider periods that open today
    if (period.open.day === currentDay) {
      const openAbs = convertToAbsolute(
        period.open.day,
        period.open.hour,
        period.open.minute
      );
      const currentAbs = convertToAbsolute(
        currentDay,
        now.getHours(),
        now.getMinutes()
      );

      // If the club opens later today
      if (openAbs > currentAbs) {
        const timeUntilOpen = openAbs - currentAbs;
        if (timeUntilOpen < minTimeUntilOpen) {
          minTimeUntilOpen = timeUntilOpen;
        }
      }
    }
  }

  // If no opening time found for today, return null
  if (minTimeUntilOpen === Infinity) {
    return null;
  }

  // Format the time until opening
  const hoursUntilOpen = Math.floor(minTimeUntilOpen / 60);
  const minutesUntilOpen = minTimeUntilOpen % 60;

  let formatted = "";
  if (hoursUntilOpen >= 1) {
    formatted = `Opening in ${hoursUntilOpen}h`;
  } else {
    formatted = `Opening in ${minutesUntilOpen}m`;
  }

  return {
    minutes: minTimeUntilOpen,
    formatted: formatted,
  };
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
  updates: {
    avatar_url?: string;
    username?: string;
    website?: string;
    bio?: string;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    age?: number;
    favorite_music?: string[];
    crowd_preferences?: string[];
    nightlife_goals?: string[];
    dress_code?: string[];
    budget?: string;
    drinking_preference?: string;
    smoking_preference?: string;
    updated_at?: string;
  }
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
 * Fetch pending friend requests count for a user (optimized for badge display)
 */
export async function fetchPendingFriendRequestsCount(
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("status", "pending");

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  } catch (error) {
    console.error("Error fetching pending friend requests count:", error);
    return 0;
  }
}

export async function saveEvent(userId: string, event: any): Promise<boolean> {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("saved_events")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    const currentSavedEvents = Array.isArray(profile?.saved_events)
      ? profile.saved_events
      : [];
    const eventData = {
      [event.id]: {
        title: event.title,
        poster_url: event.poster_url,
        start_date: event.start_date,
        end_date: event.end_date,
        music_genres: event.music_genres,
        club_id: event.club_id,
      },
    };

    // Check if event is already saved
    const isAlreadySaved = currentSavedEvents.some(
      (savedEvent) => Object.keys(savedEvent)[0] === event.id
    );

    if (isAlreadySaved) {
      return true; // Already saved
    }

    const updatedSavedEvents = [...currentSavedEvents, eventData];

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ saved_events: updatedSavedEvents })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Increment save_count on the event
    const { error: eventUpdateError } = await supabase.rpc(
      "increment_save_count",
      {
        event_id: event.id,
      }
    );

    if (eventUpdateError) {
      console.error("Error incrementing save count:", eventUpdateError);
    }

    return true;
  } catch (error) {
    console.error("Error saving event:", error);
    return false;
  }
}

export async function unsaveEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("saved_events")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    const currentSavedEvents = Array.isArray(profile?.saved_events)
      ? profile.saved_events
      : [];
    const updatedSavedEvents = currentSavedEvents.filter(
      (savedEvent) => Object.keys(savedEvent)[0] !== eventId
    );

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ saved_events: updatedSavedEvents })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Decrement save_count on the event
    const { error: eventUpdateError } = await supabase.rpc(
      "decrement_save_count",
      {
        event_id: eventId,
      }
    );

    if (eventUpdateError) {
      console.error("Error decrementing save count:", eventUpdateError);
    }

    return true;
  } catch (error) {
    console.error("Error unsaving event:", error);
    return false;
  }
}

/**
 * Store user's push token in the database
 */
export async function storeUserPushToken(
  userId: string,
  pushToken: string
): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ push_token: pushToken })
      .eq("id", userId);

    return { data, error };
  } catch (error) {
    console.error("Error storing push token:", error);
    return { data: null, error };
  }
}

/**
 * Silently register for notifications (for settings toggle)
 */
export async function registerNotificationsSilently(
  userId: string
): Promise<boolean> {
  try {
    const { registerForPushNotificationsSilently } = await import(
      "./notificationService"
    );
    const pushToken = await registerForPushNotificationsSilently();

    if (pushToken) {
      console.log(
        "🔔 Silent registration successful, storing token:",
        pushToken
      );
      const { error } = await storeUserPushToken(userId, pushToken);
      if (error) {
        console.error("Error storing push token:", error);
        return false;
      }
      return true;
    } else {
      console.log("🔔 Silent registration failed - permission not granted");
      return false;
    }
  } catch (error) {
    console.error("Error in silent notification registration:", error);
    return false;
  }
}

/**
 * Get user's push token from the database
 */
export async function getUserPushToken(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching push token:", error);
      return null;
    }

    return data?.push_token || null;
  } catch (error) {
    console.error("Error fetching push token:", error);
    return null;
  }
}

/**
 * Send notification to a user by their ID using Supabase Edge Function
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    const pushToken = await getUserPushToken(userId);

    if (!pushToken) {
      console.warn("No push token found for user:", userId);
      return false;
    }

    const { data: result, error } = await supabase.functions.invoke(
      "send-push-notification",
      {
        body: {
          title: title,
          body: body,
          userId: userId,
          sendToAll: false,
        },
      }
    );

    if (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      return false;
    }

    if (result?.error) {
      console.error(`Edge Function error for user ${userId}:`, result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
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

export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    // Delete user avatar from storage if it exists (not handled by CASCADE)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (profile?.avatar_url) {
        const avatarPath = profile.avatar_url.split("/").pop();
        if (avatarPath) {
          await storage.remove([avatarPath]);
        }
      }
    } catch (storageError) {
      console.warn("Could not delete avatar from storage:", storageError);
      // Don't throw error for storage deletion failure
    }

    // Call the delete-user Edge Function to delete the user and all associated data
    const { error: edgeFunctionError } = await supabase.functions.invoke(
      "delete-user",
      {
        body: { user_id: userId },
      }
    );

    if (edgeFunctionError) {
      console.error(
        "Error calling delete-user Edge Function:",
        edgeFunctionError
      );
      throw new Error(edgeFunctionError.message);
    }

    console.log("User account and all data deleted successfully.");

    return true;
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
}

/**
 * Load live ratings for multiple clubs efficiently using a single query
 * @param clubs Array of club objects with id and rating properties
 * @returns Promise that resolves when all live ratings are loaded
 */
export const loadLiveRatingsForClubs = async (clubs: any[]) => {
  try {
    if (clubs.length === 0) return;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Get all club IDs that are currently open
    const openClubIds = [];
    const clubRatings = new Map(); // Store base ratings

    for (const club of clubs) {
      clubRatings.set(club.id, club.rating);

      // Check if club is currently open
      if (club.hours?.periods) {
        for (const period of club.hours.periods) {
          const openAbs =
            period.open.day * 1440 + period.open.hour * 60 + period.open.minute;
          const closeAbs =
            period.close.day * 1440 +
            period.close.hour * 60 +
            period.close.minute;

          let adjustedCloseAbs = closeAbs;
          if (closeAbs <= openAbs) {
            adjustedCloseAbs += 7 * 1440;
          }

          let currentAbs = currentDay * 1440 + currentTime;
          if (currentAbs < openAbs) {
            currentAbs += 7 * 1440;
          }

          if (currentAbs >= openAbs && currentAbs < adjustedCloseAbs) {
            openClubIds.push(club.id);
            break;
          }
        }
      }
    }

    if (openClubIds.length === 0) return;

    // Calculate the earliest open time for any club (5 hours ago as fallback)
    const fiveHoursAgo = new Date(
      Date.now() - 5 * 60 * 60 * 1000
    ).toISOString();

    // Fetch all reviews for open clubs since the earliest open time
    const { data: allReviews, error } = await supabase
      .from("club_reviews")
      .select("club_id, rating, created_at")
      .in("club_id", openClubIds)
      .gte("created_at", fiveHoursAgo);

    if (error) {
      console.error("Error fetching live ratings:", error);
      return;
    }

    // Group reviews by club_id
    const reviewsByClub = new Map();
    allReviews?.forEach((review) => {
      if (!reviewsByClub.has(review.club_id)) {
        reviewsByClub.set(review.club_id, []);
      }
      reviewsByClub.get(review.club_id).push(review);
    });

    // Calculate live ratings for each club
    const liveRatings = new Map();
    for (const clubId of openClubIds) {
      const reviews = reviewsByClub.get(clubId) || [];
      const baseRating = clubRatings.get(clubId);

      if (reviews.length > 0) {
        const baseRatingWeight = 10;
        const baseRatingTotal = baseRating * baseRatingWeight;
        const reviewTotal = reviews.reduce(
          (sum: number, review: any) => sum + review.rating,
          0
        );
        const totalWeight = baseRatingWeight + reviews.length;
        const weightedAverage = (baseRatingTotal + reviewTotal) / totalWeight;
        liveRatings.set(clubId, Number(weightedAverage.toFixed(2)));
      } else {
        liveRatings.set(clubId, baseRating);
      }
    }

    // Update club objects with live ratings
    for (const club of clubs) {
      if (liveRatings.has(club.id)) {
        club._live_rating = liveRatings.get(club.id);
      }
    }
  } catch (error) {
    console.error("Error loading live ratings:", error);
  }
};

/**
 * Calculate trending clubs based on recent reviews and ratings (last 5 hours)
 * Optimized to use a single query instead of N+1 queries
 */
export const calculateTrendingClubs = async (clubs: any[]) => {
  try {
    if (clubs.length === 0) return [];

    // Calculate timestamp for 5 hours ago
    const fiveHoursAgo = new Date(
      Date.now() - 5 * 60 * 60 * 1000
    ).toISOString();

    // Get all club IDs
    const clubIds = clubs.map((club) => club.id);

    // Fetch all recent reviews for all clubs in a single query
    const { data: allRecentReviews, error } = await supabase
      .from("club_reviews")
      .select("club_id, rating, created_at")
      .in("club_id", clubIds)
      .gte("created_at", fiveHoursAgo);

    if (error) {
      console.error("Error fetching recent reviews:", error);
      return [];
    }

    // Group reviews by club_id
    const reviewsByClub = new Map();
    allRecentReviews?.forEach((review) => {
      if (!reviewsByClub.has(review.club_id)) {
        reviewsByClub.set(review.club_id, []);
      }
      reviewsByClub.get(review.club_id).push(review);
    });

    const trendingClubs = [];

    for (const club of clubs) {
      const recentReviews = reviewsByClub.get(club.id) || [];

      if (recentReviews.length >= 3) {
        // Minimum 3 reviews in last 5 hours
        // Calculate average rating
        const totalRating = recentReviews.reduce(
          (sum: number, review: any) => sum + review.rating,
          0
        );
        const avgRating = totalRating / recentReviews.length;

        if (avgRating >= 3.5) {
          // Minimum 3.5 average rating
          const trendingScore = recentReviews.length * avgRating;

          trendingClubs.push({
            ...club,
            trending_score: trendingScore,
            recent_reviews_count: recentReviews.length,
            avg_rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            is_trending: true,
          });
        }
      }
    }

    // Sort by trending score (reviews count * average rating)
    trendingClubs.sort((a, b) => b.trending_score - a.trending_score);

    return trendingClubs;
  } catch (error) {
    console.error("Error calculating trending clubs:", error);
    return [];
  }
};

// Analytics functions
export const trackEventClick = async (
  eventId: string,
  userId: string,
  clickType: "view" | "share" | "ticket_purchase" | "guestlist_request",
  sourceScreen: string,
  metadata?: any
) => {
  try {
    const { error } = await supabase.from("event_analytics").insert({
      event_id: eventId,
      user_id: userId,
      click_type: clickType,
      source_screen: sourceScreen,
      metadata: metadata || {},
    });

    if (error) {
      console.error("Error tracking event click:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error tracking event click:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const getEventAnalytics = async (eventId: string) => {
  try {
    const { data, error } = await supabase
      .from("event_analytics")
      .select("*")
      .eq("event_id", eventId);

    if (error) {
      console.error("Error fetching event analytics:", error);
      return { data: null, error: error.message };
    }

    // Process analytics data
    const analytics = {
      total_views:
        data?.filter((click) => click.click_type === "view").length || 0,
      total_shares:
        data?.filter((click) => click.click_type === "share").length || 0,
      total_ticket_purchases:
        data?.filter((click) => click.click_type === "ticket_purchase")
          .length || 0,
      total_guestlist_requests:
        data?.filter((click) => click.click_type === "guestlist_request")
          .length || 0,
      unique_users: new Set(data?.map((click) => click.user_id) || []).size,
      recent_activity: data?.slice(-10) || [],
    };

    return { data: analytics };
  } catch (error) {
    console.error("Error fetching event analytics:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Event attendance functions
export const addUserToEventAttendees = async (
  eventId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First get the current attendees
    const { data: eventData, error: fetchError } = await supabase
      .from("events")
      .select("attendees")
      .eq("id", eventId)
      .single();

    if (fetchError) {
      console.error("Error fetching event attendees:", fetchError);
      return { success: false, error: fetchError.message };
    }

    const currentAttendees = eventData?.attendees || [];

    // Check if user is already attending
    if (currentAttendees.includes(userId)) {
      return { success: true }; // Already attending
    }

    // Add user to attendees list
    const updatedAttendees = [...currentAttendees, userId];

    const { error: updateError } = await supabase
      .from("events")
      .update({ attendees: updatedAttendees })
      .eq("id", eventId);

    if (updateError) {
      console.error("Error adding user to event attendees:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding user to event attendees:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const removeUserFromEventAttendees = async (
  eventId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First get the current attendees
    const { data: eventData, error: fetchError } = await supabase
      .from("events")
      .select("attendees")
      .eq("id", eventId)
      .single();

    if (fetchError) {
      console.error("Error fetching event attendees:", fetchError);
      return { success: false, error: fetchError.message };
    }

    const currentAttendees = eventData?.attendees || [];

    // Remove user from attendees list
    const updatedAttendees = currentAttendees.filter(
      (id: string) => id !== userId
    );

    const { error: updateError } = await supabase
      .from("events")
      .update({ attendees: updatedAttendees })
      .eq("id", eventId);

    if (updateError) {
      console.error("Error removing user from event attendees:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing user from event attendees:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const fetchFriendsAttendingEvent = async (
  eventId: string,
  userId: string
): Promise<{ id: string; avatar_url: string | null }[]> => {
  try {
    // Get the event attendees
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("attendees")
      .eq("id", eventId)
      .single();

    if (eventError || !eventData?.attendees) {
      return [];
    }

    // Get user's friends
    const friends = await fetchUserFriends(userId);
    const friendIds = friends.map((friend) => friend.id);

    // Filter attendees to only include friends
    const friendsAttending = eventData.attendees.filter((attendeeId: string) =>
      friendIds.includes(attendeeId)
    );

    // Get friend profiles for those attending
    const { data: friendProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, avatar_url")
      .in("id", friendsAttending);

    if (profilesError) {
      console.error("Error fetching friend profiles:", profilesError);
      return [];
    }

    return (
      friendProfiles?.map((profile) => ({
        id: profile.id,
        avatar_url: profile.avatar_url,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching friends attending event:", error);
    return [];
  }
};

export const isUserAttendingEvent = async (
  eventId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("attendees")
      .eq("id", eventId)
      .single();

    if (error || !data?.attendees) {
      return false;
    }

    return data.attendees.includes(userId);
  } catch (error) {
    console.error("Error checking if user is attending event:", error);
    return false;
  }
};

// Fetch events that a user is attending
export const fetchUserAttendingEvents = async (
  userId: string
): Promise<types.Event[]> => {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        *,
        Clubs!inner(
          id,
          Name,
          Address,
          latitude,
          longitude,
          Image
        )
      `
      )
      .contains("attendees", [userId])
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Error fetching user attending events:", error);
      return [];
    }

    return events || [];
  } catch (error) {
    console.error("Error fetching user attending events:", error);
    return [];
  }
};

// Function to update user's last active timestamp
export async function updateLastActive(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.error("Error updating last active:", error);
      return false;
    }

    console.log("✅ Last active updated for user:", userId);
    return true;
  } catch (error) {
    console.error("Error updating last active:", error);
    return false;
  }
}

// Function to update friends count
export async function updateFriendsCount(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("update_friends_count", {
      user_id: userId,
    });
    if (error) {
      console.error("Error updating friends count:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error updating friends count:", error);
    return false;
  }
}

// Function to update clubs count
export async function updateClubsCount(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("update_clubs_count", {
      user_id: userId,
    });
    if (error) {
      console.error("Error updating clubs count:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error updating clubs count:", error);
    return false;
  }
}

// Function to update events count
export async function updateEventsCount(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("update_events_count", {
      user_id: userId,
    });
    if (error) {
      console.error("Error updating events count:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error updating events count:", error);
    return false;
  }
}
