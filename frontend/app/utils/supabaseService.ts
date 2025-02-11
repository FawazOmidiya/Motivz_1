import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const SUPABASE_URL = "https://htercrqcpdnpiifpufuo.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZXJjcnFjcGRucGlpZnB1ZnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzNTcyNjcsImV4cCI6MjAzNDkzMzI2N30.XtB1qfAzrIMWC3N1GaGDb8_vJ8br8EbC3gRLTxK0eRY";

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
