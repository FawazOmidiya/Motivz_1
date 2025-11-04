import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Alert,
  FlatList,
  Image,
  Dimensions,
  TouchableHighlight,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  Linking,
  Pressable,
  Animated,
} from "react-native";
import { Button, Text, TextInput, SegmentedButtons } from "react-native-paper";

import { useSession, useProfile } from "@/components/SessionContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../utils/types";
import {
  fetchUserFavourites,
  fetchSingleClub,
  fetchSingleEvent,
  fetchPendingFriendRequestsCount,
  fetchUserAttendingEvents,
  fetchUserSavedEvents,
  storeUserPushToken,
  supabase,
} from "../utils/supabaseService";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { uploadPost, fetchUserPosts, deletePost } from "../utils/postService";
import { decode } from "base64-arraybuffer";
import { Video, ResizeMode } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

type ProfileScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favourites, setFavourites] = useState<types.Club[]>([]);
  const profile = useProfile();
  const [activeClub, setActiveClub] = useState<types.Club | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [posts, setPosts] = useState<types.Post[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<types.Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<types.Event[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeTab, setActiveTab] = useState("favourites");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const session = useSession();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [showPostModal, setShowPostModal] = useState(false);
  const [pickedAsset, setPickedAsset] = useState<any>(null);
  const [pickedAssetType, setPickedAssetType] = useState<"photo" | "video">(
    "photo"
  );
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: "photo" | "video";
  } | null>(null);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [activeEvent, setActiveEvent] = useState<any>(null);

  useEffect(() => {
    if (session) {
      getFavourites();
      getPendingRequestsCount();
      getAttendingEvents();
    }
  }, [session]);

  // Watch for profile changes to update saved events and active club/event
  useEffect(() => {
    if (profile) {
      getSavedEvents();
      if (profile.active_club_id) {
        fetchSingleClub(profile.active_club_id).then(setActiveClub);
      }
      if (profile.active_event_id) {
        fetchSingleEvent(profile.active_event_id).then(setActiveEvent);
      }
    }
  }, [profile]);

  // Pull user Favourites
  async function getFavourites() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");
      const data = await fetchUserFavourites(session.user.id);
      if (data) {
        // Map each row's club object into our Club type.
        const mappedFavourites = data.map((favourite: any) => {
          return favourite.club;
        });
        setFavourites(mappedFavourites);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Favourites Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Fetch pending friend requests count only
  async function getPendingRequestsCount() {
    try {
      if (!session?.user) return;

      const count = await fetchPendingFriendRequestsCount(session.user.id);
      setPendingRequestsCount(count);
    } catch (error) {
      console.error("Error fetching pending friend requests count:", error);
      setPendingRequestsCount(0);
    }
  }

  async function getSavedEvents() {
    try {
      if (!session?.user || !profile) return;

      console.log("getSavedEvents: Raw saved_events:", profile.saved_events);
      console.log("getSavedEvents: Type:", typeof profile.saved_events);
      console.log(
        "getSavedEvents: IsArray:",
        Array.isArray(profile.saved_events)
      );

      let savedEventsArray: any[] = [];
      let savedEventsData = profile.saved_events;

      // If saved_events is undefined/null, fetch fresh saved events data with filtered events
      if (!profile.saved_events) {
        console.log(
          "getSavedEvents: saved_events is null/undefined, fetching fresh saved events"
        );
        try {
          const fetchedSavedEvents = await fetchUserSavedEvents(
            session.user.id
          );
          savedEventsData = fetchedSavedEvents;
          console.log(
            "getSavedEvents: Fetched fresh saved events:",
            savedEventsData
          );
        } catch (fetchError) {
          console.error(
            "getSavedEvents: Error fetching fresh saved events:",
            fetchError
          );
          savedEventsData = null;
        }
      }

      // Handle different data types: array, object, or null/undefined
      if (!savedEventsData) {
        // null or undefined
        console.log("getSavedEvents: saved_events is null/undefined");
        savedEventsArray = [];
      } else if (Array.isArray(savedEventsData)) {
        // Already an array
        console.log(
          "getSavedEvents: saved_events is an array with",
          savedEventsData.length,
          "items"
        );
        savedEventsArray = savedEventsData;
      } else if (typeof savedEventsData === "object") {
        // It's an object - convert to array format [{eventId: {...}}]
        // If it's an empty object {}, try fetching from DB first
        const keys = Object.keys(savedEventsData);
        if (keys.length === 0) {
          console.log(
            "getSavedEvents: saved_events is empty object, fetching from DB"
          );
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("saved_events")
              .eq("id", session.user.id)
              .single();

            if (!error && data?.saved_events) {
              console.log(
                "getSavedEvents: Fetched from DB:",
                data.saved_events,
                "Type:",
                typeof data.saved_events,
                "IsArray:",
                Array.isArray(data.saved_events)
              );

              // Use fetchUserSavedEvents to get filtered events
              const fetchedSavedEvents = await fetchUserSavedEvents(
                session.user.id
              );

              if (fetchedSavedEvents) {
                savedEventsData = fetchedSavedEvents;
                console.log(
                  "getSavedEvents: Fetched filtered saved_events from fetchUserSavedEvents:",
                  savedEventsData
                );
              } else {
                savedEventsData = data.saved_events;
              }

              // Update profile with fetched data
              profile.saved_events = savedEventsData;

              // Process the fetched data
              if (Array.isArray(savedEventsData)) {
                savedEventsArray = savedEventsData;
              } else if (
                savedEventsData &&
                typeof savedEventsData === "object" &&
                Object.keys(savedEventsData).length > 0
              ) {
                // Convert object to array
                savedEventsArray = Object.entries(savedEventsData).map(
                  ([eventId, eventData]) => ({ [eventId]: eventData })
                );
              } else {
                savedEventsArray = [];
              }
            } else {
              console.log("getSavedEvents: No data from DB or error:", error);
              savedEventsArray = [];
            }
          } catch (fetchError) {
            console.error(
              "getSavedEvents: Error fetching from DB:",
              fetchError
            );
            savedEventsArray = [];
          }
        } else {
          // Convert object to array format
          // Expected format: {eventId1: {title, poster_url, ...}, eventId2: {...}}
          // Convert to: [{eventId1: {...}}, {eventId2: {...}}]
          savedEventsArray = Object.entries(savedEventsData).map(
            ([eventId, eventData]) => {
              // Each entry should be {eventId: eventData}
              return { [eventId]: eventData };
            }
          );
        }
      }

      if (savedEventsArray.length > 0) {
        // Convert saved events array to Event objects
        const events = savedEventsArray
          .filter((savedEvent) => {
            // Filter out invalid entries
            if (!savedEvent || typeof savedEvent !== "object") {
              return false;
            }
            const eventId = Object.keys(savedEvent)[0];
            return !!eventId;
          })
          .map((savedEvent) => {
            const eventId = Object.keys(savedEvent)[0];
            const eventData = savedEvent[eventId] as any;
            return {
              id: eventId,
              title: eventData?.title || "",
              poster_url: eventData?.poster_url || "",
              start_date: eventData?.start_date || "",
              end_date: eventData?.end_date || "",
              music_genres: eventData?.music_genres || [],
              club_id: eventData?.club_id || "",
            };
          }) as types.Event[];

        setSavedEvents(events);
        console.log("saved events", events);
      } else {
        setSavedEvents([]);
        console.log("no saved events");
      }
    } catch (error) {
      console.error("Error fetching saved events:", error);
      setSavedEvents([]);
    }
  }

  // Fetch events user is attending
  async function getAttendingEvents() {
    try {
      if (!session?.user) return;

      const events = await fetchUserAttendingEvents(session.user.id);
      setAttendingEvents(events);
    } catch (error) {
      console.error("Error fetching attending events:", error);
      setAttendingEvents([]);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await getFavourites();
    await getPendingRequestsCount();
    await getAttendingEvents();
    // getSavedEvents() is called automatically when profile changes via useEffect
    setRefreshing(false);
  }

  const handleUploadPost = async () => {
    if (!pickedAsset || !profile) return;
    setUploading(true);
    try {
      // 1. Create the post record (without media_url yet)
      const { data: insertPost, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: profile.id,
          caption,
          location: undefined,
          media_type: pickedAssetType,
        })
        .select()
        .single();
      if (!insertPost || !insertPost.id)
        throw new Error("Failed to create post.");

      // 2. Prepare file info
      const ext =
        pickedAsset.uri.split(".").pop() ||
        (pickedAsset.type === "video" ? "mp4" : "jpg");
      const timestamp = Date.now();
      const fileName = `post_${timestamp}.${ext}`;
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const postId = insertPost.id;
      const storagePath = `${profile.id}/${year}/${month}/${day}/${postId}/original/${fileName}`;
      const mimeType =
        pickedAssetType === "photo" ? `image/${ext}` : "video/mp4";

      // 3. Process media (following ProfileSettings pattern)
      let processedUri = pickedAsset.uri;
      let buffer: ArrayBuffer;

      if (pickedAssetType === "photo") {
        // Compress image using ImageManipulator
        const manipulated = await ImageManipulator.manipulateAsync(
          pickedAsset.uri,
          [],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        processedUri = manipulated.uri;

        // Convert to base64 then to ArrayBuffer
        const base64 = await FileSystem.readAsStringAsync(processedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        buffer = decode(base64);
      } else {
        // For videos, read as binary data
        const binaryData = await FileSystem.readAsStringAsync(processedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        buffer = decode(binaryData);
      }

      // 4. Upload using ArrayBuffer (ProfileSettings pattern)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("posts")
        .upload(storagePath, buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: pickedAssetType === "photo" ? "image/jpeg" : "video/mp4",
        });

      if (uploadError) throw uploadError;

      // 5. Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("posts").getPublicUrl(storagePath);

      // 6. Update post record with the public URL
      await supabase
        .from("posts")
        .update({
          id: postId,
          user_id: profile.id,
          club_id: null,
          media_type: pickedAssetType,
          media_url: publicUrl,
          thumbnail_url: publicUrl, // TODO: generate real thumbnail for video
          caption,
          location: undefined,
        })
        .eq("user_id", profile.id)
        .eq("id", postId);

      setShowPostModal(false);
      setPickedAsset(null);
      setCaption("");
      // Optionally refresh posts here
      if (profile.id) {
        const newPosts = await fetchUserPosts(profile.id);
        setPosts(newPosts);
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message || "Failed to upload post.");
    } finally {
      setUploading(false);
    }
  };

  // Add delete handler
  const handleDeletePost = async (postId: string) => {
    if (!profile) return;
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deletePost(postId, profile.id);
            if (success) {
              // Refresh posts
              const newPosts = await fetchUserPosts(profile.id);
              setPosts(newPosts);
            } else {
              Alert.alert("Error", "Failed to delete post.");
            }
          },
        },
      ]
    );
  };

  const renderFavouriteClub = ({ item }: { item: types.Club }) => (
    <TouchableOpacity
      style={styles.favouriteClubItem}
      onPress={() => navigation.navigate("ClubDetail", { club: item })}
    >
      <Image source={{ uri: item.Image }} style={styles.favouriteClubImage} />
      <Text style={styles.favouriteClubName} numberOfLines={1}>
        {item.Name}
      </Text>
    </TouchableOpacity>
  );

  const renderAttendingEvent = ({ item }: { item: types.Event }) => (
    <TouchableOpacity
      style={styles.favouriteClubItem}
      onPress={() =>
        navigation.navigate("EventDetail", {
          eventId: item.id,
          event: item,
        })
      }
    >
      {item.poster_url ? (
        <Image
          source={{ uri: item.poster_url }}
          style={styles.favouriteClubImage}
        />
      ) : (
        <View style={[styles.favouriteClubImage, styles.eventPlaceholder]}>
          <Ionicons name="calendar-outline" size={24} color="#666" />
        </View>
      )}
      <Text style={styles.favouriteClubName} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.eventDate} numberOfLines={1}>
        {new Date(item.start_date).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderTicketItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Image
          source={{ uri: item.event_poster }}
          style={styles.ticketEventImage}
        />
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketEventTitle}>{item.event_title}</Text>
          <Text style={styles.ticketEventDate}>{item.event_date}</Text>
          <Text style={styles.ticketStatus}>{item.status}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Constants.greyCOLOR}
        />
      </View>
      <View style={styles.ticketDetails}>
        <Text style={styles.ticketCode}>Code: {item.ticket_code}</Text>
        <Text style={styles.ticketPrice}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderNotificationItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.notificationCard}>
      <View style={styles.notificationIcon}>
        <Ionicons
          name={item.icon}
          size={24}
          color={item.iconColor || Constants.purpleCOLOR}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const ListHeaderComponent = () => (
    <View style={styles.profileContainer}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileTopRow}>
          <View style={styles.profileAvatarContainer}>
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={() => {
                setIsImageModalVisible(true);
              }}
            >
              <Image
                source={
                  profile?.avatar_url
                    ? { uri: profile.avatar_url }
                    : require("@/assets/images/default-avatar.png")
                }
                style={styles.avatarImage}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profile?.friends_count || 0}
              </Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile?.clubs_count || 0}</Text>
              <Text style={styles.statLabel}>Clubs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profile?.events_count || 0}
              </Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile?.first_name} {profile?.last_name}
          </Text>

          {/* Active Club Display */}
          {activeClub && (
            <TouchableOpacity
              style={styles.activeClubInfo}
              onPress={() =>
                navigation.navigate("ClubDetail", { club: activeClub })
              }
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={Constants.purpleCOLOR}
              />
              <Text style={styles.activeClubText}>{activeClub.Name}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.profileBio}>{profile?.bio}</Text>
        </View>

        <View style={styles.profileActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons
              name="share-outline"
              size={20}
              color={Constants.whiteCOLOR}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("ProfileSettings")}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={Constants.whiteCOLOR}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("FriendsList", { userId: profile?.id || "" })
            }
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={Constants.whiteCOLOR}
            />
            {pendingRequestsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {pendingRequestsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "favourites" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("favourites")}
        >
          <Ionicons
            name="heart-outline"
            size={24}
            color={
              activeTab === "favourites"
                ? Constants.whiteCOLOR
                : Constants.greyCOLOR
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "notifications" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={
              activeTab === "notifications"
                ? Constants.whiteCOLOR
                : Constants.greyCOLOR
            }
          />
        </TouchableOpacity>
      </View>

      {activeTab === "favourites" && (
        <View style={styles.favouritesContent}>
          {/* Currently Active Club */}

          {/* Favourite Clubs */}
          <View style={styles.favouritesSection}>
            <Text style={styles.favouritesSectionTitle}>Favourite Clubs</Text>
            {favourites.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {favourites.map((club) => (
                  <TouchableOpacity
                    key={club?.id}
                    style={styles.horizontalClubCard}
                    onPress={() => navigation.navigate("ClubDetail", { club })}
                  >
                    <Image
                      source={{ uri: club?.Image }}
                      style={styles.horizontalClubImage}
                    />
                    <View style={styles.horizontalClubInfo}>
                      <Text style={styles.horizontalClubName} numberOfLines={1}>
                        {club?.Name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.simpleEmptyState}>
                <Text style={styles.simpleEmptyText}>
                  Go find your favourite clubs!{" "}
                </Text>
              </View>
            )}
          </View>

          {/* Saved Events */}
          <View style={styles.favouritesSection}>
            <Text style={styles.favouritesSectionTitle}>Saved Events</Text>
            {savedEvents.length > 0 ? (
              <View style={styles.verticalEventsList}>
                {savedEvents.map((event) => (
                  <TouchableOpacity
                    key={event?.id}
                    style={styles.verticalEventCard}
                    onPress={() =>
                      navigation.navigate("EventDetail", {
                        eventId: event.id,
                        event: event,
                      })
                    }
                  >
                    <Image
                      source={{ uri: event?.poster_url }}
                      style={styles.verticalEventImage}
                    />
                    <View style={styles.verticalEventContent}>
                      <Text style={styles.verticalEventTitle} numberOfLines={2}>
                        {event?.title}
                      </Text>
                      <Text style={styles.verticalEventTime}>
                        {new Date(event?.start_date).toLocaleDateString("en", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        {new Date(event?.start_date).toLocaleTimeString("en", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Text>
                      {event?.music_genres && event.music_genres.length > 0 && (
                        <View style={styles.verticalEventGenres}>
                          {event.music_genres
                            .slice(0, 2)
                            .map((genre: string, index: number) => (
                              <View key={index} style={styles.genreChip}>
                                <Text style={styles.genreChipText}>
                                  {genre}
                                </Text>
                              </View>
                            ))}
                          {event.music_genres.length > 2 && (
                            <Text style={styles.moreGenresText}>
                              +{event.music_genres.length - 2} more
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                    <View style={styles.verticalEventArrow}>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={Constants.greyCOLOR}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.simpleEmptyState}>
                <Text style={styles.simpleEmptyText}>
                  Your saved events will appear here
                </Text>
              </View>
            )}
          </View>

          {/* My Tickets */}
          {tickets.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Tickets</Text>
              <View style={styles.ticketsList}>
                {tickets.map((ticket) => (
                  <View key={ticket.id} style={styles.ticketCard}>
                    <Image
                      source={{ uri: ticket.event_poster }}
                      style={styles.ticketImage}
                    />
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketTitle}>
                        {ticket.event_title}
                      </Text>
                      <Text style={styles.ticketDate}>{ticket.event_date}</Text>
                      <Text style={styles.ticketStatus}>{ticket.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {activeTab === "notifications" && (
        <View style={styles.notificationsContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Event Notifications & Confirmations
            </Text>
            <View style={styles.emptyState}>
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color={Constants.greyCOLOR}
              />
              <Text style={styles.emptyStateText}>No confirmations</Text>
              <Text style={styles.emptyStateSubtext}>
                Event confirmations will appear here
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        onRequestClose={() => setIsImageModalVisible(false)}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Image
              source={
                profile?.avatar_url
                  ? { uri: profile.avatar_url }
                  : require("@/assets/images/default-avatar.png")
              }
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Post Modal */}
      {/* <Modal
        visible={showPostModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={styles.postModalContainer}>
          <View style={styles.postModalContent}>
            <View style={styles.postModalHeader}>
              <TouchableOpacity
                onPress={() => setShowPostModal(false)}
                style={styles.postModalCloseButton}
              >
                <Ionicons name="close" size={24} color={Constants.whiteCOLOR} />
              </TouchableOpacity>
              <Text style={styles.postModalTitle}>Create Post</Text>
              <TouchableOpacity
                onPress={handleUploadPost}
                disabled={uploading}
                style={[
                  styles.postModalPostButton,
                  uploading && styles.postModalPostButtonDisabled,
                ]}
              >
                <Text style={styles.postModalPostButtonText}>
                  {uploading ? "Posting..." : "Post"}
                </Text>
              </TouchableOpacity>
            </View>

            {pickedAsset && (
              <View style={styles.postModalMediaContainer}>
                {pickedAssetType === "video" ? (
                <Video
                  source={{ uri: pickedAsset.uri }}
                    style={styles.postModalMedia}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={true}
                  isLooping={true}
                />
              ) : (
                <Image
                  source={{ uri: pickedAsset.uri }}
                    style={styles.postModalMedia}
                  />
                )}
              </View>
            )}

            <View style={styles.postModalInputContainer}>
            <TextInput
              placeholder="Write a caption..."
              value={caption}
              onChangeText={setCaption}
                style={styles.postModalInput}
                placeholderTextColor={Constants.greyCOLOR}
                multiline
                numberOfLines={4}
              />
          </View>
        </View>
        </View>
      </Modal> */}
      {/* Posts Section (main FlatList) */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={{ position: "relative", flex: 1 }}>
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => {
                setSelectedMedia({
                  url: item.media_url,
                  type: item.media_type,
                });
                setMediaModalVisible(true);
              }}
            >
              {item.media_type === "video" ? (
                <View style={{ flex: 1 }}>
                  <Video
                    source={{ uri: item.media_url }}
                    style={styles.gridImage}
                    resizeMode={ResizeMode.COVER}
                    isMuted
                    shouldPlay={false}
                  />
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: 12,
                      padding: 2,
                    }}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                  </View>
                </View>
              ) : (
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
            {/* Delete button overlay, only for current user's posts */}
            {profile && item.user_id === profile.id && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  borderRadius: 16,
                  padding: 4,
                  zIndex: 2,
                }}
                onPress={() => handleDeletePost(item.id)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListHeaderComponent={ListHeaderComponent}
        // ListEmptyComponent={
        //   <Text style={{ color: "#fff", textAlign: "center", marginTop: 40 }}>
        //     More features coming soon!
        //   </Text>
        // }
        contentContainerStyle={styles.gridList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={[Constants.purpleCOLOR]}
          />
        }
      />
      <Modal
        visible={mediaModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMediaModalVisible(false)}
      >
        <View style={styles.mediaModalContainer}>
          <TouchableOpacity
            style={styles.mediaModalCloseButton}
            onPress={() => setMediaModalVisible(false)}
          >
            <Ionicons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          {selectedMedia && selectedMedia.type === "video" && (
            <Video
              source={{ uri: selectedMedia.url }}
              style={styles.mediaModalVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
            />
          )}
          {selectedMedia && selectedMedia.type === "photo" && (
            <Image
              source={{ uri: selectedMedia.url }}
              style={styles.mediaModalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      {/* Floating Action Button
      <TouchableOpacity style={styles.fab} onPress={handleCaptureMoment}>
        <Ionicons name="add" size={24} color={Constants.whiteCOLOR} />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },

  // Profile Container
  profileContainer: {
    backgroundColor: Constants.blackCOLOR,
  },

  // Profile Header
  profileHeader: {
    padding: 20,
    paddingTop: 60,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileAvatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 0,
    borderColor: "transparent",
  },
  profileAvatarWithStory: {
    borderWidth: 3,
    borderColor: Constants.purpleCOLOR,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  storyCameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Constants.purpleCOLOR,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Constants.blackCOLOR,
  },
  avatarPlaceholder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },

  // Profile Stats
  profileStats: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },

  // Profile Info
  profileInfo: {
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  activeClubInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  activeClubText: {
    fontSize: 14,
    color: Constants.purpleCOLOR,
    fontWeight: "500",
  },
  profileBio: {
    fontSize: 14,
    color: Constants.whiteCOLOR,
    lineHeight: 20,
  },

  // Profile Actions
  profileActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: Constants.whiteCOLOR,
    fontSize: 12,
    fontWeight: "bold",
  },

  // Tab Navigation
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Constants.purpleCOLOR,
    marginBottom: 4,
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTabText: {
    fontSize: 16,
    color: Constants.greyCOLOR,
    textAlign: "center",
  },
  favouritesContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  storiesContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 16,
  },

  // Clubs Grid
  clubsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  clubCard: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  clubCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  clubCardName: {
    fontSize: 14,
    fontWeight: "500",
    color: Constants.whiteCOLOR,
    textAlign: "center",
  },

  // Events List
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  eventCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  eventCardDate: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },

  // Tickets List
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  ticketImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginBottom: 2,
  },
  ticketStatus: {
    fontSize: 12,
    color: Constants.purpleCOLOR,
    fontWeight: "500",
  },

  // Posts Grid
  gridList: {
    paddingBottom: 20,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    backgroundColor: "#222",
    borderRadius: 8,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },

  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "90%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  modalPlaceholderText: {
    fontSize: 80,
    color: Constants.whiteCOLOR,
  },

  // Post Modal
  postModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  postModalContent: {
    backgroundColor: Constants.backgroundCOLOR,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "80%",
  },
  postModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  postModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  postModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
  },
  postModalPostButton: {
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postModalPostButtonDisabled: {
    backgroundColor: Constants.greyCOLOR,
  },
  postModalPostButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  postModalMediaContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  postModalMedia: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  postModalInputContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
  },
  postModalInput: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Media Modal
  mediaModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaModalCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaModalVideo: {
    width: "90%",
    aspectRatio: 9 / 16,
    borderRadius: 16,
  },
  mediaModalImage: {
    width: "90%",
    aspectRatio: 1,
    borderRadius: 16,
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Constants.purpleCOLOR,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Favourite Club Items
  favouriteClubItem: {
    alignItems: "center",
    marginRight: 18,
    width: 80,
  },
  favouriteClubImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
    backgroundColor: Constants.greyCOLOR,
  },
  favouriteClubName: {
    color: Constants.whiteCOLOR,
    fontSize: 13,
    textAlign: "center",
    width: 70,
  },
  eventPlaceholder: {
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  eventDate: {
    color: Constants.greyCOLOR,
    fontSize: 11,
    textAlign: "center",
    width: 70,
    marginTop: 2,
  },

  // Ticket Items
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketEventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  ticketEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  ticketEventDate: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginBottom: 4,
  },
  ticketDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  ticketCode: {
    fontSize: 12,
    color: Constants.greyCOLOR,
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },

  // Notification Items
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Constants.greyCOLOR,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4444",
  },

  // Stories Section
  storiesSection: {
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 8,
  },
  storiesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  storyUsername: {
    fontSize: 12,
    color: Constants.whiteCOLOR,
    textAlign: "center",
  },
  storyDeleteButton: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF4444",
    justifyContent: "center",
    alignItems: "center",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  createPostButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createPostButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Story Modal
  storyModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  storyModalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: Constants.blackCOLOR,
    borderRadius: 12,
    overflow: "hidden",
  },
  storyModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.greyCOLOR,
  },
  storyModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  storyModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
  },
  storyModalSpacer: {
    width: 32,
  },
  storyModalMediaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  storyModalImage: {
    width: "100%",
    height: 400,
    borderRadius: 8,
  },
  storyModalVideo: {
    width: "100%",
    height: 400,
    borderRadius: 8,
  },
  storyModalCaption: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 8,
    width: "100%",
  },
  storyModalCaptionText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    textAlign: "center",
  },

  // Empty States
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    textAlign: "center",
  },

  // New Clean Favourites Design
  favouritesSection: {
    marginBottom: 4,
  },
  favouritesSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Constants.purpleCOLOR,
    marginBottom: 16,
  },
  horizontalScrollContent: {
    paddingRight: 20,
  },
  horizontalClubCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  horizontalClubImage: {
    width: "100%",
    height: 100,
    position: "absolute",
    resizeMode: "cover",
    top: 0,
    left: 0,
  },
  horizontalClubInfo: {
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    marginTop: 50,
    marginHorizontal: 8,
    marginBottom: 8,
    position: "relative",
    zIndex: 1,
  },
  horizontalClubName: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  horizontalClubLocation: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  verticalEventsList: {
    gap: 12,
  },
  verticalEventCard: {
    flexDirection: "row",
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "stretch",
  },
  verticalEventImage: {
    width: 100,
    alignSelf: "stretch",
    resizeMode: "cover",
  },
  verticalEventContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
    marginLeft: 8,
  },
  verticalEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.blackCOLOR,
    marginBottom: 2,
  },
  verticalEventDate: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginBottom: 2,
  },
  verticalEventTime: {
    fontSize: 14,
    color: Constants.blackCOLOR,
    fontWeight: "500",
  },
  verticalEventGenres: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  genreChip: {
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreChipText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  moreGenresText: {
    fontSize: 12,
    color: Constants.greyCOLOR,
    fontStyle: "italic",
    alignSelf: "center",
  },
  verticalEventArrow: {
    justifyContent: "center",
    paddingRight: 16,
  },
  simpleEmptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  simpleEmptyText: {
    fontSize: 16,
    color: Constants.greyCOLOR,
    textAlign: "center",
  },
  simpleEmptySubtext: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    textAlign: "center",
  },
});
