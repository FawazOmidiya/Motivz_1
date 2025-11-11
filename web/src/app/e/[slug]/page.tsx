import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { extractEventIdFromSlug } from "@/lib/eventSlug";
import { getAbsoluteImageUrl } from "@/lib/imageUrl";

// Replace with your actual domain
const MOTIVZ_DOMAIN = "themotivz.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "[EventPage] Missing Supabase environment variables. SUPABASE_URL:",
    !!SUPABASE_URL,
    "SUPABASE_ANON_KEY:",
    !!SUPABASE_ANON_KEY
  );
}

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

interface Event {
  id: string;
  slug: string;
  title: string;
  caption?: string;
  image_url?: string;
  poster_url?: string;
  starts_at?: string;
  start_date?: string;
}

async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    if (!supabase) {
      console.error("[getEventBySlug] Supabase client not initialized");
      return null;
    }


    // Slug format: {id}-{title-slug} (where id can be a UUID)
    // Extract ID from slug if possible
    const eventId = extractEventIdFromSlug(slug);

    console.log(
      `[getEventBySlug] Looking up event with slug: ${slug}, extracted ID: ${eventId}`
    );

    // Try multiple strategies in order:
    // 1. Exact slug match (preferred)
    const { data: slugData, error: slugError } = await supabase
      .from("events")
      .select(
        "id, slug, title, caption, image_url, poster_url, starts_at, start_date"
      )
      .eq("slug", slug)
      .single();

    if (!slugError && slugData) {
      console.log(`Found event by exact slug match: ${slugData.id}`);
      return slugData;
    }

    // 2. ID match (if we extracted an ID from slug)
    if (eventId) {
      const { data: idData, error: idError } = await supabase
        .from("events")
        .select(
          "id, slug, title, caption, image_url, poster_url, starts_at, start_date"
        )
        .eq("id", eventId)
        .single();

      if (!idError && idData) {
        console.log(`Found event by ID match: ${idData.id}`);
        return idData;
      } else {
        console.log(`No event found with ID: ${eventId}, error:`, idError);
      }
    }

    // 3. Fallback: treat slug as ID (for backward compatibility)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("events")
      .select(
        "id, slug, title, caption, image_url, poster_url, starts_at, start_date"
      )
      .eq("id", slug)
      .single();

    if (!fallbackError && fallbackData) {
      console.log(`Found event by slug-as-ID fallback: ${fallbackData.id}`);
      return fallbackData;
    }

    console.log(`No event found for slug: ${slug}`);
    return null;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return {
      title: "Event Not Found",
    };
  }

  const canonicalUrl = `https://${MOTIVZ_DOMAIN}/e/${slug}`;

  // Use image_url or poster_url, ensure it's absolute
  const imageUrl = event.image_url || event.poster_url || "";
  const absoluteImageUrl = getAbsoluteImageUrl(imageUrl, MOTIVZ_DOMAIN);

  // Debug logging (remove in production if needed)
  if (!absoluteImageUrl) {
    console.warn(
      `No image URL found for event ${event.id}. image_url: ${event.image_url}, poster_url: ${event.poster_url}`
    );
  } else {
    console.log(`OG Image URL for event ${event.id}: ${absoluteImageUrl}`);
  }

  return {
    title: event.title,
    description: event.caption || "See this event on Motivz",
    openGraph: {
      title: event.title,
      description: event.caption || "See this event on Motivz",
      url: canonicalUrl,
      siteName: "Motivz",
      images: absoluteImageUrl
        ? [
            {
              url: absoluteImageUrl,
              width: 1200,
              height: 630,
              alt: event.title,
            },
          ]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.caption || "See this event on Motivz",
      images: absoluteImageUrl ? [absoluteImageUrl] : [],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Debug: Log the slug being requested
  console.log(`[EventPage] Requested slug: ${slug}`);

  const event = await getEventBySlug(slug);

  if (!event) {
    console.error(`[EventPage] Event not found for slug: ${slug}`);
    notFound();
  }

  console.log(`[EventPage] Found event: ${event.id}, title: ${event.title}`);

  const imageUrl = event.image_url || event.poster_url;
  const deepLinkUrl = `motivz://e/${slug}`;
  const absoluteImageUrl = getAbsoluteImageUrl(imageUrl, MOTIVZ_DOMAIN);

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#000",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          padding: "20px",
          textAlign: "center",
        }}
      >
        {absoluteImageUrl && (
          <div style={{ marginBottom: "32px" }}>
            <Image
              src={absoluteImageUrl}
              alt={event.title}
              width={800}
              height={600}
              style={{
                width: "100%",
                maxWidth: "800px",
                height: "auto",
                borderRadius: "16px",
                objectFit: "cover",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              }}
              priority
              unoptimized
            />
          </div>
        )}

        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            marginBottom: "16px",
            color: "#fff",
          }}
        >
          {event.title}
        </h1>

        {event.caption && (
          <p
            style={{
              fontSize: "18px",
              lineHeight: "1.6",
              marginBottom: "32px",
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            {event.caption}
          </p>
        )}

        <a
          href={deepLinkUrl}
          style={{
            display: "inline-block",
            backgroundColor: "#8B5CF6",
            color: "#fff",
            padding: "16px 32px",
            borderRadius: "12px",
            textDecoration: "none",
            fontSize: "18px",
            fontWeight: "600",
            transition: "background-color 0.2s",
          }}
        >
          Open in Motivz
        </a>

        <p
          style={{
            marginTop: "24px",
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          Don&apos;t have the app?{" "}
          <a
            href="https://apps.apple.com/app/motivz"
            style={{ color: "#8B5CF6", textDecoration: "underline" }}
          >
            Download Motivz
          </a>
        </p>
      </div>
    </div>
  );
}
