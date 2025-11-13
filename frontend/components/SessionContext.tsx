// SessionContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { AppState } from "react-native";
import { supabase } from "../app/utils/supabaseService";
import { Session } from "@supabase/supabase-js";
import * as types from "@/app/utils/types";
import {
  fetchUserProfile,
  checkAndClearExpiredAttendance,
  storeUserPushToken,
  updateLastActive,
} from "@/app/utils/supabaseService";
import { registerForPushNotificationsSilently } from "../app/utils/notificationService";

const SessionContext = createContext<Session | null>(null);
const ProfileContext = createContext<types.UserProfile | null>(null);

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<types.UserProfile | null>(null);

  // Function to check and update notification status (like Instagram)
  const checkNotificationStatus = async (userId: string) => {
    try {
      const pushToken = await registerForPushNotificationsSilently();

      if (pushToken) {
        // User has granted permission, ensure we have the token stored
        console.log("🔔 Device notifications enabled, updating token");
        const { error } = await storeUserPushToken(userId, pushToken);
        if (error) {
          console.error("Error storing push token:", error);
        }
      } else {
        // User has denied permission, clear the token
        console.log("🔔 Device notifications disabled, clearing token");
        const { error } = await supabase
          .from("profiles")
          .update({ push_token: "Notification Permission not granted" })
          .eq("id", userId);
        if (error) {
          console.error("Error clearing push token:", error);
        }
      }
    } catch (error) {
      console.error("Error checking notification status:", error);
    }
  };

  // Function to fetch profile and check expired attendance
  const fetchProfileAndCheckAttendance = async (userId: string) => {
    try {
      // First check and clear any expired attendance
      await checkAndClearExpiredAttendance(userId);

      // Then fetch the updated profile
      const profileData = await fetchUserProfile(userId);

      // If profile doesn't exist, create a default profile object with is_complete: false
      // This allows the redirect logic to work properly and distinguishes between
      // "loading" (null) and "doesn't exist" (default object)
      if (!profileData) {
        setProfile({
          id: userId,
          is_complete: false,
        } as types.UserProfile);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching profile or checking attendance:", error);
      // Fallback to just fetching profile if attendance check fails
      try {
        const profileData = await fetchUserProfile(userId);
        if (!profileData) {
          // Profile doesn't exist - set default
          setProfile({
            id: userId,
            is_complete: false,
          } as types.UserProfile);
        } else {
          setProfile(profileData);
        }
      } catch (fallbackError) {
        console.error("Error fetching profile:", fallbackError);
        // On error, set default profile so navigation works
        setProfile({
          id: userId,
          is_complete: false,
        } as types.UserProfile);
      }
    }
  };

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfileAndCheckAttendance(session.user.id);
        // Update last active on initial app load
        updateLastActive(session.user.id);
      }
    });

    // Monitor app state changes (like Instagram does)
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active" && session?.user) {
        checkNotificationStatus(session.user.id);

        // Update last active timestamp
        console.log("📱 Updating last active timestamp");
        updateLastActive(session.user.id);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfileAndCheckAttendance(session.user.id);
          // Update last active when user logs in
          updateLastActive(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel("profile_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session?.user?.id}`,
        },
        (payload) => {
          setProfile(payload.new as types.UserProfile);
        }
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      profileSubscription.unsubscribe();
      subscription.remove();
    };
  }, [session?.user?.id]);

  return (
    <SessionContext.Provider value={session}>
      <ProfileContext.Provider value={profile}>
        {children}
      </ProfileContext.Provider>
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
export const useProfile = () => useContext(ProfileContext);
