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
  const pendingUpdateRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Function to check and update notification status (like Instagram)
  const checkNotificationStatus = async (userId: string) => {
    try {
      const pushToken = await registerForPushNotificationsSilently();

      if (pushToken) {
        // User has granted permission, ensure we have the token stored
        const { error } = await storeUserPushToken(userId, pushToken);
        if (error) {
          console.error("Error storing push token:", error);
        }
      } else {
        // User has denied permission, clear the token
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

  // Function to fetch profile and check expired attendance with retry logic
  const fetchProfileAndCheckAttendance = async (
    userId: string,
    retryCount = 0
  ): Promise<void> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff in ms

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
    } catch (error: any) {
      console.error(
        `Error fetching profile (attempt ${retryCount + 1}/${
          MAX_RETRIES + 1
        }):`,
        error
      );

      // Check if it's a network error (retry) vs other error (don't retry)
      const isNetworkError =
        error?.message?.includes("network") ||
        error?.message?.includes("timeout") ||
        error?.message?.includes("fetch") ||
        error?.code === "ECONNREFUSED" ||
        error?.code === "ETIMEDOUT";

      if (isNetworkError && retryCount < MAX_RETRIES) {
        // Retry with exponential backoff
        const delay = RETRY_DELAYS[retryCount] || 4000;
        console.log(`Retrying profile fetch in ${delay}ms...`);

        setTimeout(() => {
          fetchProfileAndCheckAttendance(userId, retryCount + 1);
        }, delay);
        return;
      }

      // Max retries reached or non-network error
      // Fallback: try just fetching profile without attendance check
      try {
        const profileData = await fetchUserProfile(userId);
        if (!profileData) {
          setProfile({
            id: userId,
            is_complete: false,
          } as types.UserProfile);
        } else {
          setProfile(profileData);
        }
      } catch (fallbackError) {
        console.error("Error fetching profile after retries:", fallbackError);
        // Last resort: set default profile so navigation works
        // User will see profile completion screen, which is better than being stuck
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
      if (nextAppState === "active") {
        // Re-check session when app becomes active to handle backgrounded sign-ins
        supabase.auth
          .getSession()
          .then(({ data: { session: currentSession } }) => {
            if (currentSession?.user) {
              // Re-fetch profile to ensure it's up to date
              fetchProfileAndCheckAttendance(currentSession.user.id);
              checkNotificationStatus(currentSession.user.id);
              updateLastActive(currentSession.user.id);
            }
          });

        if (session?.user) {
          checkNotificationStatus(session.user.id);
          // Update last active timestamp
          console.log("📱 Updating last active timestamp");
          updateLastActive(session.user.id);
        }
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

    // Subscribe to profile changes - recreate subscription when userId changes
    // Use unique channel name per user to prevent cross-user data leaks
    let profileSubscription: ReturnType<typeof supabase.channel> | null = null;

    if (session?.user?.id) {
      profileSubscription = supabase
        .channel(`profile_changes_${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${session.user.id}`, // Use current userId
          },
          (payload) => {
            // Only update if payload matches current user
            if (payload.new.id === session?.user?.id) {
              // Clear any pending update
              if (pendingUpdateRef.current) {
                clearTimeout(pendingUpdateRef.current);
              }

              // Debounce the update to prevent rapid state changes during navigation
              pendingUpdateRef.current = setTimeout(() => {
                setProfile(payload.new as types.UserProfile);
                pendingUpdateRef.current = null;
              }, 100); // 100ms debounce
            }
          }
        )
        .subscribe();
    }

    return () => {
      authListener.subscription.unsubscribe();
      if (profileSubscription) {
        profileSubscription.unsubscribe();
      }
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
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
