import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Genre keywords for music classification
const GENRE_KEYWORDS = {
  techno: ["techno", "minimal techno", "acid"],
  house: ["house", "tech house", "deep house", "progressive"],
  trance: ["trance", "uplifting trance"],
  edm: ["edm", "big room", "electro"],
  bass: ["dubstep", "dnb", "drum & bass", "drum and bass", "bass"],
  "hip-hop": ["hip hop", "hiphop", "rap", "trap"],
  latin: ["reggaeton", "latin", "salsa", "bachata"],
  afrobeats: ["afrobeats", "afro beats", "afrobeat"],
  pop: ["pop", "top 40", "top40", "mainstream"],
};

const BASE_URL = "https://dprtmnt.com";
const EVENTS_URL = `${BASE_URL}/events/`;

interface EventData {
  name: string;
  start_datetime: string;
  end_datetime: string;
  poster_image_url: string | null;
  ticket_url: string | null;
  genre: string | null;
  source_url: string;
  club_id?: string;
}

function inferGenre(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    for (const keyword of keywords.sort((a, b) => b.length - a.length)) {
      const regex = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );
      if (regex.test(lowerText)) {
        return genre;
      }
    }
  }
  return null;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MotivzBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return await response.text();
}

function parseHTML(html: string): EventData[] {
  const events: EventData[] = [];

  // Find all h2 tags with event names first
  const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
  let match;
  const eventNames: string[] = [];

  while ((match = h2Regex.exec(html)) !== null) {
    const name = match[1].trim();
    if (
      name &&
      !name.toUpperCase().includes("UPCOMING EVENTS") &&
      !name.toUpperCase().includes("VIEW ALL EVENTS") &&
      name.length > 3
    ) {
      // Filter out very short names that might be headers
      eventNames.push(name);
    }
  }

  console.log(`Found ${eventNames.length} event names:`, eventNames);

  // For each event name, find the complete container that includes both the name and ticket links
  for (const name of eventNames) {
    console.log(`Processing event: ${name}`);

    // Find the position of this event name in the HTML
    const nameIndex = html.indexOf(`<h2`);
    if (nameIndex === -1) continue;

    // Find the actual h2 tag that contains this name
    const h2Match = html
      .substring(nameIndex)
      .match(
        new RegExp(
          `<h2[^>]*>${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</h2>`,
          "i"
        )
      );
    if (!h2Match) continue;

    const actualNameIndex = html.indexOf(h2Match[0], nameIndex);

    // Get a larger context around the event name (3000 characters before and after)
    const contextStart = Math.max(0, actualNameIndex - 3000);
    const contextEnd = Math.min(html.length, actualNameIndex + 3000);
    const containerContent = html.substring(contextStart, contextEnd);

    // Look for ticket URLs in this container
    const ticketUrlRegex =
      /href="([^"]*(?:ticketweb\.|laylo\.|eventbrite\.|tickets|buy\.tablelist\.)[^"]*)"/i;
    const ticketUrlMatch = containerContent.match(ticketUrlRegex);
    const ticketUrl = ticketUrlMatch ? ticketUrlMatch[1] : null;

    console.log(`Found ticket URL for ${name}: ${ticketUrl}`);

    // Extract date from the container content
    const dateRegex =
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+[A-Za-z]+\s+\d{1,2}/i;
    const dateMatch = containerContent.match(dateRegex);

    let startDatetime: string | null = null;
    let endDatetime: string | null = null;

    if (dateMatch) {
      try {
        const dateStr = dateMatch[0];
        console.log(`Parsing date for ${name}: "${dateStr}"`);

        // Parse the date string (e.g., "Friday, October 24")
        // First try to parse with current year
        const currentYear = new Date().getFullYear();
        let parsedDate = new Date(`${dateStr} ${currentYear}`);

        // If that doesn't work, try with next year
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date(`${dateStr} ${currentYear + 1}`);
        }

        if (!isNaN(parsedDate.getTime())) {
          // If the parsed date is in the past, assume it's for next year
          const now = new Date();
          if (parsedDate < now) {
            parsedDate.setFullYear(parsedDate.getFullYear() + 1);
          }

          // Set default times: 10 PM start, 2 AM end
          const startDate = new Date(parsedDate);
          startDate.setHours(22, 0, 0, 0); // 10 PM

          const endDate = new Date(parsedDate);
          endDate.setDate(endDate.getDate() + 1);
          endDate.setHours(2, 0, 0, 0); // 2 AM next day

          startDatetime = startDate.toISOString();
          endDatetime = endDate.toISOString();

          console.log(
            `Parsed dates for ${name}: ${startDatetime} to ${endDatetime}`
          );
        } else {
          console.warn(`Could not parse date for ${name}: "${dateStr}"`);
        }
      } catch (error) {
        console.warn(`Failed to parse date for ${name}:`, error);
      }
    }

    // Infer genre from event name
    const genre = inferGenre(name);

    events.push({
      name,
      start_datetime: startDatetime || new Date().toISOString(),
      end_datetime:
        endDatetime || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      poster_image_url: null,
      ticket_url: ticketUrl,
      genre,
      source_url: EVENTS_URL,
    });
  }

  console.log(`Found ${events.length} events`);
  return events;
}

async function tryGetPosterImage(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MotivzBot/1.0)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Look for og:image meta tag
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogImageMatch) return ogImageMatch[1];

    // Look for twitter:image meta tag
    const twitterImageMatch = html.match(
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
    );
    if (twitterImageMatch) return twitterImageMatch[1];
  } catch (error) {
    console.warn(`Failed to fetch poster image from ${url}:`, error);
  }

  return null;
}

async function enrichWithPosters(events: EventData[]): Promise<EventData[]> {
  console.log(`Enriching ${events.length} events with poster images`);

  for (const event of events) {
    console.log(`Processing poster for: ${event.name}`);
    console.log(`Ticket URL: ${event.ticket_url}`);

    if (!event.poster_image_url && event.ticket_url) {
      const posterUrl = await tryGetPosterImage(event.ticket_url);
      event.poster_image_url = posterUrl;
      console.log(`Found poster for ${event.name}: ${posterUrl}`);

      // Add a small delay to be respectful to the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      console.log(
        `Skipping poster fetch for ${event.name} - no ticket URL or already has poster`
      );
    }
  }
  return events;
}

async function insertEvents(
  supabase: any,
  events: EventData[]
): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  for (const event of events) {
    try {
      // Check if event already exists (by name and start time)
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("title", event.name)
        .eq("start_date", event.start_datetime)
        .single();

      if (existing) {
        console.log(`Event already exists: ${event.name}`);
        continue;
      }

      // Insert new event
      const { error } = await supabase.from("events").insert({
        title: event.name,
        start_date: event.start_datetime,
        end_date: event.end_datetime,
        club_id: "ChIJB57NFAs1K4gRJOwDXvevCOY", // DPRTMNTS club ID
        poster_url:
          event.poster_image_url ||
          "https://via.placeholder.com/400x600/1a1a1a/ffffff?text=DPRTMNT+Event",
        ticket_url: event.ticket_url,
        source_url: event.source_url,
      });

      if (error) {
        errors.push(`Failed to insert ${event.name}: ${error.message}`);
      } else {
        inserted++;
        console.log(`Inserted event: ${event.name}`);
      }
    } catch (error) {
      errors.push(`Error processing ${event.name}: ${error.message}`);
    }
  }

  return { inserted, errors };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting DPRTMNTS events scraping...");

    // Fetch the events page
    const html = await fetchPage(EVENTS_URL);
    console.log("Fetched events page");

    // Parse events from HTML
    const events = parseHTML(html);
    console.log(`Found ${events.length} events`);

    // Enrich with poster images
    const enrichedEvents = await enrichWithPosters(events);
    console.log("Enriched events with poster images");

    // Insert events into database
    const result = await insertEvents(supabase, enrichedEvents);
    console.log(`Inserted ${result.inserted} events`);

    if (result.errors.length > 0) {
      console.warn("Errors encountered:", result.errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully scraped and processed ${events.length} events`,
        inserted: result.inserted,
        errors: result.errors,
        events: enrichedEvents,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error scraping DPRTMNTS events:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to scrape events",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
