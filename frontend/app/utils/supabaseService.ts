import { createClient } from "@supabase/supabase-js";
import { supabaseAuth } from "./supabaseAuth";
import type { Session } from "@supabase/supabase-js";
import * as types from "./types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY as string;

// ✅ Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
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

export const fetchSingleClub = async (clubId: string) => {
  try {
    const { data, error } = await supabase
      .from("Clubs")
      .select("*")
      .eq("club_id", clubId);

    if (error) {
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error("Error fetching clubs:", error);
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

/**
 * Searches for clubs in the "clubs" table with a Name similar to the provided input.
 *
 * @param {string} searchTerm - The term to search for.
 * @returns {Promise<Array>} Array of clubs matching the search criteria, or an empty array on error.
 */
export const searchClubsByName = async (ClubName: string) => {
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

/**
 * Updates a user's profile information in the "profiles" table.
 *
 * @param userId - The ID of the user.
 * @param updates - An object containing the updated profile fields.
 * @returns A boolean indicating success.
 * @throws An error if the update fails.
 */
export const updateUserProfile = async (
  userId: string,
  updates: {
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  }
) => {
  try {
    const payload = {
      id: userId,
      ...updates,
      updated_at: new Date(),
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    if (error) {
      throw new Error(error.message);
    }
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Adds a club to the user's favourites if the user-club pair doesn't already exist.
 *
 * @param session - The current Supabase session.
 * @param club - The club object to add to favourites.
 * @returns A promise that resolves to true if the club was added,
 *          or false if the favourite already exists.
 * @throws An error if the user is not signed in or if the insert fails.
 */
export async function addClubToFavourites(
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

/**
 * Removes a club from the user's favourites.
 *
 * @param session - The current Supabase session.
 * @param club - The club object to remove from favourites.
 * @returns A promise that resolves to true if the club was removed.
 * @throws An error if the user is not signed in or if the deletion fails.
 */
export async function removeClubFromFavourites(
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

/**
 * Searches for users in the "profiles" table by username, first_name, or last_name.
 *
 * @param searchTerm - The term to search for.
 * @returns An array of user profiles matching the search criteria.
 */
export const searchUsersByName = async (
  searchTerm: string
): Promise<types.UserProfile[]> => {
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
