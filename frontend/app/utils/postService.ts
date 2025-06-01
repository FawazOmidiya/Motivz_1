import { supabase } from "./supabaseService";
import * as types from "./types";
import { v4 as uuidv4 } from "uuid";
export async function uploadPost(
  userId: string,
  clubId: string | null,
  mediaType: "photo" | "video",
  file: File,
  caption?: string,
  location?: string
): Promise<types.Post | null> {
  try {
    // Generate a unique post ID
    const postId = uuidv4();
    // Create the storage path
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const storagePath = `posts/${userId}/${year}/${month}/${day}/${postId}/original/${file.name}`;

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("posts")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("posts").getPublicUrl(storagePath);

    // Create thumbnail for photos
    let thumbnailUrl = null;
    if (mediaType === "photo") {
      // TODO: Implement thumbnail generation
      // For now, use the same image
      thumbnailUrl = publicUrl;
    }

    // Create the post record
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        id: postId,
        user_id: userId,
        club_id: clubId,
        media_type: mediaType,
        media_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        caption,
        location,
      })
      .select()
      .single();

    if (postError) throw postError;

    return post;
  } catch (error) {
    console.error("Error uploading post:", error);
    return null;
  }
}

export async function getPosts(
  userId?: string,
  clubId?: string,
  page = 1,
  pageSize = 10
): Promise<types.Post[]> {
  try {
    let query = supabase
      .from("posts")
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
        )
      `
      )
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (clubId) {
      query = query.eq("club_id", clubId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export async function likePost(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error liking post:", error);
    return false;
  }
}

export async function unlikePost(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .match({ post_id: postId, user_id: userId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error unliking post:", error);
    return false;
  }
}

export async function addComment(
  postId: string,
  userId: string,
  content: string
): Promise<types.PostComment | null> {
  try {
    const { data, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: userId,
        content,
      })
      .select(
        `
        *,
        user:user_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding comment:", error);
    return null;
  }
}

export async function deletePost(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    // 1. Fetch the post to get the media_url
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("media_url")
      .eq("id", postId)
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;
    if (!post) throw new Error("Post not found");

    // 2. Parse the storage path from the media_url
    // Example: https://<project>.supabase.co/storage/v1/object/public/posts/<path>
    const url = post.media_url as string;
    const match = url.match(/storage\/v1\/object\/public\/posts\/(.*)$/);
    if (!match) throw new Error("Could not parse storage path from media_url");
    const storagePath = match[1];

    // 3. Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from("posts")
      .remove([storagePath]);
    if (storageError) throw storageError;

    // 4. Delete the post from the database
    const { error } = await supabase
      .from("posts")
      .delete()
      .match({ id: postId, user_id: userId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}

export async function fetchUserPosts(userId: string): Promise<types.Post[]> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
}
