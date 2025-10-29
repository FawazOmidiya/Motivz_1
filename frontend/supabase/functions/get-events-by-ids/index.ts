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

    // Parse request body
    const { event_ids } = await req.json();

    if (!event_ids || !Array.isArray(event_ids) || event_ids.length === 0) {
      throw new Error("event_ids array is required");
    }

    // Limit the number of events to prevent large requests
    const limitedIds = event_ids.slice(0, 20);

    // Fetch full event details
    const { data: events, error: eventsError } = await supabaseClient
      .from("events")
      .select("*")
      .in("id", limitedIds);

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    // Return events in the same order as requested IDs
    const orderedEvents = limitedIds
      .map((id) => events?.find((event) => event.id === id))
      .filter(Boolean);

    return new Response(
      JSON.stringify({
        success: true,
        events: orderedEvents,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-events-by-ids:", error);
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
