import { useState, useEffect } from "react";
import { useSession } from "@/components/SessionContext";
import {
  saveEvent,
  unsaveEvent,
  fetchUserProfile,
} from "../utils/supabaseService";
import * as types from "../utils/types";

export function useSavedEvents() {
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const session = useSession();

  useEffect(() => {
    if (session?.user) {
      loadSavedEvents();
    }
  }, [session?.user]);

  const loadSavedEvents = async () => {
    try {
      if (!session?.user) return;

      const profile = await fetchUserProfile(session.user.id);
      if (profile?.saved_events && Array.isArray(profile.saved_events)) {
        const eventIds = profile.saved_events.map(
          (savedEvent) => Object.keys(savedEvent)[0]
        );
        setSavedEventIds(eventIds);
      } else {
        setSavedEventIds([]);
      }
    } catch (error) {
      console.error("Error loading saved events:", error);
      setSavedEventIds([]);
    }
  };

  const isEventSaved = (eventId: string): boolean => {
    return savedEventIds.includes(eventId);
  };

  const toggleSaveEvent = async (event: types.Event): Promise<boolean> => {
    try {
      if (!session?.user) return false;

      setLoading(true);
      const isSaved = isEventSaved(event.id);

      let success = false;
      if (isSaved) {
        success = await unsaveEvent(session.user.id, event.id);
      } else {
        success = await saveEvent(session.user.id, event);
      }

      if (success) {
        // Update local state
        if (isSaved) {
          setSavedEventIds((prev) => prev.filter((id) => id !== event.id));
        } else {
          setSavedEventIds((prev) => [...prev, event.id]);
        }
      }

      return success;
    } catch (error) {
      console.error("Error toggling save event:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    savedEventIds,
    isEventSaved,
    toggleSaveEvent,
    loading,
    refreshSavedEvents: loadSavedEvents,
  };
}
