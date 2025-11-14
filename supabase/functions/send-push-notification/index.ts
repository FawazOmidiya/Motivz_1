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
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    const { title, body, userId, sendToAll, deepLink } = requestBody;
    if (!title || !body) {
      return new Response(
        JSON.stringify({
          error: "Title and body are required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    let users;
    if (sendToAll) {
      console.log("=== Sending to all users ===");
      // Get all users with push tokens
      const { data: allUsers, error: usersError } = await supabaseClient
        .from("profiles")
        .select("push_token")
        .not("push_token", "is", null)
        .neq("push_token", "");
      console.log("Users query result:", {
        allUsers,
        usersError,
      });
      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }
      if (!allUsers || allUsers.length === 0) {
        return new Response(
          JSON.stringify({
            error: "No users with push tokens found",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
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
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      const { data: user, error: userError } = await supabaseClient
        .from("profiles")
        .select("push_token")
        .eq("id", userId)
        .not("push_token", "is", null)
        .neq("push_token", "")
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
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      users = [user];
    }
    // Filter out invalid tokens (permission denied, errors, etc.)
    const validTokens = users
      .map((u) => u.push_token)
      .filter((token) => {
        if (!token) return false;
        // Check if it's a valid Expo push token format
        const isValidToken =
          token.startsWith("ExponentPushToken[") && token.endsWith("]");
        if (!isValidToken) {
          console.log("Filtering out invalid token:", token);
        }
        return isValidToken;
      });
    console.log("Total users fetched:", users.length);
    console.log("Valid push tokens found:", validTokens.length);
    console.log("Valid tokens:", validTokens);
    if (validTokens.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No valid push tokens found",
          details:
            "All users either have notifications disabled or invalid tokens",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Create messages for Expo Push Service
    // Include deepLink in data field if provided
    const messages = validTokens.map((token) => ({
      to: token,
      title: title,
      sound: "default",
      body: body,
      data: deepLink ? { url: deepLink } : {},
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
      const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
      console.log("Expo Access Token available:", !!expoAccessToken);
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
      };
      if (expoAccessToken) {
        headers["Authorization"] = `Bearer ${expoAccessToken}`;
        console.log("Using Expo Access Token for authentication");
      } else {
        console.log(
          "No Expo Access Token found, using unauthenticated request"
        );
      }
      // Use the correct Expo API endpoint
      const apiUrl = "https://exp.host/--/api/v2/push/send";
    
      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send notification",
        details: error instanceof Error ? error.message : "Unknown error",
        type: typeof error,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
