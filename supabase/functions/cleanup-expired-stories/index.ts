import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date().toISOString();

    // First, get all expired stories
    const { data: expiredStories, error: fetchError } = await supabaseClient
      .from("stories")
      .select("*")
      .lt("expires_at", now);

    if (fetchError) {
      throw new Error(`Failed to fetch expired stories: ${fetchError.message}`);
    }

    if (!expiredStories || expiredStories.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No expired stories to archive",
          archivedCount: 0,
          timestamp: now,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Archive the stories to archived_stories table
    const { data: archivedData, error: archiveError } = await supabaseClient
      .from("archived_stories")
      .insert(
        expiredStories.map((story) => ({
          original_story_id: story.id,
          user_id: story.user_id,
          media_url: story.media_url,
          media_type: story.media_type,
          thumbnail_url: story.thumbnail_url,
          caption: story.caption,
          location: story.location,
          visibility: story.visibility,
          club_id: story.club_id,
          event_id: story.event_id,
          location_name: story.location_name,
          latitude: story.latitude,
          longitude: story.longitude,
          expires_at: story.expires_at,
          created_at: story.created_at,
          updated_at: story.updated_at,
        }))
      )
      .select("id");

    if (archiveError) {
      throw new Error(`Failed to archive stories: ${archiveError.message}`);
    }

    // Now delete the original stories
    const { error: deleteError } = await supabaseClient
      .from("stories")
      .delete()
      .lt("expires_at", now);

    if (deleteError) {
      throw new Error(
        `Failed to delete archived stories: ${deleteError.message}`
      );
    }

    const archivedCount = archivedData?.length || 0;

    console.log(`Successfully archived ${archivedCount} expired stories`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Archived ${archivedCount} expired stories`,
        archivedCount,
        timestamp: now,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error archiving expired stories:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to archive expired stories",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
