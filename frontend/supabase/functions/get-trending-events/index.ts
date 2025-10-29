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
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const cursor = url.searchParams.get("cursor"); // Event ID to start after
    const now = new Date().toISOString();

    console.log(
      `🔍 get-trending-events called with: limit=${limit}, cursor=${cursor}, user=${user.id}`
    );

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
    let query = supabaseClient.from("events").select("*").gt("end_date", now);

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

    // Apply cursor-based pagination
    if (cursor) {
      query = query.gt("id", cursor);
      console.log(`📄 Applied cursor filter: id > ${cursor}`);
    }

    // Get events with proper ordering
    const { data: events, error: eventsError } = await query
      .order("start_date", { ascending: true }) // Order by start date first
      .limit(limit * 2); // Get more events to account for sorting

    console.log(`📊 Raw query returned ${events?.length || 0} events`);
    if (events && events.length > 0) {
      console.log(`📋 Event IDs: ${events.map((e) => e.id).join(", ")}`);
    }

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    // For each event, calculate trending status
    const eventsWithTrending = [];

    for (const event of events || []) {
      let globalTrending = event.trending || false;
      let personalTrending = false;

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
          }
        }
      }

      // Event is trending if EITHER global trending OR personal trending is true
      const isTrending = globalTrending || personalTrending;

      eventsWithTrending.push({
        ...event,
        trending: isTrending,
        global_trending: globalTrending,
        personal_trending: personalTrending,
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

    console.log(`🔄 After sorting: ${eventsWithTrending.length} events`);
    console.log(
      `📋 Sorted Event IDs: ${eventsWithTrending.map((e) => e.id).join(", ")}`
    );
    console.log(
      `🔥 Trending events: ${eventsWithTrending
        .filter((e) => e.trending)
        .map((e) => e.id)
        .join(", ")}`
    );

    // Take only the requested number of events (cursor pagination already applied in query)
    const paginatedEvents = eventsWithTrending.slice(0, limit);

    // Determine if there are more events
    // We have more if we got the full limit from our query AND there might be more in the database
    const hasMore =
      events.length === limit * 2 && paginatedEvents.length === limit;
    const nextCursor =
      paginatedEvents.length > 0
        ? paginatedEvents[paginatedEvents.length - 1].id
        : null;

    console.log(
      `📄 Final pagination: hasMore=${hasMore}, nextCursor=${nextCursor}`
    );
    console.log(
      `📋 Final Event IDs: ${paginatedEvents.map((e) => e.id).join(", ")}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        events: paginatedEvents,
        has_more: hasMore,
        next_cursor: nextCursor,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-trending-events:", error);
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
