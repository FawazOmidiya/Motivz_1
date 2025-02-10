import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL;
const SUPABASE_KEY = Constants.expoConfig?.extra?.SUPABASE_KEY;

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
