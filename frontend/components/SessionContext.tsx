// SessionContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../app/utils/supabaseService";
import { Session } from "@supabase/supabase-js";
import * as types from "@/app/utils/types";
import {
  fetchUserProfile,
  checkAndClearExpiredAttendance,
} from "@/app/utils/supabaseService";

const SessionContext = createContext<Session | null>(null);
const ProfileContext = createContext<types.UserProfile | null>(null);

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<types.UserProfile | null>(null);

  // Function to fetch profile and check expired attendance
  const fetchProfileAndCheckAttendance = async (userId: string) => {
    try {
      // First check and clear any expired attendance
      await checkAndClearExpiredAttendance(userId);

      // Then fetch the updated profile
      const profileData = await fetchUserProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching profile or checking attendance:", error);
      // Fallback to just fetching profile if attendance check fails
      try {
        const profileData = await fetchUserProfile(userId);
        setProfile(profileData);
      } catch (fallbackError) {
        console.error("Error fetching profile:", fallbackError);
      }
    }
  };

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfileAndCheckAttendance(session.user.id);
      }
    });

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfileAndCheckAttendance(session.user.id);
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
