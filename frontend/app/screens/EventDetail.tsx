import React, { useState, useEffect, useRef } from "react";
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
  Animated,
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
  fetchFullEvent,
} from "../utils/supabaseService";
import { fetchSingleClub, fetchSingleEvent } from "../utils/supabaseService";
import { useSession } from "@/components/SessionContext";
import { useSavedEvents } from "../hooks/useSavedEvents";

const { width } = Dimensions.get("window");

// Skeleton component for EventDetail loading state
const EventDetailSkeleton = () => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };
    shimmer();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Skeleton */}
      <View style={styles.headerContainer}>
        <Animated.View style={[styles.skeletonPoster, { opacity }]} />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradientOverlay}
        />
        {/* Back Button Skeleton */}
        <View style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.contentContainer}>
        {/* Title Row Skeleton */}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Animated.View style={[styles.skeletonTitle, { opacity }]} />
          </View>
          <View style={styles.actionButtons}>
            <Animated.View style={[styles.skeletonActionButton, { opacity }]} />
            <Animated.View style={[styles.skeletonActionButton, { opacity }]} />
          </View>
        </View>

        {/* Essential Info Skeleton */}
        <View style={styles.essentialInfo}>
          <View style={styles.infoRow}>
            <Animated.View style={[styles.skeletonIcon, { opacity }]} />
            <Animated.View style={[styles.skeletonInfoText, { opacity }]} />
          </View>
          <View style={styles.infoRow}>
            <Animated.View style={[styles.skeletonIcon, { opacity }]} />
            <Animated.View style={[styles.skeletonInfoText, { opacity }]} />
          </View>
          <View style={styles.infoRow}>
            <Animated.View style={[styles.skeletonIcon, { opacity }]} />
            <View style={styles.genresContainer}>
              <Animated.View style={[styles.skeletonGenreTag, { opacity }]} />
              <Animated.View style={[styles.skeletonGenreTag, { opacity }]} />
              <Animated.View style={[styles.skeletonGenreTag, { opacity }]} />
            </View>
          </View>
          {/* Attendance Skeleton */}
          <View style={styles.attendanceContainer}>
            <View style={styles.infoRow}>
              <Animated.View style={[styles.skeletonIcon, { opacity }]} />
              <Animated.View style={[styles.skeletonInfoText, { opacity }]} />
            </View>
            <View style={styles.friendsAvatarsRow}>
              <Animated.View
                style={[styles.skeletonFriendAvatar, { opacity }]}
              />
              <Animated.View
                style={[styles.skeletonFriendAvatar, { opacity }]}
              />
              <Animated.View
                style={[styles.skeletonFriendAvatar, { opacity }]}
              />
            </View>
          </View>
        </View>

        {/* Ticket Button Skeleton */}
        <Animated.View style={[styles.skeletonTicketButton, { opacity }]} />

        {/* Attendance Toggle Skeleton */}
        <Animated.View style={[styles.skeletonAttendanceToggle, { opacity }]} />

        {/* Expanded Details Skeleton */}
        <View style={styles.expandedDetails}>
          <Animated.View style={[styles.skeletonDetailTitle, { opacity }]} />
          <Animated.View style={[styles.skeletonDetailText, { opacity }]} />
          <Animated.View style={[styles.skeletonDetailText, { opacity }]} />
          <Animated.View style={[styles.skeletonDetailText, { opacity }]} />
        </View>
      </View>
    </ScrollView>
  );
};

type EventDetailNavigationProp = NativeStackNavigationProp<
  {
    HomeMain: undefined;
    ClubDetail: { club: types.Club };
    EventDetail: { event_id: string };
    GuestlistForm: { event: types.Event };
    UserProfile: { user: types.UserProfile };
  },
  "EventDetail"
>;

type EventDetailRouteProp = {
  eventId: string;
  event?: types.Event;
  club?: types.Club;
};

export default function EventDetailScreen() {
  const navigation = useNavigation<EventDetailNavigationProp>();
  const route = useRoute();
  const {
    eventId,
    event: preloadedEvent,
    club: preloadedClub,
  } = route.params as EventDetailRouteProp;
  const session = useSession();

  const [event, setEvent] = useState<types.Event>();
  const [club, setClub] = useState<types.Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpandedPoster, setShowExpandedPoster] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isAttending, setIsAttending] = useState(false);
  const [friendsAttending, setFriendsAttending] = useState<
    { id: string; avatar_url: string | null }[]
  >([]);
  const [totalAttendees, setTotalAttendees] = useState(0);

  // Saved events functionality
  const {
    isEventSaved,
    toggleSaveEvent,
    loading: saveLoading,
  } = useSavedEvents();
  const [localSaveCount, setLocalSaveCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      // Always fetch complete event data to ensure we have all fields
      const eventData = await fetchFullEvent(eventId);
      setEvent(eventData);
      setLocalSaveCount(eventData.save_count || 0);

      // Use pre-loaded club data if available, otherwise fetch it
      if (preloadedClub) {
        setClub(preloadedClub);
      } else {
        await loadClubData(eventData);
      }

      await loadAttendanceData(eventData);
      setLoading(false);
    };
    loadData();
  }, [eventId, session?.user?.id, preloadedClub]);

  const loadClubData = async (eventData?: types.Event) => {
    const currentEvent = eventData || event;
    if (!currentEvent?.club_id) return;

    try {
      const clubData = await fetchSingleClub(currentEvent.club_id);
      setClub(clubData);
    } catch (error) {
      console.error("Error loading club data:", error);
    }
  };

  const loadAttendanceData = async (eventData?: types.Event) => {
    const currentEvent = eventData || event;
    if (!session?.user?.id || !currentEvent?.id) return;

    try {
      // Check if user is attending
      const attending = await isUserAttendingEvent(
        currentEvent.id,
        session.user.id
      );
      setIsAttending(attending);

      // Get friends attending
      const friends = await fetchFriendsAttendingEvent(
        currentEvent.id,
        session.user.id
      );
      setFriendsAttending(friends);

      // Get total attendees count
      const { data: eventData } = await supabase
        .from("events")
        .select("attendees")
        .eq("id", currentEvent.id)
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
    if (!displayEvent)
      return { status: "loading", color: "#9E9E9E", text: "Loading..." };

    const now = new Date();
    const start = new Date(displayEvent.start_date);
    const end = new Date(displayEvent.end_date);

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

  const handleSaveEvent = async () => {
    if (!displayEvent) return;

    try {
      const wasSaved = isEventSaved(displayEvent.id);
      await toggleSaveEvent(displayEvent);

      // Update local save count immediately
      if (wasSaved) {
        setLocalSaveCount((prev) => Math.max(0, prev - 1));
      } else {
        setLocalSaveCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleTicketPurchase = async () => {
    if (!session?.user?.id || !displayEvent) return;

    try {
      if (displayEvent.ticket_link) {
        // Track ticket purchase click
        await trackEventClick(
          displayEvent.id,
          session.user.id,
          "ticket_purchase",
          "event_detail",
          {
            event_title: displayEvent.title,
            club_id: displayEvent.club_id,
            purchase_method: "ticket_link",
          }
        );

        // Add user to attendees
        await addUserToEventAttendees(displayEvent.id, session.user.id);

        // Refresh attendance data
        await loadAttendanceData(displayEvent);

        // Open ticket link
        Linking.openURL(displayEvent.ticket_link);
      } else if (displayEvent.guestlist_available) {
        // Track guestlist request click
        await trackEventClick(
          displayEvent.id,
          session.user.id,
          "guestlist_request",
          "event_detail",
          {
            event_title: displayEvent.title,
            club_id: displayEvent.club_id,
            request_method: "guestlist_form",
          }
        );

        // Add user to attendees
        await addUserToEventAttendees(displayEvent.id, session.user.id);

        // Refresh attendance data
        await loadAttendanceData(displayEvent);

        // Navigate to guestlist form
        navigation.navigate("GuestlistForm", { event: displayEvent });
      }
    } catch (error) {
      console.error("Error handling ticket purchase:", error);
      Alert.alert("Error", "Failed to process your request. Please try again.");
    }
  };

  const handleMarkAsAttending = async () => {
    if (!session?.user?.id || !displayEvent) return;

    try {
      // Add user to attendees
      await addUserToEventAttendees(displayEvent.id, session.user.id);

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
    if (!session?.user?.id || !displayEvent) return;

    try {
      // Remove user from attendees
      const { error } = await supabase
        .from("events")
        .update({
          attendees:
            displayEvent.attendees?.filter((id) => id !== session.user.id) ||
            [],
        })
        .eq("id", displayEvent.id);

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
    if (!displayEvent) return;

    try {
      // Create deep link URL that opens the app directly
      const deepLinkUrl = `motivz://event/${displayEvent.id}`;

      const shareContent = {
        message: `🎉 Check out this event: ${
          displayEvent.title
        }\n\n📅 ${formatDate(displayEvent.start_date)} at ${formatTime(
          displayEvent.start_date
        )}\n📍 ${
          displayClub?.Name || "Location TBD"
        }\n\nDownload Motivz to view more events: ${deepLinkUrl}\n\nDiscover more events!`,
        title: displayEvent.title,
      };

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        // Track the share event
        if (session?.user?.id && displayEvent) {
          await trackEventClick(
            displayEvent.id,
            session.user.id,
            "share",
            "event_detail",
            {
              event_title: displayEvent.title,
              club_id: displayEvent.club_id,
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

  // Show skeleton only if we have no pre-loaded data and are still loading
  if (loading && !preloadedEvent) {
    return <EventDetailSkeleton />;
  }

  // Use freshly fetched data if available, otherwise fall back to pre-loaded data
  const displayEvent = event || preloadedEvent;
  const displayClub = club || preloadedClub;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Poster */}
      <View style={styles.headerContainer}>
        {displayEvent?.poster_url ? (
          <TouchableOpacity
            onPress={() => setShowExpandedPoster(true)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: displayEvent.poster_url }}
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
          <View style={styles.titleContainer}>
            <Text style={styles.eventTitle}>{displayEvent?.title}</Text>
            {displayEvent?.trending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="flame" size={12} color="#fff" />
                <Text style={styles.trendingText}>Trending</Text>
              </View>
            )}
          </View>
          <View style={styles.actionButtons}>
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={styles.saveButtonContent}
                onPress={handleSaveEvent}
                disabled={saveLoading}
              >
                <Ionicons
                  name={
                    isEventSaved(displayEvent?.id || "")
                      ? "bookmark"
                      : "bookmark-outline"
                  }
                  size={20}
                  color={Constants.purpleCOLOR}
                />
                {/* Save Count Badge */}
                {localSaveCount > 0 && (
                  <View style={styles.saveCountBadge}>
                    <Text style={styles.saveCountBadgeText}>
                      {localSaveCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
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
              {displayEvent?.start_date
                ? formatDate(displayEvent.start_date)
                : ""}{" "}
              •{" "}
              {displayEvent?.start_date
                ? formatTime(displayEvent.start_date)
                : ""}
            </Text>
          </View>
          {displayClub && (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() =>
                navigation.navigate("ClubDetail", { club: displayClub })
              }
            >
              <Ionicons
                name="location"
                size={18}
                color={Constants.purpleCOLOR}
              />
              <Text style={styles.infoText}>{displayClub.Name}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="rgba(255, 255, 255, 0.5)"
              />
            </TouchableOpacity>
          )}
          {/* Music Genres */}
          {displayEvent?.music_genres &&
            displayEvent.music_genres.length > 0 && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="musical-notes"
                  size={18}
                  color={Constants.purpleCOLOR}
                />
                <View style={styles.genresContainer}>
                  {displayEvent.music_genres
                    .slice(0, 3)
                    .map((genre: string, index: number) => (
                      <View key={index} style={styles.genreTag}>
                        <Text style={styles.genreText}>{genre}</Text>
                      </View>
                    ))}
                  {displayEvent.music_genres.length > 3 && (
                    <Text style={styles.moreGenresText}>
                      +{displayEvent.music_genres.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            )}
          {/* Event Attendance */}
          {totalAttendees > 0 && (
            <View style={styles.attendanceContainer}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="people"
                  size={18}
                  color={Constants.purpleCOLOR}
                />
                <Text style={styles.infoText}>
                  {totalAttendees}{" "}
                  {totalAttendees === 1 ? "person is" : "people are"} going
                  {isAttending && " • You're going!"}
                </Text>
              </View>
              {/* Friends attending avatars */}
              {friendsAttending.length > 0 && (
                <View style={styles.friendsAvatarsRow}>
                  {friendsAttending.slice(0, 5).map((friend, index) => (
                    <View key={friend.id} style={styles.friendAvatarBeneath}>
                      {friend.avatar_url ? (
                        <Image
                          source={{ uri: friend.avatar_url }}
                          style={styles.avatarImageBeneath}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholderBeneath}>
                          <Ionicons name="person" size={14} color="#fff" />
                        </View>
                      )}
                    </View>
                  ))}
                  {friendsAttending.length > 5 && (
                    <View style={styles.moreFriendsBeneath}>
                      <Text style={styles.moreFriendsTextBeneath}>
                        +{friendsAttending.length - 5}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Primary Action - Tickets */}
        <TouchableOpacity
          style={[
            styles.ticketButton,
            !displayEvent?.ticket_link &&
              !displayEvent?.guestlist_available &&
              styles.ticketButtonDisabled,
          ]}
          onPress={handleTicketPurchase}
          disabled={
            !displayEvent?.ticket_link && !displayEvent?.guestlist_available
          }
          activeOpacity={
            displayEvent?.ticket_link || displayEvent?.guestlist_available
              ? 0.8
              : 1
          }
        >
          <Ionicons
            name="ticket"
            size={20}
            color={
              displayEvent?.ticket_link || displayEvent?.guestlist_available
                ? "#fff"
                : "rgba(255, 255, 255, 0.4)"
            }
          />
          <Text
            style={[
              styles.ticketButtonText,
              !displayEvent?.ticket_link &&
                !displayEvent?.guestlist_available &&
                styles.ticketButtonTextDisabled,
            ]}
          >
            {displayEvent?.ticket_link
              ? "Get Tickets / Guestlist"
              : displayEvent?.guestlist_available
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
        {/* Expandable Details */}
        {displayEvent && (
          <View style={styles.expandedDetails}>
            {/* Description */}
            {displayEvent.caption && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>About This Event</Text>
                <Text style={styles.detailText}>{displayEvent.caption}</Text>
              </View>
            )}

            {/* Music Genres */}
            {displayEvent.music_genres &&
              displayEvent.music_genres.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Music</Text>
                  <View style={styles.genresContainer}>
                    {displayEvent.music_genres.map(
                      (genre: string, index: number) => (
                        <View key={index} style={styles.genreTag}>
                          <Text style={styles.genreText}>{genre}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

            {/* Event Details */}
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Event Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Time:</Text>
                <Text style={styles.detailValue}>
                  {displayEvent.start_date
                    ? formatTime(displayEvent.start_date)
                    : ""}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Time:</Text>
                <Text style={styles.detailValue}>
                  {displayEvent.end_date
                    ? formatTime(displayEvent.end_date)
                    : ""}
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
              source={{ uri: displayEvent?.poster_url }}
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
    marginBottom: 8,
    lineHeight: 34,
    flex: 1,
  },
  titleContainer: {
    flex: 1,
  },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B35",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  trendingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  saveButtonContainer: {
    alignItems: "center",
    marginRight: 8,
  },
  saveButtonContent: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  shareButtonContent: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
  saveCountBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  saveCountBadgeText: {
    color: "white",
    fontSize: 10,
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
  // Attendance container and beneath avatars
  attendanceContainer: {
    marginBottom: 8,
  },
  friendsAvatarsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 26, // Align with text content
  },
  friendAvatarBeneath: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: -6,
    borderWidth: 2,
    borderColor: Constants.backgroundCOLOR,
    overflow: "hidden",
  },
  avatarImageBeneath: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholderBeneath: {
    width: "100%",
    height: "100%",
    backgroundColor: Constants.purpleCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  moreFriendsBeneath: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  moreFriendsTextBeneath: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // Skeleton Styles
  skeletonPoster: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  skeletonTitle: {
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    marginBottom: 8,
    width: "80%",
  },
  skeletonTrendingBadge: {
    height: 24,
    backgroundColor: "rgba(255, 107, 53, 0.3)",
    borderRadius: 12,
    width: 80,
    marginBottom: 8,
  },
  skeletonActionButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    marginLeft: 8,
  },
  skeletonIcon: {
    width: 18,
    height: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 9,
  },
  skeletonInfoText: {
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    flex: 1,
    marginLeft: 8,
  },
  skeletonGenreTag: {
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    width: 60,
    marginRight: 6,
  },
  skeletonFriendAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: -6,
  },
  skeletonTicketButton: {
    height: 56,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginBottom: 16,
  },
  skeletonAttendanceToggle: {
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    width: 200,
    marginBottom: 16,
  },
  skeletonDetailTitle: {
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    width: 150,
    marginBottom: 12,
  },
  skeletonDetailText: {
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    marginBottom: 8,
    width: "100%",
  },
});
