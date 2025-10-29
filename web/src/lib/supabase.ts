import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Club functions
export const getClubById = async (clubId: string) => {
  const { data, error } = await supabase
    .from("Clubs")
    .select("*")
    .eq("id", clubId)
    .single();

  if (error) {
    console.error("Error fetching club:", error);
    return null;
  }

  return data;
};

// Review functions
export const submitReview = async (review: {
  club_id: string;
  rating: number;
  genres: string[];
  review_text?: string;
  user_id?: string;
}) => {
  const { data, error } = await supabase
    .from("club_reviews")
    .insert([review])
    .select();

  if (error) {
    console.error("Error submitting review:", error);
    return { error };
  }

  return { data };
};

// Search functions
export const searchClubsByName = async (clubName: string) => {
  try {
    const { data, error } = await supabase
      .from("Clubs")
      .select("*")
      .ilike("Name", `%${clubName}%`);

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  } catch (error) {
    console.error("Error searching clubs:", error);
    return [];
  }
};
