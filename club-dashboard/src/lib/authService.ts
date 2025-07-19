import { supabase } from "./supabase";

export interface ClubAuth {
  id: string;
  club_id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
}

export interface ClubInfo {
  id: string;
  name: string;
  email: string;
}

// Simple password hashing (in production, use bcrypt or similar)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

export class AuthService {
  static async login(
    emailOrClubId: string,
    password: string
  ): Promise<ClubInfo | null> {
    try {
      // First, get the club auth record - try by email first, then by club_id
      let { data: authData, error: authError } = await supabase
        .from("club_auth")
        .select("*")
        .eq("email", emailOrClubId)
        .eq("is_active", "TRUE")
        .single();

      // If not found by email, try by club_id
      if (authError || !authData) {
        const { data: authDataById, error: authErrorById } = await supabase
          .from("club_auth")
          .select("*")
          .eq("club_id", emailOrClubId)
          .eq("is_active", "TRUE")
          .single();

        authData = authDataById;
        authError = authErrorById;
      }

      // Check if the record is active
      if (authData && !authData.is_active) {
        return null;
      }

      if (authError || !authData) {
        return null;
      }

      // Verify password
      const isValidPassword = await verifyPassword(
        password,
        authData.password_hash
      );
      if (!isValidPassword) {
        return null;
      }

      // Get club information
      const { data: clubData, error: clubError } = await supabase
        .from("Clubs")
        .select('id, "Name"')
        .eq("id", authData.club_id)
        .single();

      if (clubError || !clubData) {
        return null;
      }

      // Update last login
      await supabase
        .from("club_auth")
        .update({ last_login: new Date().toISOString() })
        .eq("id", authData.id);

      return {
        id: clubData.id,
        name: clubData.Name,
        email: authData.email,
      };
    } catch (error) {
      return null;
    }
  }

  static async changePassword(
    clubId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      // Get current auth record
      const { data: authData, error: authError } = await supabase
        .from("club_auth")
        .select("*")
        .eq("club_id", clubId)
        .eq("is_active", true)
        .single();

      if (authError || !authData) {
        return false;
      }

      // Verify current password
      const isValidCurrentPassword = await verifyPassword(
        currentPassword,
        authData.password_hash
      );
      if (!isValidCurrentPassword) {
        return false;
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      const { error: updateError } = await supabase
        .from("club_auth")
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.id);

      return !updateError;
    } catch (error) {
      console.error("Change password error:", error);
      return false;
    }
  }

  static async resetPassword(email: string): Promise<boolean> {
    try {
      // Check if email exists
      const { data: authData, error: authError } = await supabase
        .from("club_auth")
        .select("club_id")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (authError || !authData) {
        return false;
      }

      // In a real application, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send an email with the reset link
      // 4. Create a reset password page

      // For now, we'll just return true if email exists
      return true;
    } catch (error) {
      console.error("Reset password error:", error);
      return false;
    }
  }

  static async createClubAuth(
    clubId: string,
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      const passwordHash = await hashPassword(password);

      const { error } = await supabase.from("club_auth").insert({
        club_id: clubId,
        email: email,
        password_hash: passwordHash,
      });

      return !error;
    } catch (error) {
      console.error("Create club auth error:", error);
      return false;
    }
  }

  static async validatePassword(
    password: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static async updateClubName(
    clubId: string,
    newName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!newName || newName.trim().length === 0) {
        return { success: false, error: "Club name cannot be empty" };
      }

      if (newName.trim().length < 2) {
        return {
          success: false,
          error: "Club name must be at least 2 characters long",
        };
      }

      const { error } = await supabase
        .from("Clubs")
        .update({ Name: newName.trim() })
        .eq("id", clubId);

      if (error) {
        console.error("Update club name error:", error);
        return { success: false, error: "Failed to update club name" };
      }

      return { success: true };
    } catch (error) {
      console.error("Update club name error:", error);
      return {
        success: false,
        error: "An error occurred while updating club name",
      };
    }
  }
}
