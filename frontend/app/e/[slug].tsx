// Event detail route for Universal Links (e/[slug])
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase, fetchFullEvent } from "../utils/supabaseService";
import * as types from "../utils/types";
import * as Constants from "@/constants/Constants";
import { useSession } from "@/components/SessionContext";
import { useTabNavigation } from "../utils/navigationHelpers";
import { shareEvent } from "../utils/shareService";
import { extractEventIdFromSlug } from "../utils/eventSlug";

export default function EventBySlugScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { eventPath, clubPath } = useTabNavigation();
  const session = useSession();
  const [event, setEvent] = useState<types.Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      if (!params.slug) {
        setError("Event slug is required");
        setLoading(false);
        return;
      }

      try {
        // Slug format: {id}-{title-slug}
        // Extract ID from slug
        const eventId = extractEventIdFromSlug(params.slug);

        let eventData: types.Event | null = null;

        // Strategy 1: Try exact slug match (preferred)
        const { data: slugData, error: slugError } = await supabase
          .from("events")
          .select("*")
          .eq("slug", params.slug)
          .single();

        if (!slugError && slugData) {
          eventData = slugData as types.Event;
        } else if (eventId) {
          // Strategy 2: Try ID extracted from slug
          const fullEvent = await fetchFullEvent(eventId);
          if (fullEvent) {
            eventData = fullEvent;
          }
        } else {
          // Strategy 3: Try slug as ID (for backward compatibility)
          const fullEvent = await fetchFullEvent(params.slug);
          if (fullEvent) {
            eventData = fullEvent;
          }
        }

        if (eventData) {
          setEvent(eventData);
          // Navigate to the proper event detail screen
          router.replace({
            pathname: eventPath(eventData.id, eventData).pathname,
            params: eventPath(eventData.id, eventData).params,
          } as any);
        } else {
          setError("Event not found");
        }
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [params.slug]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.errorText}>{error || "Event not found"}</Text>
      </View>
    );
  }

  // This should not render as we redirect, but just in case:
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
  },
});
