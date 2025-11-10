/**
 * Converts an image URL to an absolute URL for Open Graph tags
 * Handles various URL formats including Supabase Storage URLs
 */
export function getAbsoluteImageUrl(
  imageUrl: string | null | undefined,
  domain: string
): string {
  if (!imageUrl) {
    return "";
  }

  // Already absolute URL
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Relative path from root
  if (imageUrl.startsWith("/")) {
    return `https://${domain}${imageUrl}`;
  }

  // Supabase Storage URL - ensure it's https
  if (imageUrl.includes("supabase.co") || imageUrl.includes("supabase")) {
    return imageUrl.startsWith("http")
      ? imageUrl
      : `https://${imageUrl.replace(/^https?:\/\//, "")}`;
  }

  // Assume it's a relative path
  return `https://${domain}/${imageUrl}`;
}
