import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  Linking,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  fetchEventsByClub,
  queryUserFavouriteExists,
  addClubToFavourites,
  removeClubFromFavourites,
  updateUserActiveClub,
  fetchFriendsAttending,
  fetchUserProfile,
} from "../utils/supabaseService";
import { useSession, useProfile } from "@/components/SessionContext";
import * as types from "@/app/utils/types";
import { Club } from "@/app/utils/Club";
import * as Location from "expo-location";
import BackButton from "@/components/BackButton";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Constants from "@/constants/Constants";
import ClubGoogleReviews from "@/components/ClubGoogleReviews";
import ClubAppReviews from "@/components/ClubAppReviews";
import ReviewForm from "@/components/ReviewForm";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type ClubDetailNavigationProp = NativeStackNavigationProp<
  {
    HomeMain: undefined;
    ClubDetail: { club: types.Club };
    EventDetail: { event: types.Event };
    UserProfile: { user: types.UserProfile };
  },
  "ClubDetail"
>;

export default function ClubDetailScreen() {
  const route = useRoute();
  const { club: clubData } = route.params as { club: types.Club };
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<types.Event[]>([]);
  const [musicSchedule, setMusicSchedule] = useState<string[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const session = useSession();
  const profile = useProfile();
  const navigation = useNavigation<ClubDetailNavigationProp>();
  const [activeTab, setActiveTab] = useState<"google" | "app">("google");
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userLocation, setUserLocation] = useState<types.LocationCoords | null>(
    null
  );
  // Remove the isGoing state since we'll derive it from profile.active_club_id
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [showLiveOnly, setShowLiveOnly] = useState(true);
  const [friendsAtClub, setFriendsAtClub] = useState<
    { id: string; avatar_url: string | null }[]
  >([]);

  useEffect(() => {
    const loadClub = async () => {
      const c = new Club(clubData);
      await c.initLiveRating();
      setClub(c);
    };
    loadClub();
  }, [clubData]);

  useEffect(() => {
    const loadEvents = async () => {
      const eventData = await fetchEventsByClub(club?.id || "");
      setEvents(eventData);
    };

    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for full Club functionality."
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    };

    const loadFriendsAtClub = async () => {
      if (session?.user?.id && club?.id) {
        try {
          const friends = await fetchFriendsAttending(club.id, session.user.id);
          setFriendsAtClub(friends);
        } catch (error) {
          console.error("Error fetching friends at club:", error);
        }
      }
    };

    if (club?.id) {
      loadEvents();
      loadFriendsAtClub();
    }
    getLocation();
    getMusicSchedule();
  }, [club?.id, profile, session?.user?.id]);

  useEffect(() => {
    let mounted = true;
    club?.getLiveRating().then((rating) => {
      if (mounted) setLiveRating(rating);
    });
    return () => {
      mounted = false;
    };
  }, [club]);

  // Check whether the club is already in favourites when the screen loads or when session/club changes.
  useEffect(() => {
    async function checkFavourite() {
      if (session && club) {
        try {
          const exists = await queryUserFavouriteExists(
            session.user.id,
            club.id
          );
          setIsFavourite(exists);
        } catch (error) {
          console.error("Error checking favourite:", error);
        }
      }
    }
    checkFavourite();
  }, [session, club]);

  // Remove this useEffect since we'll compute isGoing directly

  async function handleAddToFavourites() {
    if (!club) return;
    setAdding(true);
    try {
      const added = await addClubToFavourites(session, club.toJSON());
      if (added) {
        setIsFavourite(true);
      } else {
        Alert.alert("Info", "This club is already in your favourites.");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error adding club to favourites:", error);
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveFromFavourites() {
    if (!club) return;
    setAdding(true);
    try {
      const removed = await removeClubFromFavourites(session, club.toJSON());
      if (removed) {
        setIsFavourite(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    } finally {
      setAdding(false);
    }
  }

  const setActiveClub = async (club_id: string | null) => {
    if (!session?.user) return;
    await updateUserActiveClub(session.user.id, club_id);

    // Refresh friends at club list after checking in/out
    if (session?.user?.id && club?.id) {
      try {
        const friends = await fetchFriendsAttending(club.id, session.user.id);
        setFriendsAtClub(friends);
      } catch (error) {
        console.error("Error refreshing friends at club:", error);
      }
    }
  };

  const getMusicSchedule = async () => {
    try {
      const currentDay = new Date().getDay();
      await club?.loadMusicSchedule(currentDay);
      if (!club?.musicSchedule) {
        setMusicSchedule(null);
        return;
      }
      const genreEntries = Object.entries(club.musicSchedule)
        .filter(([key, value]) => typeof value === "number" && value > 0)
        .sort((a, b) => Number(b[1]) - Number(a[1]));
      setMusicSchedule(genreEntries.slice(0, 3).map(([key]) => key));
    } catch (error) {
      console.error("Error fetching music schedule:", error);
      setMusicSchedule(null);
    }
  };

  // Helper function to categorize events
  const categorizeEvents = (events: types.Event[]) => {
    const now = new Date();
    const hundredHoursFromNow = new Date(now.getTime() + 100 * 60 * 60 * 1000);

    const todaysEvents: types.Event[] = [];
    const upcomingEvents: types.Event[] = [];

    events.forEach((event) => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);

      // Check if event is happening now or within 100 hours
      if (eventStart <= hundredHoursFromNow && eventEnd >= now) {
        todaysEvents.push(event);
      } else if (eventStart > hundredHoursFromNow) {
        upcomingEvents.push(event);
      }
    });

    return { todaysEvents, upcomingEvents };
  };

  // Helper function to get event status text
  const getEventStatusText = (event: types.Event) => {
    const now = new Date();
    const eventStart = new Date(event.start_date);
    const eventEnd = new Date(event.end_date);

    if (now >= eventStart && now <= eventEnd) {
      return "Happening Now";
    } else if (eventStart > now) {
      const timeDiff = eventStart.getTime() - now.getTime();
      const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesDiff = Math.floor(
        (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
      );

      if (hoursDiff > 0) {
        return `Starts in ${hoursDiff}h ${minutesDiff}m`;
      } else {
        return `Starts in ${minutesDiff}m`;
      }
    }
    return "Today's Event";
  };

  const handleLongPress = () => {
    setShowSchedulePopup(true);
  };

  const handleFriendPress = async (friendId: string) => {
    try {
      const userProfile = await fetchUserProfile(friendId);
      if (userProfile) {
        navigation.navigate("UserProfile", { user: userProfile });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  if (!club) {
    return (
      <View style={styles.container}>
        <Text style={styles.tagText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Image source={{ uri: club?.image }} style={styles.clubBanner} />
        <LinearGradient
          colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.3)", "transparent"]}
          style={styles.gradientOverlay}
        />

        {/* Top Navigation */}
        <View style={styles.topNavigation}>
          <BackButton color="white" />
          <View style={styles.topActions}>
            {isFavourite ? (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleRemoveFromFavourites}
              >
                <FontAwesome
                  name="heart"
                  size={20}
                  color={Constants.purpleCOLOR}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleAddToFavourites}
              >
                <FontAwesome name="heart-o" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Club Info Overlay */}
        <View style={styles.clubInfoOverlay}>
          <Text style={styles.clubName}>{club?.name}</Text>

          {/* Rating in Banner */}
          <View style={styles.bannerRatingContainer}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.bannerRatingText}>
              {club?.live_rating || club?.rating}
            </Text>
          </View>

          {/* Vibes Tags in Banner */}
          <View style={styles.bannerTagsContainer}>
            {musicSchedule?.slice(0, 4).map((genre: string, index: number) => (
              <View key={index} style={styles.bannerTag}>
                <Text style={styles.bannerTagText}>{genre}</Text>
              </View>
            ))}
            {clubData.Tags?.slice(0, 2).map((tag: any, index: number) => (
              <View key={`tag-${index}`} style={styles.bannerTag}>
                <Text style={styles.bannerTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Friends at Club */}
        {friendsAtClub.length > 0 && (
          <View style={styles.friendsAtClubContainer}>
            <Text style={styles.friendsLabel}>Friends here</Text>
            <View style={styles.friendsRow}>
              {friendsAtClub.slice(0, 4).map((friend, idx) => (
                <TouchableOpacity
                  key={friend.id}
                  style={[
                    styles.friendAvatar,
                    { marginLeft: idx > 0 ? -8 : 0 },
                  ]}
                  onPress={() => handleFriendPress(friend.id)}
                >
                  {friend.avatar_url ? (
                    <Image
                      source={{ uri: friend.avatar_url }}
                      style={styles.friendAvatarImage}
                    />
                  ) : (
                    <View style={styles.friendAvatarPlaceholder}>
                      <Ionicons name="person" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {friendsAtClub.length > 4 && (
                <View style={[styles.friendAvatar, styles.moreFriendsAvatar]}>
                  <Text style={styles.moreFriendsText}>
                    +{friendsAtClub.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.smallActionButton}
            onPress={() =>
              Linking.openURL(
                `https://www.instagram.com/${club?.instagram_handle || ""}`
              )
            }
          >
            <Ionicons name="logo-instagram" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallActionButton}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  club?.name || ""
                )}`
              )
            }
          >
            <Ionicons name="logo-google" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallActionButton}
            onPress={async () => {
              const label =
                club?.address ||
                club?.name ||
                club?.address ||
                club?.name ||
                "Destination";

              // Check if we have valid coordinates (not 0,0 or null)
              const hasValidCoordinates =
                club?.latitude != null &&
                club?.longitude != null &&
                club.latitude !== 0 &&
                club.longitude !== 0 &&
                Math.abs(club.latitude) <= 90 &&
                Math.abs(club.longitude) <= 180;

              // Build the dropoff query
              let dropoffQuery;
              if (hasValidCoordinates) {
                dropoffQuery = `dropoff[latitude]=${
                  club.latitude
                }&dropoff[longitude]=${
                  club.longitude
                }&dropoff[formatted_address]=${encodeURIComponent(label)}`;
              } else {
                dropoffQuery = `dropoff[formatted_address]=${encodeURIComponent(
                  label
                )}`;
              }

              // Universal link (opens app if installed, web otherwise)
              const universal = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&${dropoffQuery}`;

              // App scheme (use if supported)
              const appScheme = `uber://?action=setPickup&pickup=my_location&${dropoffQuery}`;

              try {
                const supportsApp = await Linking.canOpenURL("uber://");
                await Linking.openURL(supportsApp ? appScheme : universal);
              } catch {
                // Final fallback: try universal in browser
                await Linking.openURL(universal);
              }
            }}
          >
            <Ionicons name="car-outline" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scheduleActionButton}
            onPress={handleLongPress}
          >
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text
              style={styles.scheduleButtonText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {club?.getCurrentDayHours() || "Hours not available"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Toggle for reviews */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, showLiveOnly && styles.toggleActive]}
            onPress={() => setShowLiveOnly(true)}
          >
            <Text
              style={[
                styles.toggleText,
                showLiveOnly && styles.toggleTextActive,
              ]}
            >
              Live Reviews
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !showLiveOnly && styles.toggleActive]}
            onPress={() => setShowLiveOnly(false)}
          >
            <Text
              style={[
                styles.toggleText,
                !showLiveOnly && styles.toggleTextActive,
              ]}
            >
              All Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>
              {showLiveOnly ? "Live Reviews" : "All Reviews"}
            </Text>
            <TouchableOpacity
              style={styles.writeReviewButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={Constants.purpleCOLOR}
              />
              <Text style={styles.writeReviewText}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {/* Handle club status for live reviews */}
          {(() => {
            const isOpen = club?.isOpen();
            return showLiveOnly && club && !isOpen ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Wait for the club to open to see live reviews!
                </Text>
              </View>
            ) : (
              <ClubAppReviews
                clubId={club?.id || ""}
                isLiveOnly={showLiveOnly}
              />
            );
          })()}
        </View>

        {/* Events Section */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={styles.sectionTitle}>Events</Text>
        </View>

        {(() => {
          const { todaysEvents, upcomingEvents } = categorizeEvents(events);
          const allEvents = [...todaysEvents, ...upcomingEvents];

          // Find featured event (happening now or next chronological)
          const now = new Date();
          const happeningNowEvent = todaysEvents.find((event) => {
            const eventStart = new Date(event.start_date);
            const eventEnd = new Date(event.end_date);
            return now >= eventStart && now <= eventEnd;
          });

          const featuredEvent = happeningNowEvent || allEvents[0];
          const otherEvents = allEvents.filter(
            (event) => event.id !== featuredEvent?.id
          );

          if (events.length === 0) {
            return (
              <>
                <View style={styles.noEventsContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={48}
                    color="rgba(255, 255, 255, 0.3)"
                  />
                  <Text style={styles.noEvents}>No upcoming events</Text>
                  <Text style={styles.noEventsSubtext}>
                    Check back later for new events
                  </Text>
                </View>
              </>
            );
          }

          return (
            <>
              {/* Featured Event */}
              {featuredEvent && (
                <>
                  <Text style={styles.sectionTitle}>
                    {happeningNowEvent ? "Happening Now" : "Next Event"}
                  </Text>
                  <TouchableOpacity
                    style={styles.featuredEventCard}
                    onPress={() =>
                      navigation.navigate("EventDetail", {
                        event: featuredEvent,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    {featuredEvent.poster_url && (
                      <Image
                        source={{ uri: featuredEvent.poster_url }}
                        style={styles.featuredEventPoster}
                      />
                    )}
                    <View style={styles.featuredEventOverlay}>
                      <View style={styles.featuredEventContent}>
                        <View style={styles.featuredEventHeader}>
                          <View style={styles.featuredEventDateContainer}>
                            <Text style={styles.featuredEventDay}>
                              {new Date(featuredEvent.start_date).getDate()}
                            </Text>
                            <Text style={styles.featuredEventMonth}>
                              {new Date(
                                featuredEvent.start_date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </Text>
                          </View>
                          <View style={styles.featuredEventInfo}>
                            <Text
                              style={styles.featuredEventName}
                              numberOfLines={2}
                            >
                              {featuredEvent.title}
                            </Text>
                            <View style={styles.featuredEventTimeContainer}>
                              <Ionicons
                                name="time-outline"
                                size={16}
                                color="rgba(255, 255, 255, 0.9)"
                              />
                              <Text style={styles.featuredEventTime}>
                                {new Date(
                                  featuredEvent.start_date
                                ).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                                {" - "}
                                {new Date(
                                  featuredEvent.end_date
                                ).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </Text>
                            </View>
                            {happeningNowEvent && (
                              <Text style={styles.featuredEventStatusText}>
                                {getEventStatusText(featuredEvent)}
                              </Text>
                            )}
                          </View>
                        </View>
                        {featuredEvent.music_genres &&
                          featuredEvent.music_genres.length > 0 && (
                            <View style={styles.featuredMusicGenresContainer}>
                              <Ionicons
                                name="musical-notes-outline"
                                size={16}
                                color="rgba(255, 255, 255, 0.9)"
                              />
                              <Text style={styles.featuredMusicGenresText}>
                                {featuredEvent.music_genres
                                  .slice(0, 3)
                                  .join(", ")}
                                {featuredEvent.music_genres.length > 3 &&
                                  " + more"}
                              </Text>
                            </View>
                          )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </>
              )}

              {/* Other Events Horizontal List */}
              {otherEvents.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>More Events</Text>
                  <FlatList
                    data={otherEvents}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalEventsContainer}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.horizontalEventCard}
                        onPress={() =>
                          navigation.navigate("EventDetail", { event: item })
                        }
                        activeOpacity={0.7}
                      >
                        {item.poster_url && (
                          <Image
                            source={{ uri: item.poster_url }}
                            style={styles.horizontalEventPoster}
                          />
                        )}
                        <View style={styles.horizontalEventOverlay}>
                          <View style={styles.horizontalEventContent}>
                            <View style={styles.horizontalEventDateContainer}>
                              <Text style={styles.horizontalEventDay}>
                                {new Date(item.start_date).getDate()}
                              </Text>
                              <Text style={styles.horizontalEventMonth}>
                                {new Date(item.start_date).toLocaleDateString(
                                  "en-US",
                                  { month: "short" }
                                )}
                              </Text>
                            </View>
                            <Text
                              style={styles.horizontalEventName}
                              numberOfLines={2}
                            >
                              {item.title}
                            </Text>
                            <Text style={styles.horizontalEventTime}>
                              {new Date(item.start_date).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </>
              )}
            </>
          );
        })()}
      </View>

      {/* Review Form Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ReviewForm
              club={club}
              onSuccess={() => {
                setShowModal(false);
                setRefreshFlag((f) => !f);
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Schedule Popup */}
      {showSchedulePopup && (
        <Pressable
          style={styles.popupOverlay}
          onPress={() => setShowSchedulePopup(false)}
        >
          <View style={styles.schedulePopup}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Weekly Schedule</Text>
              <TouchableOpacity
                onPress={() => setShowSchedulePopup(false)}
                style={styles.closePopupButton}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.popupContent}>
              {club?.getFullSchedule().map((description, index) => {
                const dayNames = [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ];
                const isCurrentDay = description.startsWith(
                  dayNames[new Date().getDay()]
                );
                return (
                  <View
                    key={index}
                    style={[
                      styles.scheduleRow,
                      isCurrentDay && styles.currentDayRow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.scheduleDay,
                        isCurrentDay && styles.currentDayText,
                      ]}
                    >
                      {description}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  headerContainer: {
    height: 280,
    position: "relative",
  },
  clubBanner: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "100%",
    zIndex: 1,
  },
  topNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 50,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  clubInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 2,
  },
  clubName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  clubStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  bannerTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  bannerTag: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  bannerTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  bannerRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  bannerRatingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  friendsAtClubContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 3,
    alignItems: "flex-end",
  },
  friendsLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  smallActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  scheduleActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 8,
  },
  scheduleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  friendsSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  goingButton: {
    backgroundColor: "#4CAF50",
  },
  notGoingButton: {
    backgroundColor: Constants.purpleCOLOR,
  },
  rateButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  hoursSection: {
    marginBottom: 20,
  },
  hoursContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
  },
  hoursText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  hoursChevron: {
    marginLeft: 10,
  },
  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  schedulePopup: {
    width: 320,
    maxHeight: 500,
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  popupTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  closePopupButton: {
    padding: 4,
  },
  popupContent: {
    maxHeight: 400,
  },
  scheduleRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  currentDayRow: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  scheduleDay: {
    color: "#fff",
    fontSize: 15,
  },
  currentDayText: {
    color: Constants.purpleCOLOR,
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 10,
    alignSelf: "center",
    overflow: "hidden",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: Constants.purpleCOLOR,
  },
  toggleText: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "500",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  eventCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  eventName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  noEvents: {
    textAlign: "center",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 5,
  },
  ratingTag: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  ratingTagRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewsSection: {
    marginBottom: 30,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginTop: 4,
  },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  writeReviewText: {
    color: Constants.purpleCOLOR,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  externalActionButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    minWidth: 0,
    marginHorizontal: 2,
  },
  ticketButton: {
    backgroundColor: "#FF6B35",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
  },
  friendsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#888",
    justifyContent: "center",
    alignItems: "center",
  },
  friendAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  friendAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreFriendsAvatar: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  moreFriendsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  // New event styles
  noEventsContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noEventsSubtext: {
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 5,
  },
  eventsContainer: {
    gap: 12,
  },
  eventHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  eventDateContainer: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
    marginRight: 12,
  },
  eventDay: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 20,
  },
  eventMonth: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  eventInfo: {
    flex: 1,
  },
  eventTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  eventTime: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: 4,
  },
  eventDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 18,
  },
  musicGenresContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  musicGenresText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: 4,
    fontWeight: "500",
  },
  eventPoster: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  eventContent: {
    flex: 1,
  },
  todaysEventCard: {
    borderColor: Constants.purpleCOLOR,
    borderWidth: 2,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
  },
  eventStatusText: {
    fontSize: 12,
    color: Constants.purpleCOLOR,
    fontWeight: "600",
    marginTop: 2,
  },

  // Featured Event Styles
  featuredEventCard: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  featuredEventPoster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  featuredEventOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 16,
  },
  featuredEventContent: {
    flex: 1,
  },
  featuredEventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  featuredEventDateContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginRight: 12,
    minWidth: 50,
  },
  featuredEventDay: {
    fontSize: 20,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  featuredEventMonth: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  featuredEventInfo: {
    flex: 1,
  },
  featuredEventName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 6,
    lineHeight: 22,
  },
  featuredEventTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  featuredEventTime: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 6,
    fontWeight: "500",
  },
  featuredEventStatusText: {
    fontSize: 14,
    color: Constants.purpleCOLOR,
    fontWeight: "600",
    marginBottom: 6,
  },
  featuredEventDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 18,
  },
  featuredMusicGenresContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  featuredMusicGenresText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 6,
    fontWeight: "500",
  },

  // Horizontal Events Styles
  horizontalEventsContainer: {
    paddingRight: 20,
  },
  horizontalEventCard: {
    width: 140,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  horizontalEventPoster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  horizontalEventOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
  },
  horizontalEventContent: {
    flex: 1,
  },
  horizontalEventDateContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    padding: 4,
    alignItems: "center",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  horizontalEventDay: {
    fontSize: 14,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  horizontalEventMonth: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  horizontalEventName: {
    fontSize: 12,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 2,
    lineHeight: 14,
  },
  horizontalEventTime: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
});
