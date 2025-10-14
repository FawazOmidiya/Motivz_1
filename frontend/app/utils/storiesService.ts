import { supabase } from "./supabaseService";
import * as types from "./types";

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "photo" | "video";
  thumbnail_url?: string;
  caption?: string;
  location?: string;
  visibility: "public" | "friends";
  club_id?: string;
  event_id?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  club?: {
    id: string;
    Name: string;
    Image?: string;
  };
  event?: {
    id: string;
    title: string;
    start_date: string;
  };
}

export interface CreateStoryParams {
  userId: string;
  mediaUrl: string;
  mediaType: "photo" | "video";
  caption?: string;
  location?: string;
  thumbnailUrl?: string;
  visibility: "public" | "friends";
  clubId?: string;
  eventId?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
}

export async function createStory(
  params: CreateStoryParams
): Promise<Story | null> {
  try {
    const {
      userId,
      mediaUrl,
      mediaType,
      caption,
      location,
      thumbnailUrl,
      visibility,
      clubId,
      eventId,
      locationName,
      latitude,
      longitude,
    } = params;

    // Stories expire after 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        user_id: userId,
        media_url: mediaUrl,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl,
        caption,
        location,
        visibility,
        club_id: clubId,
        event_id: eventId,
        location_name: locationName,
        latitude,
        longitude,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return story;
  } catch (error) {
    console.error("Error creating story:", error);
    return null;
  }
}

export async function getUserStories(userId: string): Promise<Story[]> {
  try {
    const { data: stories, error } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return stories || [];
  } catch (error) {
    console.error("Error fetching user stories:", error);
    return [];
  }
}

export async function getAllActiveStories(): Promise<Story[]> {
  try {
    const { data: stories, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        user:user_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        club:club_id (
          id,
          Name,
          Image
        ),
        event:event_id (
          id,
          title,
          start_date
        )
      `
      )
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return stories || [];
  } catch (error) {
    console.error("Error fetching all stories:", error);
    return [];
  }
}

export async function getClubStories(
  clubId: string,
  userId?: string
): Promise<Story[]> {
  try {
    const { data: stories, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        user:user_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        club:club_id (
          id,
          Name,
          Image
        ),
        event:event_id (
          id,
          title,
          start_date
        )
      `
      )
      .eq("club_id", clubId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return stories || [];
  } catch (error) {
    console.error("Error fetching club stories:", error);
    return [];
  }
}

export async function getEventStories(
  eventId: string,
  userId?: string
): Promise<Story[]> {
  try {
    const { data: stories, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        user:user_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        club:club_id (
          id,
          Name,
          Image
        ),
        event:event_id (
          id,
          title,
          start_date
        )
      `
      )
      .eq("event_id", eventId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return stories || [];
  } catch (error) {
    console.error("Error fetching event stories:", error);
    return [];
  }
}

export async function getFriendsStories(userId: string): Promise<Story[]> {
  try {
    const { data: stories, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        user:user_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        club:club_id (
          id,
          Name,
          Image
        ),
        event:event_id (
          id,
          title,
          start_date
        )
      `
      )
      .eq("visibility", "friends")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return stories || [];
  } catch (error) {
    console.error("Error fetching friends stories:", error);
    return [];
  }
}

export async function deleteStory(
  storyId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", storyId)
      .eq("user_id", userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error deleting story:", error);
    return false;
  }
}

export async function uploadStoryMedia(
  userId: string,
  fileUri: string,
  mediaType: "photo" | "video",
  storyId: string
): Promise<string | null> {
  try {
    // Generate unique filename (same pattern as posts)
    const timestamp = Date.now();
    const ext = mediaType === "photo" ? "jpg" : "mp4";
    const fileName = `story_${timestamp}.${ext}`;

    // Create storage path (exact same pattern as posts)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const storagePath = `${userId}/${year}/${month}/${day}/${storyId}/original/${fileName}`;

    // Upload file to Supabase storage (React Native way)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("posts")
      .upload(storagePath, fileUri, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL (exact same as posts)
    const {
      data: { publicUrl },
    } = supabase.storage.from("posts").getPublicUrl(storagePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading story media:", error);
    return null;
  }
}
