import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Constants from "../../constants/Constants";
import * as types from "../utils/types";
import { supabase } from "../utils/supabaseService";
import { fetchSingleClub } from "../utils/supabaseService";

const { width } = Dimensions.get("window");

type EventDetailNavigationProp = NativeStackNavigationProp<
  types.RootTabParamList,
  "EventDetail"
>;

type EventDetailRouteProp = {
  event: types.Event;
};

export default function EventDetailScreen() {
  const navigation = useNavigation<EventDetailNavigationProp>();
  const route = useRoute();
  const { event } = route.params as EventDetailRouteProp;

  const [club, setClub] = useState<types.Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpandedPoster, setShowExpandedPoster] = useState(false);

  useEffect(() => {
    loadClubData();
  }, [event.club_id]);

  const loadClubData = async () => {
    try {
      const clubData = await fetchSingleClub(event.club_id);
      setClub(clubData);
    } catch (error) {
      console.error("Error loading club data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEventStatus = () => {
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    if (now < start) {
      return { status: "upcoming", color: "#4CAF50", text: "Upcoming" };
    } else if (now >= start && now <= end) {
      return { status: "ongoing", color: "#FF9800", text: "Happening Now" };
    } else {
      return { status: "past", color: "#9E9E9E", text: "Past Event" };
    }
  };

  const eventStatus = getEventStatus();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Poster */}
      <View style={styles.headerContainer}>
        {event.poster_url ? (
          <TouchableOpacity
            onPress={() => setShowExpandedPoster(true)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: event.poster_url }}
              style={styles.eventPoster}
            />
            <View style={styles.expandIndicator}>
              <Ionicons
                name="expand-outline"
                size={20}
                color="rgba(255, 255, 255, 0.8)"
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderPoster}>
            <Ionicons
              name="calendar"
              size={64}
              color="rgba(255, 255, 255, 0.3)"
            />
            <Text style={styles.placeholderText}>No Poster Available</Text>
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradientOverlay}
        />

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Event Status Badge */}
        <View
          style={[styles.statusBadge, { backgroundColor: eventStatus.color }]}
        >
          <Text style={styles.statusText}>{eventStatus.text}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Event Title */}
        <Text style={styles.eventTitle}>{event.title}</Text>

        {/* Club Info */}
        {club && (
          <TouchableOpacity
            style={styles.clubInfo}
            onPress={() => navigation.navigate("ClubDetail", { club })}
          >
            <Ionicons name="location" size={16} color={Constants.purpleCOLOR} />
            <Text style={styles.clubName}>{club.Name}</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(255, 255, 255, 0.5)"
            />
          </TouchableOpacity>
        )}

        {/* Date and Time */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="rgba(255, 255, 255, 0.7)"
            />
            <Text style={styles.infoText}>{formatDate(event.start_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={20}
              color="rgba(255, 255, 255, 0.7)"
            />
            <Text style={styles.infoText}>
              {formatTime(event.start_date)} - {formatTime(event.end_date)}
            </Text>
          </View>
        </View>

        {/* Description */}
        {event.caption && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.caption}</Text>
          </View>
        )}

        {/* Music Genres */}
        {event.music_genres && event.music_genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Music</Text>
            <View style={styles.genresContainer}>
              {event.music_genres.map((genre: string, index: number) => (
                <View key={index} style={styles.genreTag}>
                  <Ionicons
                    name="musical-notes"
                    size={14}
                    color={Constants.purpleCOLOR}
                  />
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Future Features Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          <View style={styles.comingSoonContainer}>
            <View style={styles.comingSoonItem}>
              <Ionicons
                name="ticket-outline"
                size={24}
                color="rgba(255, 255, 255, 0.3)"
              />
              <Text style={styles.comingSoonText}>Ticket Purchasing</Text>
            </View>
            <View style={styles.comingSoonItem}>
              <Ionicons
                name="people-outline"
                size={24}
                color="rgba(255, 255, 255, 0.3)"
              />
              <Text style={styles.comingSoonText}>Friends Attending</Text>
            </View>
            <View style={styles.comingSoonItem}>
              <Ionicons
                name="mic-outline"
                size={24}
                color="rgba(255, 255, 255, 0.3)"
              />
              <Text style={styles.comingSoonText}>DJ Information</Text>
            </View>
            <View style={styles.comingSoonItem}>
              <Ionicons
                name="share-outline"
                size={24}
                color="rgba(255, 255, 255, 0.3)"
              />
              <Text style={styles.comingSoonText}>Share Event</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Expanded Poster Modal */}
      <Modal
        visible={showExpandedPoster}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExpandedPoster(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowExpandedPoster(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.expandedPosterContainer}
            onPress={() => setShowExpandedPoster(false)}
            activeOpacity={1}
          >
            <Image
              source={{ uri: event.poster_url }}
              style={styles.expandedPoster}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Constants.backgroundCOLOR,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
  },
  headerContainer: {
    height: 300,
    position: "relative",
  },
  eventPoster: {
    width: "100%",
    height: "100%",
  },
  placeholderPoster: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 16,
    marginTop: 8,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
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
  statusBadge: {
    position: "absolute",
    top: 50,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  contentContainer: {
    padding: 20,
    marginTop: -30,
    backgroundColor: Constants.backgroundCOLOR,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    lineHeight: 34,
  },
  clubInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  clubName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  description: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    lineHeight: 24,
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  comingSoonContainer: {
    gap: 16,
  },
  comingSoonItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
  },
  comingSoonText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
    marginLeft: 12,
  },
  expandIndicator: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  expandedPosterContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  expandedPoster: {
    width: "100%",
    height: "100%",
  },
});
