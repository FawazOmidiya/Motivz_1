/**
 * Utility functions for generating and parsing event slugs
 * Slug format: {id}-{title-slug}
 * Example: "abc123-friday-night-vibes"
 */

/**
 * Generate a slug from event ID and title
 * Ensures uniqueness by including the event ID
 */
export function generateEventSlug(id: string, title: string): string {
  // Slugify the title: lowercase, replace non-alphanumeric with hyphens
  const titleSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // Combine: {id}-{title-slug}
  return `${id}-${titleSlug}`;
}

/**
 * Extract event ID from a slug
 * Returns the ID if found, null otherwise
 * Handles UUIDs (36 chars with hyphens) and regular IDs
 */
export function extractEventIdFromSlug(slug: string): string | null {
  if (!slug.includes("-")) {
    // No hyphen, might be just an ID
    return slug.length >= 8 ? slug : null;
  }

  // Check if it starts with a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  // UUIDs are 36 characters: 8-4-4-4-12
  const uuidPattern =
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const uuidMatch = slug.match(uuidPattern);

  if (uuidMatch) {
    // Found a UUID at the start
    const uuid = uuidMatch[1];
    // Check if there's more after the UUID (title slug)
    if (slug.length > uuid.length && slug[uuid.length] === "-") {
      return uuid;
    }
    // If slug is exactly the UUID, return it
    if (slug.length === uuid.length) {
      return uuid;
    }
  }

  // Fallback: try to extract ID from first part (for non-UUID IDs)
  const parts = slug.split("-");
  const firstPart = parts[0];

  // If first part looks like an ID (long alphanumeric), return it
  // UUIDs are 36 chars, but we'll accept anything >= 8 chars as potential ID
  if (firstPart.length >= 8 && /^[a-zA-Z0-9]+$/.test(firstPart)) {
    return firstPart;
  }

  return null;
}

/**
 * Check if a slug matches the expected format: {id}-{title-slug}
 */
export function isValidEventSlug(slug: string): boolean {
  if (!slug.includes("-")) {
    return false;
  }

  const id = extractEventIdFromSlug(slug);
  return id !== null && id.length >= 8;
}
