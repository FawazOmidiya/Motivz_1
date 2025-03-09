import { createClient } from "@supabase/supabase-js";

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
    console.log("Fetched favourites:", data);
    return data;
  } catch (error) {
    console.error("Error fetching user favourites:", error);
    return [];
  }
};
