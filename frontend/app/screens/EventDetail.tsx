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
  Linking,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Constants from "../../constants/Constants";
import * as types from "../utils/types";
import {
  supabase,
  trackEventClick,
  addUserToEventAttendees,
  fetchFriendsAttendingEvent,
  isUserAttendingEvent,
} from "../utils/supabaseService";
import { fetchSingleClub } from "../utils/supabaseService";
import { useSession } from "@/components/SessionContext";

const { width } = Dimensions.get("window");

type EventDetailNavigationProp = NativeStackNavigationProp<
  {
    HomeMain: undefined;
    ClubDetail: { club: types.Club };
    EventDetail: { event: types.Event };
    GuestlistForm: { event: types.Event };
    UserProfile: { user: types.UserProfile };
  },
  "EventDetail"
>;

type EventDetailRouteProp = {
  event: types.Event;
};

export default function EventDetailScreen() {
  const navigation = useNavigation<EventDetailNavigationProp>();
  const route = useRoute();
  const { event } = route.params as EventDetailRouteProp;
  const session = useSession();

  const [club, setClub] = useState<types.Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpandedPoster, setShowExpandedPoster] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);
  const [isAttending, setIsAttending] = useState(false);
  const [friendsAttending, setFriendsAttending] = useState<
    { id: string; avatar_url: string | null }[]
  >([]);
  const [totalAttendees, setTotalAttendees] = useState(0);

  useEffect(() => {
    loadClubData();
    loadAttendanceData();
  }, [event.club_id, event.id, session?.user?.id]);

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

  const loadAttendanceData = async () => {
    if (!session?.user?.id) return;

    try {
      // Check if user is attending
      const attending = await isUserAttendingEvent(event.id, session.user.id);
      setIsAttending(attending);

      // Get friends attending
      const friends = await fetchFriendsAttendingEvent(
        event.id,
        session.user.id
      );
      setFriendsAttending(friends);

      // Get total attendees count
      const { data: eventData } = await supabase
        .from("events")
        .select("attendees")
        .eq("id", event.id)
        .single();

      setTotalAttendees(eventData?.attendees?.length || 0);
    } catch (error) {
      console.error("Error loading attendance data:", error);
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

  const handleMoreDetails = () => {
    setShowMoreDetails(!showMoreDetails);
  };

  const handleTicketPurchase = async () => {
    if (!session?.user?.id) return;

    try {
      if (event.ticket_link) {
        // Track ticket purchase click
        await trackEventClick(
          event.id,
          session.user.id,
          "ticket_purchase",
          "event_detail",
          {
            event_title: event.title,
            club_id: event.club_id,
            purchase_method: "ticket_link",
          }
        );

        // Add user to attendees
        await addUserToEventAttendees(event.id, session.user.id);

        // Refresh attendance data
        await loadAttendanceData();

        // Open ticket link
        Linking.openURL(event.ticket_link);
      } else if (event.guestlist_available) {
        // Track guestlist request click
        await trackEventClick(
          event.id,
          session.user.id,
          "guestlist_request",
          "event_detail",
          {
            event_title: event.title,
            club_id: event.club_id,
            request_method: "guestlist_form",
          }
        );

        // Add user to attendees
        await addUserToEventAttendees(event.id, session.user.id);

        // Refresh attendance data
        await loadAttendanceData();

        // Navigate to guestlist form
        navigation.navigate("GuestlistForm", { event });
      }
    } catch (error) {
      console.error("Error handling ticket purchase:", error);
      Alert.alert("Error", "Failed to process your request. Please try again.");
    }
  };

  const handleMarkAsAttending = async () => {
    if (!session?.user?.id) return;

    try {
      // Add user to attendees
      await addUserToEventAttendees(event.id, session.user.id);

      Alert.alert(
        "You're Going!",
        "You've been marked as attending this event. Your friends will be able to see that you're going!",
        [{ text: "OK" }]
      );

      // Refresh attendance data
      await loadAttendanceData();
    } catch (error) {
      console.error("Error marking as attending:", error);
      Alert.alert(
        "Error",
        "Failed to mark you as attending. Please try again."
      );
    }
  };

  const handleMarkAsNotAttending = async () => {
    if (!session?.user?.id) return;

    try {
      // Remove user from attendees
      const { error } = await supabase
        .from("events")
        .update({
          attendees:
            event.attendees?.filter((id) => id !== session.user.id) || [],
        })
        .eq("id", event.id);

      if (error) throw error;

      Alert.alert(
        "Removed from Event",
        "You've been removed from the attendees list for this event.",
        [{ text: "OK" }]
      );

      // Refresh attendance data
      await loadAttendanceData();
    } catch (error) {
      console.error("Error removing from attending:", error);
      Alert.alert(
        "Error",
        "Failed to remove you from the event. Please try again."
      );
    }
  };

  const handleShare = async () => {
    try {
      // Create deep link URL that opens the app directly
      const deepLinkUrl = `motivz://event/${event.id}`;

      const shareContent = {
        message: `🎉 Check out this event: ${event.title}\n\n📅 ${formatDate(
          event.start_date
        )} at ${formatTime(event.start_date)}\n📍 ${
          club?.Name || "Location TBD"
        }\n\nDownload Motivz to view more events: ${deepLinkUrl}\n\nDiscover more events!`,
        title: event.title,
      };

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        // Track the share event
        if (session?.user?.id) {
          await trackEventClick(
            event.id,
            session.user.id,
            "share",
            "event_detail",
            {
              event_title: event.title,
              club_id: event.club_id,
              share_method: "native_share",
            }
          );
        }
        console.log("Event shared successfully");
      }
    } catch (error) {
      console.error("Error sharing event:", error);
      Alert.alert("Error", "Failed to share event. Please try again.");
    }
  };

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
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradientOverlay}
        />

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Event Title with Share Button */}
        <View style={styles.titleRow}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <TouchableOpacity
            style={styles.shareButtonContent}
            onPress={handleShare}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={Constants.purpleCOLOR}
            />
          </TouchableOpacity>
        </View>

        {/* Essential Info Only */}
        <View style={styles.essentialInfo}>
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={Constants.purpleCOLOR}
            />
            <Text style={styles.infoText}>
              {formatDate(event.start_date)} • {formatTime(event.start_date)}
            </Text>
          </View>
          {club && (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => navigation.navigate("ClubDetail", { club })}
            >
              <Ionicons
                name="location"
                size={18}
                color={Constants.purpleCOLOR}
              />
              <Text style={styles.infoText}>{club.Name}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="rgba(255, 255, 255, 0.5)"
              />
            </TouchableOpacity>
          )}
          {/* Music Genres */}
          {event.music_genres && event.music_genres.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons
                name="musical-notes"
                size={18}
                color={Constants.purpleCOLOR}
              />
              <View style={styles.genresContainer}>
                {event.music_genres
                  .slice(0, 3)
                  .map((genre: string, index: number) => (
                    <View key={index} style={styles.genreTag}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                {event.music_genres.length > 3 && (
                  <Text style={styles.moreGenresText}>
                    +{event.music_genres.length - 3} more
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Event Attendance */}
        {totalAttendees > 0 && (
          <View style={styles.attendanceSection}>
            <View style={styles.attendanceHeader}>
              <Ionicons name="people" size={20} color={Constants.purpleCOLOR} />
              <Text style={styles.attendanceText}>
                {totalAttendees}{" "}
                {totalAttendees === 1 ? "person is" : "people are"} going
              </Text>
            </View>

            {/* Friends attending */}
            {friendsAttending.length > 0 && (
              <View style={styles.friendsAttending}>
                <Text style={styles.friendsAttendingLabel}>Your friends:</Text>
                <View style={styles.friendsAvatars}>
                  {friendsAttending.slice(0, 5).map((friend, index) => (
                    <View key={friend.id} style={styles.friendAvatar}>
                      {friend.avatar_url ? (
                        <Image
                          source={{ uri: friend.avatar_url }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person" size={16} color="#fff" />
                        </View>
                      )}
                    </View>
                  ))}
                  {friendsAttending.length > 5 && (
                    <View style={styles.moreFriends}>
                      <Text style={styles.moreFriendsText}>
                        +{friendsAttending.length - 5}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* User attending status */}
            {isAttending && (
              <View style={styles.userAttendingStatus}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.userAttendingText}>You're going!</Text>
              </View>
            )}
          </View>
        )}

        {/* Primary Action - Tickets */}
        <TouchableOpacity
          style={[
            styles.ticketButton,
            !event.ticket_link &&
              !event.guestlist_available &&
              styles.ticketButtonDisabled,
          ]}
          onPress={handleTicketPurchase}
          disabled={!event.ticket_link && !event.guestlist_available}
          activeOpacity={
            event.ticket_link || event.guestlist_available ? 0.8 : 1
          }
        >
          <Ionicons
            name="ticket"
            size={20}
            color={
              event.ticket_link || event.guestlist_available
                ? "#fff"
                : "rgba(255, 255, 255, 0.4)"
            }
          />
          <Text
            style={[
              styles.ticketButtonText,
              !event.ticket_link &&
                !event.guestlist_available &&
                styles.ticketButtonTextDisabled,
            ]}
          >
            {event.ticket_link
              ? "Get Tickets / Guestlist"
              : event.guestlist_available
              ? "Request Guestlist"
              : "Ticketing Coming Soon"}
          </Text>
        </TouchableOpacity>

        {/* Attendance toggle - show different text based on current status */}
        <TouchableOpacity
          style={styles.attendanceToggleButton}
          onPress={
            isAttending ? handleMarkAsNotAttending : handleMarkAsAttending
          }
        >
          <Text style={styles.attendanceToggleText}>
            {isAttending
              ? "Not going anymore? Click here!"
              : "Already got tickets? Click here"}
          </Text>
        </TouchableOpacity>

        {/* More Info Button */}
        <TouchableOpacity
          style={styles.moreInfoButton}
          onPress={handleMoreDetails}
        >
          <Text style={styles.moreInfoText}>More Details</Text>
          <Ionicons
            name={showMoreDetails ? "chevron-up" : "chevron-down"}
            size={16}
            color={Constants.purpleCOLOR}
          />
        </TouchableOpacity>

        {/* Expandable Details */}
        {showMoreDetails && (
          <View style={styles.expandedDetails}>
            {/* Description */}
            {event.caption && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>About This Event</Text>
                <Text style={styles.detailText}>{event.caption}</Text>
              </View>
            )}

            {/* Music Genres */}
            {event.music_genres && event.music_genres.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Music</Text>
                <View style={styles.genresContainer}>
                  {event.music_genres.map((genre: string, index: number) => (
                    <View key={index} style={styles.genreTag}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Event Details */}
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Event Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Time:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(event.start_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Time:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(event.end_date)}
                </Text>
              </View>
            </View>
          </View>
        )}
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
    height: 500,
    position: "relative",
  },
  eventPoster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
    marginBottom: 20,
    lineHeight: 34,
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  shareButtonContent: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginLeft: 12,
  },
  essentialInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  communitySection: {
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  communityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  communityText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  ticketButton: {
    backgroundColor: Constants.purpleCOLOR,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  ticketButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  ticketButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  ticketButtonTextDisabled: {
    color: "rgba(255, 255, 255, 0.4)",
  },
  attendanceToggleButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  attendanceToggleText: {
    color: Constants.purpleCOLOR,
    fontSize: 16,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  moreInfoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 6,
  },
  moreInfoText: {
    color: Constants.purpleCOLOR,
    fontSize: 16,
    fontWeight: "600",
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    lineHeight: 22,
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  genreTag: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  moreGenresText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "500",
    alignSelf: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  // Attendance styles
  attendanceSection: {
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  attendanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  attendanceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  friendsAttending: {
    marginBottom: 8,
  },
  friendsAttendingLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 8,
  },
  friendsAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: -8,
    borderWidth: 2,
    borderColor: Constants.backgroundCOLOR,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Constants.purpleCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  moreFriends: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  moreFriendsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  userAttendingStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  userAttendingText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});
