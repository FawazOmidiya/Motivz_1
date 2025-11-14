import Share from "react-native-share";
import { supabase } from "./supabaseService";

// Replace with your actual domain
const MOTIVZ_DOMAIN = "themotivz.com";

interface ShareEventParams {
  slug: string;
  title: string;
  caption?: string;
  imageUrl?: string;
  eventId?: string; // Event ID for incrementing share count
}

/**
 * Share an event with poster image (Instagram-style)
 * Shares the image as the primary content, with the URL for deep linking
 */
export async function shareEvent({
  slug,
  title,
  caption,
  imageUrl,
  eventId,
}: ShareEventParams): Promise<void> {
  try {
    const universalLink = `https://${MOTIVZ_DOMAIN}/e/${slug}`;

    // If we have an image URL, share it like Instagram (image as primary content)
    if (imageUrl) {
      await Share.open({
        url: imageUrl, // Share the image
        message: `Check out this event:\n ${title}${
          caption ? `\n\n${caption}` : ""
        }\n\n👥 See which friends are going\n🎉 Discover your Vibe\n\n${universalLink}`, // Include title, caption, and call-to-action
        title: title,
        failOnCancel: false,
      });
    } else {
      // Fallback: share just the URL for iMessage rich previews
      // iMessage will automatically fetch Open Graph tags and create the preview
      await Share.open({
        url: universalLink,
        failOnCancel: false,
      });
    }

    // Increment share count if eventId is provided
    if (eventId) {
      try {
        const { error } = await supabase.rpc("increment_share_count", {
          event_id: eventId,
        });
        if (error) {
          console.error("Error incrementing share count:", error);
        }
      } catch (error) {
        console.error("Error calling increment_share_count:", error);
      }
    }
  } catch (error: any) {
    // User cancelled or error occurred
    if (error?.message !== "User did not share") {
      console.error("Error sharing event:", error);
    }
  }
}
