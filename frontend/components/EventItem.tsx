import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import { trackEventClick } from "@/app/utils/supabaseService";
import { useSession } from "@/components/SessionContext";

interface EventItemProps {
  event: types.Event;
  onPress: (event: types.Event) => void;
  sourceScreen?: string; // Track where the click came from
}

export default function EventItem({
  event,
  onPress,
  sourceScreen = "explore",
}: EventItemProps) {
  const session = useSession();
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleEventPress = async () => {
    // Track the event click
    if (session?.user?.id) {
      await trackEventClick(event.id, session.user.id, "view", sourceScreen, {
        event_title: event.title,
        club_id: event.club_id,
      });
    }

    // Call the original onPress handler
    onPress(event);
  };

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={handleEventPress}
      activeOpacity={0.8}
    >
      {/* Full Background Poster */}
      {event.poster_url ? (
        <Image source={{ uri: event.poster_url }} style={styles.eventPoster} />
      ) : (
        <View style={styles.eventPosterPlaceholder}>
          <Ionicons
            name="calendar"
            size={48}
            color="rgba(255, 255, 255, 0.3)"
          />
        </View>
      )}

      {/* Gradient Overlay */}
      <View style={styles.gradientOverlay} />

      {/* Trending Fire Emoji - Top Right */}
      {event.is_trending && (
        <View style={styles.trendingBadge}>
          <Text style={styles.trendingEmoji}>🔥</Text>
        </View>
      )}

      {/* Event Info Overlay */}
      <View style={styles.eventInfoOverlay}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.eventTime}>
          {formatTime(event.start_date)} • {formatDay(event.start_date)}
        </Text>
        {event.music_genres && event.music_genres.length > 0 && (
          <View style={styles.genreContainer}>
            <Ionicons
              name="musical-notes"
              size={12}
              color={Constants.purpleCOLOR}
            />
            <Text style={styles.genreText}>
              {event.music_genres.slice(0, 3).join(", ")}
            </Text>
          </View>
        )}
        {event.attendees && event.attendees.length > 0 && (
          <View style={styles.attendanceContainer}>
            <Ionicons name="people" size={12} color="#4CAF50" />
            <Text style={styles.attendanceText}>
              {event.is_trending && event.friends_attending_count
                ? `${event.friends_attending_count} friend${
                    event.friends_attending_count !== 1 ? "s" : ""
                  } going`
                : `${event.attendees.length} going`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

const styles = StyleSheet.create({
  eventCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2, // Slightly taller for better proportions
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    position: "relative",
  },
  eventPoster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    position: "absolute",
    top: 0,
    left: 0,
  },
  eventPosterPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Constants.greyCOLOR,
    position: "absolute",
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  eventInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
    lineHeight: 18,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventTime: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  genreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  genreText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 4,
    flex: 1,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  attendanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  attendanceText: {
    fontSize: 11,
    color: "#4CAF50",
    marginLeft: 4,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  trendingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 140, 0, 0.9)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  trendingEmoji: {
    fontSize: 16,
  },
});
