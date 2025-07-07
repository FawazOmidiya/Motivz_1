import { createClient } from "@supabase/supabase-js";
import { Review } from "@/types/club";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export const searchClubsByName = async (searchTerm: string) => {
  try {
    const { data, error } = await supabase
      .from("Clubs")
      .select("*")
      .ilike("Name", `%${searchTerm}%`)
      .order("Name");

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Error searching clubs:", error);
    return [];
  }
};

export const submitReview = async (review: Review) => {
  try {
    // For web reviews, we'll submit without user_id (null = anonymous)
    const reviewData = {
      ...review,
      user_id: null, // Anonymous review
      like_ids: [], // Initialize empty likes array
    };

    const { data, error } = await supabase
      .from("club_reviews")
      .insert([reviewData])
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error submitting review:", error);
    return { data: null, error };
  }
};
