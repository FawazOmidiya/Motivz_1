import { supabase } from "./supabaseService";

export interface EventClickData {
  event_id: string;
  user_id: string;
  click_type: "view" | "share" | "ticket_purchase" | "guestlist_request";
  source_screen: string;
  timestamp: string;
  metadata?: {
    club_id?: string;
    event_title?: string;
    user_location?: string;
  };
}

export interface EventAnalytics {
  event_id: string;
  total_views: number;
  total_shares: number;
  total_ticket_purchases: number;
  total_guestlist_requests: number;
  unique_users: number;
  views_by_date: Array<{ date: string; count: number }>;
  top_sources: Array<{ source: string; count: number }>;
}

/**
 * Track when a user clicks on an event
 */
export async function trackEventClick(
  eventId: string,
  userId: string,
  clickType: EventClickData["click_type"],
  sourceScreen: string,
  metadata?: EventClickData["metadata"]
): Promise<{ success: boolean; error?: string }> {
  try {
    const clickData: EventClickData = {
      event_id: eventId,
      user_id: userId,
      click_type: clickType,
      source_screen: sourceScreen,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    const { error } = await supabase.from("event_analytics").insert(clickData);

    if (error) {
      console.error("Error tracking event click:", error);
      return { success: false, error: error.message };
    }

    console.log("Event click tracked successfully:", clickData);
    return { success: true };
  } catch (error) {
    console.error("Error tracking event click:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get analytics for a specific event
 */
export async function getEventAnalytics(
  eventId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: EventAnalytics | null; error?: string }> {
  try {
    let query = supabase
      .from("event_analytics")
      .select("*")
      .eq("event_id", eventId);

    if (startDate) {
      query = query.gte("timestamp", startDate);
    }
    if (endDate) {
      query = query.lte("timestamp", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching event analytics:", error);
      return { data: null, error: error.message };
    }

    // Process the raw data into analytics
    const analytics = processEventAnalytics(data || []);
    return { data: analytics };
  } catch (error) {
    console.error("Error fetching event analytics:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get analytics for a club's events
 */
export async function getClubEventAnalytics(
  clubId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: EventAnalytics[]; error?: string }> {
  try {
    // First get all events for this club
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id")
      .eq("club_id", clubId);

    if (eventsError) {
      return { data: [], error: eventsError.message };
    }

    const eventIds = events?.map((event) => event.id) || [];

    if (eventIds.length === 0) {
      return { data: [] };
    }

    // Get analytics for all club events
    let query = supabase
      .from("event_analytics")
      .select("*")
      .in("event_id", eventIds);

    if (startDate) {
      query = query.gte("timestamp", startDate);
    }
    if (endDate) {
      query = query.lte("timestamp", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching club analytics:", error);
      return { data: [], error: error.message };
    }

    // Group by event and process
    const analyticsByEvent = new Map<string, EventAnalytics>();

    (data || []).forEach((click) => {
      if (!analyticsByEvent.has(click.event_id)) {
        analyticsByEvent.set(click.event_id, {
          event_id: click.event_id,
          total_views: 0,
          total_shares: 0,
          total_ticket_purchases: 0,
          total_guestlist_requests: 0,
          unique_users: 0,
          views_by_date: [],
          top_sources: [],
        });
      }

      const analytics = analyticsByEvent.get(click.event_id)!;

      // Count different types of interactions
      switch (click.click_type) {
        case "view":
          analytics.total_views++;
          break;
        case "share":
          analytics.total_shares++;
          break;
        case "ticket_purchase":
          analytics.total_ticket_purchases++;
          break;
        case "guestlist_request":
          analytics.total_guestlist_requests++;
          break;
      }
    });

    return { data: Array.from(analyticsByEvent.values()) };
  } catch (error) {
    console.error("Error fetching club analytics:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process raw analytics data into structured format
 */
function processEventAnalytics(rawData: any[]): EventAnalytics {
  const eventId = rawData[0]?.event_id;
  const uniqueUsers = new Set(rawData.map((click) => click.user_id));

  const analytics: EventAnalytics = {
    event_id: eventId,
    total_views: 0,
    total_shares: 0,
    total_ticket_purchases: 0,
    total_guestlist_requests: 0,
    unique_users: uniqueUsers.size,
    views_by_date: [],
    top_sources: [],
  };

  // Count interactions by type
  rawData.forEach((click) => {
    switch (click.click_type) {
      case "view":
        analytics.total_views++;
        break;
      case "share":
        analytics.total_shares++;
        break;
      case "ticket_purchase":
        analytics.total_ticket_purchases++;
        break;
      case "guestlist_request":
        analytics.total_guestlist_requests++;
        break;
    }
  });

  // Group by date
  const viewsByDate = new Map<string, number>();
  rawData
    .filter((click) => click.click_type === "view")
    .forEach((click) => {
      const date = click.timestamp.split("T")[0];
      viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1);
    });

  analytics.views_by_date = Array.from(viewsByDate.entries()).map(
    ([date, count]) => ({
      date,
      count,
    })
  );

  // Group by source screen
  const sources = new Map<string, number>();
  rawData.forEach((click) => {
    const source = click.source_screen;
    sources.set(source, (sources.get(source) || 0) + 1);
  });

  analytics.top_sources = Array.from(sources.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return analytics;
}
