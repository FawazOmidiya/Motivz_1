"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthService } from "@/lib/authService";

interface Club {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  club: Club | null;
  login: (clubId: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateClubName: (
    newName: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const savedClub = localStorage.getItem("club");
    if (savedClub) {
      try {
        setClub(JSON.parse(savedClub));
      } catch (error) {
        console.error("Error parsing saved club:", error);
        localStorage.removeItem("club");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (clubId: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const clubInfo = await AuthService.login(clubId, password);

      if (clubInfo) {
        setClub(clubInfo);
        localStorage.setItem("club", JSON.stringify(clubInfo));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setClub(null);
    localStorage.removeItem("club");
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!club) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Validate new password
      const validation = await AuthService.validatePassword(newPassword);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Password validation failed: ${validation.errors.join(", ")}`,
        };
      }

      const success = await AuthService.changePassword(
        club.id,
        currentPassword,
        newPassword
      );

      if (success) {
        return { success: true };
      } else {
        return { success: false, error: "Current password is incorrect" };
      }
    } catch (error) {
      console.error("Change password error:", error);
      return {
        success: false,
        error: "An error occurred while changing password",
      };
    }
  };

  const updateClubName = async (
    newName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!club) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const result = await AuthService.updateClubName(club.id, newName);

      if (result.success) {
        // Update the local club state with the new name
        setClub((prev) => (prev ? { ...prev, name: newName.trim() } : null));
        // Update localStorage
        const updatedClub = { ...club, name: newName.trim() };
        localStorage.setItem("club", JSON.stringify(updatedClub));
      }

      return result;
    } catch (error) {
      console.error("Update club name error:", error);
      return {
        success: false,
        error: "An error occurred while updating club name",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{ club, login, logout, isLoading, changePassword, updateClubName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
