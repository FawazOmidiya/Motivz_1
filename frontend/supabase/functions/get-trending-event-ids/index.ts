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

    // Get user ID from request
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Authentication required");
    }

    // Parse request parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50"); // Return more IDs for local pagination
    const cursor = url.searchParams.get("cursor"); // Event ID to start after
    const now = new Date().toISOString();

    // Parse filter parameters from request body
    let requestBody = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      // If no body, use empty object
    }

    const { genres, date } = requestBody as {
      genres?: string[];
      date?: string;
    };

    // Build the query with filters
    let query = supabaseClient
      .from("events")
      .select("id, trending, start_date, attendees")
      .gt("end_date", now);

    // Apply genre filter if provided
    if (genres && genres.length > 0) {
      query = query.contains("music_genres", genres);
    }

    // Apply date filter if provided
    if (date) {
      const filterDate = new Date(date);
      const startOfDay = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth(),
        filterDate.getDate()
      );
      const endOfDay = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth(),
        filterDate.getDate() + 1
      );

      query = query
        .gte("start_date", startOfDay.toISOString())
        .lt("start_date", endOfDay.toISOString());
    }

    // Get filtered events - fetch more than needed to account for sorting
    const { data: events, error: eventsError } = await query
      .order("start_date", { ascending: true })
      .limit(limit * 3); // Fetch 3x the limit to ensure we have enough after sorting

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    // For each event, calculate if it should be trending based on both global and personal criteria
    const eventsWithTrending = [];

    for (const event of events || []) {
      let globalTrending = event.trending || false;
      let personalTrending = false;

      console.log(
        `Processing event ${
          event.id
        }: globalTrending=${globalTrending}, attendees=${JSON.stringify(
          event.attendees
        )}`
      );

      // Check personal trending: if user has friends attending
      if (event.attendees && event.attendees.length > 0) {
        // Get user's friends
        const { data: friendships, error: friendshipsError } =
          await supabaseClient
            .from("friendships")
            .select("requester_id, receiver_id")
            .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .eq("status", "friends");

        if (!friendshipsError && friendships) {
          // Get friend IDs
          const friendIds = friendships.map((f) =>
            f.requester_id === user.id ? f.receiver_id : f.requester_id
          );

          // Check if any friends are attending
          const friendsAttending = event.attendees.filter((attendeeId) =>
            friendIds.includes(attendeeId)
          );

          // Mark as personal trending if user has friends attending
          if (friendsAttending.length > 0) {
            personalTrending = true;
            console.log(
              `Event ${event.id} marked as personal trending - ${friendsAttending.length} friends attending`
            );
          }
        }
      }

      // Event is trending if EITHER global trending OR personal trending is true
      const isTrending = globalTrending || personalTrending;

      eventsWithTrending.push({
        id: event.id,
        trending: isTrending,
        global_trending: globalTrending,
        personal_trending: personalTrending,
        start_date: event.start_date,
      });
    }

    // Sort events: trending first, then by start date
    eventsWithTrending.sort((a, b) => {
      // First sort by trending status (trending events first)
      if (a.trending && !b.trending) return -1;
      if (!a.trending && b.trending) return 1;

      // Then sort by start date
      return (
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
    });

    // Apply cursor-based pagination
    let paginatedEvents = eventsWithTrending;

    if (cursor) {
      // Find the index of the cursor event
      const cursorIndex = eventsWithTrending.findIndex(
        (event) => event.id === cursor
      );
      if (cursorIndex !== -1) {
        // Start after the cursor event
        paginatedEvents = eventsWithTrending.slice(cursorIndex + 1);
      }
    }

    // Take only the requested number of events
    paginatedEvents = paginatedEvents.slice(0, limit);

    // Determine if there are more events
    const hasMore =
      eventsWithTrending.length >
      (cursor
        ? eventsWithTrending.findIndex((event) => event.id === cursor) +
          1 +
          limit
        : limit);

    // Get the last event ID for the next cursor
    const nextCursor =
      paginatedEvents.length > 0
        ? paginatedEvents[paginatedEvents.length - 1].id
        : null;

    // Extract IDs and trending info
    const eventData = paginatedEvents.map((event) => ({
      id: event.id,
      trending: event.trending,
      global_trending: event.global_trending,
      personal_trending: event.personal_trending,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        events: eventData,
        has_more: hasMore,
        next_cursor: nextCursor,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-trending-event-ids:", error);
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
