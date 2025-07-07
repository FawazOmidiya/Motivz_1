import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { club_id, rating, genres, review_text, crowd_level } = body;

    // Validate required fields
    if (!club_id || !rating || !genres || !crowd_level) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate crowd level
    const validCrowdLevels = ["empty", "quiet", "moderate", "busy", "packed"];
    if (!validCrowdLevels.includes(crowd_level)) {
      return NextResponse.json(
        { error: "Invalid crowd level" },
        { status: 400 }
      );
    }

    // Submit review to Supabase (anonymous review)
    const { data, error } = await supabase
      .from("club_reviews")
      .insert([
        {
          club_id,
          rating,
          genres,
          review_text: review_text || null,
          crowd_level,
          user_id: null, // Anonymous review
          like_ids: [], // Initialize empty likes array
        },
      ])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to submit review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
