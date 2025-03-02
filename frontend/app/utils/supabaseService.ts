import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY as string;

// ✅ Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
