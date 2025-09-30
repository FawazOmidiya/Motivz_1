import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  title: string;
  body: string;
  userId?: string;
  sendToAll: boolean;
}

interface ExpoMessage {
  to: string | string[];
  title: string;
  body: string;
  sound?: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { title, body, userId, sendToAll }: NotificationRequest =
      await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "Title and body are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let users;

    if (sendToAll) {
      // Get all users with push tokens (check both fields for backward compatibility)
      const { data: allUsers, error: usersError } = await supabaseClient
        .from("profiles")
        .select("expo_push_token, push_token")
        .or("expo_push_token.not.is.null, push_token.not.is.null")
        .or("expo_push_token.neq., push_token.neq.");

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      if (!allUsers || allUsers.length === 0) {
        return new Response(
          JSON.stringify({ error: "No users with push tokens found" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      users = allUsers;
    } else {
      // Get specific user
      if (!userId) {
        return new Response(
          JSON.stringify({
            error: "User ID is required for specific notifications",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: user, error: userError } = await supabaseClient
        .from("profiles")
        .select("expo_push_token, push_token")
        .eq("id", userId)
        .or("expo_push_token.not.is.null, push_token.not.is.null")
        .or("expo_push_token.neq., push_token.neq.")
        .single();

      if (userError) {
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      if (!user) {
        return new Response(
          JSON.stringify({
            error: "User not found or no push token available",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      users = [user];
    }

    const tokens = users
      .map((u: any) => u.expo_push_token || u.push_token)
      .filter(Boolean);
    console.log("Push tokens found:", tokens.length);
    console.log("Tokens:", tokens);

    // Log the actual token format for debugging
    for (const token of tokens) {
      console.log("Token format check:", {
        token: token,
        startsWithExponent: token.startsWith("ExponentPushToken["),
        endsWithBracket: token.endsWith("]"),
        length: token.length,
      });
    }

    // Validate token format as per Expo docs
    for (const token of tokens) {
      if (!token.startsWith("ExponentPushToken[") || !token.endsWith("]")) {
        console.error("Invalid push token format:", token);
      } else {
        console.log("Valid push token format:", token);
      }
    }

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid push tokens found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create messages for Expo Push Service (matching working function structure)
    const messages: ExpoMessage[] = tokens.map((token: string) => ({
      to: token,
      sound: "default",
      body: body,
    }));

    // Send in chunks of 100 (Expo limit)
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    let totalSent = 0;
    const results = [];

    // Send notifications to Expo Push Service
    for (const chunk of chunks) {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}`,
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to send notifications: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log(
        "Expo Push Service response:",
        JSON.stringify(result, null, 2)
      );
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Check for push receipt errors as recommended by Expo docs
      if (result.data) {
        console.log("Push tickets received:", result.data.length);
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i];
          console.log(`Ticket ${i}:`, {
            status: ticket.status,
            id: ticket.id,
            message: ticket.message,
            details: ticket.details,
          });

          if (ticket.status === "error") {
            console.error("Push ticket error:", ticket);
          } else {
            console.log("Push ticket success:", ticket);
          }
        }
      }

      if (result.errors) {
        console.error("Expo Push Service errors:", result.errors);
      }

      results.push(result);
      totalSent += result.data?.length || 0;
    }

    // Log the notification in the database
    try {
      await supabaseClient.from("notifications_log").insert({
        notification_type: sendToAll ? "admin_broadcast" : "admin_specific",
        user_count: totalSent,
        message: body,
        sent_at: new Date().toISOString(),
        status: "sent",
        expo_response: JSON.stringify(results),
      });
    } catch (logError) {
      console.warn("Could not log notification:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully sent notification to ${totalSent} ${
          sendToAll ? "users" : "user"
        }`,
        totalSent,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send notification",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
