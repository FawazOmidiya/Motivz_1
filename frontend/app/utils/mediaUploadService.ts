import { supabase } from "./supabaseService";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";

export interface MediaUploadOptions {
  userId: string;
  fileUri: string;
  mediaType: "photo" | "video";
  storagePath: string;
  compressImage?: boolean;
  compressionQuality?: number;
}

export interface MediaUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Standardized media upload service following ProfileSettings pattern
 * Handles both photos and videos with proper compression and ArrayBuffer conversion
 */
export async function uploadMedia({
  userId,
  fileUri,
  mediaType,
  storagePath,
  compressImage = true,
  compressionQuality = 0.7,
}: MediaUploadOptions): Promise<MediaUploadResult> {
  try {
    console.log(`📤 Starting ${mediaType} upload...`);

    let processedUri = fileUri;
    let buffer: ArrayBuffer;

    if (mediaType === "photo") {
      console.log("📸 Processing photo...");

      if (compressImage) {
        // Compress image using ImageManipulator
        const manipulated = await ImageManipulator.manipulateAsync(
          fileUri,
          [],
          {
            compress: compressionQuality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        processedUri = manipulated.uri;
        console.log("✅ Image compressed");
      }

      // Convert to base64 then to ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      buffer = decode(base64);
      console.log("📁 Image converted to ArrayBuffer");
    } else {
      console.log("🎥 Processing video...");

      // For videos, read as binary data
      const binaryData = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      buffer = decode(binaryData);
      console.log("📁 Video converted to ArrayBuffer");
    }

    // Upload using ArrayBuffer
    console.log("☁️ Uploading to Supabase storage...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("posts")
      .upload(storagePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: mediaType === "photo" ? "image/jpeg" : "video/mp4",
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return {
        success: false,
        error: uploadError.message,
      };
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("posts").getPublicUrl(storagePath);

    console.log("✅ Media uploaded successfully:", publicUrl);

    return {
      success: true,
      publicUrl,
    };
  } catch (error) {
    console.error("💥 Media upload failed:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Generate storage path for media files
 * Format: userId/year/month/day/entityId/original/filename
 */
export function generateStoragePath(
  userId: string,
  entityId: string,
  fileName: string,
  entityType: "post" | "story" = "post"
): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${userId}/${year}/${month}/${day}/${entityId}/original/${fileName}`;
}

/**
 * Generate filename for media files
 */
export function generateFileName(
  mediaType: "photo" | "video",
  entityType: "post" | "story" = "post"
): string {
  const timestamp = Date.now();
  const ext = mediaType === "photo" ? "jpg" : "mp4";
  return `${entityType}_${timestamp}.${ext}`;
}
