import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get all upcoming events
    const now = new Date().toISOString();
    const { data: events, error: eventsError } = await supabaseClient
      .from("events")
      .select(
        `
        id,
        title,
        start_date,
        end_date,
        attendees,
        trending
      `
      )
      .gt("end_date", now)
      .order("start_date", { ascending: true });

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    console.log(`Processing ${events?.length || 0} upcoming events`);

    // Calculate trending status for each event
    const trendingUpdates = [];

    for (const event of events || []) {
      if (!event.attendees || event.attendees.length === 0) {
        // No attendees, mark as not trending
        if (event.trending) {
          trendingUpdates.push({ id: event.id, trending: false });
        }
        continue;
      }

      // Get all friendships for attendees
      const attendeeIds = event.attendees;
      const { data: friendships, error: friendshipsError } =
        await supabaseClient
          .from("friendships")
          .select("requester_id, receiver_id")
          .or(
            `requester_id.in.(${attendeeIds.join(
              ","
            )}),receiver_id.in.(${attendeeIds.join(",")})`
          )
          .eq("status", "friends");

      if (friendshipsError) {
        console.error(
          `Error fetching friendships for event ${event.id}:`,
          friendshipsError
        );
        continue;
      }

      // Calculate friend connections within attendees
      const friendConnections = new Set();
      friendships?.forEach((friendship) => {
        if (
          attendeeIds.includes(friendship.requester_id) &&
          attendeeIds.includes(friendship.receiver_id)
        ) {
          // Both users are attending and are friends
          const connection = [friendship.requester_id, friendship.receiver_id]
            .sort()
            .join("-");
          friendConnections.add(connection);
        }
      });

      // Determine if event should be trending
      // Trending criteria: At least 2 friends attending OR 3+ attendees with 1+ friend connection
      const shouldBeTrending =
        event.attendees.length >= 3 && friendConnections.size >= 1;

      console.log(
        `Event ${event.id} (${event.title}): ${event.attendees.length} attendees, ${friendConnections.size} friend connections, trending: ${shouldBeTrending}`
      );

      // Only update if trending status changed
      if (event.trending !== shouldBeTrending) {
        trendingUpdates.push({
          id: event.id,
          trending: shouldBeTrending,
        });
      }
    }

    // Batch update trending status
    if (trendingUpdates.length > 0) {
      console.log(
        `Updating trending status for ${trendingUpdates.length} events`
      );

      for (const update of trendingUpdates) {
        const { error: updateError } = await supabaseClient
          .from("events")
          .update({ trending: update.trending })
          .eq("id", update.id);

        if (updateError) {
          console.error(`Error updating event ${update.id}:`, updateError);
        } else {
          console.log(
            `Updated event ${update.id}: trending = ${update.trending}`
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${events?.length || 0} events, updated ${
          trendingUpdates.length
        } trending statuses`,
        updated_events: trendingUpdates.length,
        total_events: events?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in calculate-trending-events:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
