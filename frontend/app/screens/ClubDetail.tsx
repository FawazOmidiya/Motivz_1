import React, { useState, useEffect } from "react";
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
import {
  fetchEventsByClub,
  queryUserFavouriteExists,
  addClubToFavourites,
  removeClubFromFavourites,
  updateUserActiveClub,
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

export default function ClubDetailScreen() {
  const route = useRoute();
  const { club: clubData } = route.params as { club: types.Club };
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<any>([]);
  const [musicSchedule, setMusicSchedule] = useState<string[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const session = useSession();
  const profile = useProfile();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"google" | "app">("google");
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userLocation, setUserLocation] = useState<types.LocationCoords | null>(
    null
  );
  const [isGoing, setIsGoing] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [showLiveOnly, setShowLiveOnly] = useState(true);

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
    getLocation();
    loadEvents();
    setIsGoing(profile?.active_club_id === club?.id);
    getMusicSchedule();
  }, [club?.id, profile]);

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

  useEffect(() => {
    // Check if this is the user's active club
    if (profile?.active_club_id === club?.id) {
      setIsGoing(true);
    }
  }, [session, club?.id]);

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
        Alert.alert("Error", error.message);
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
    setIsGoing(!isGoing);
    await updateUserActiveClub(session.user.id, club_id);
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

  const handleLongPress = () => {
    setShowSchedulePopup(true);
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
      <View style={styles.headerContainer}>
        <Image source={{ uri: club?.image }} style={styles.clubBanner} />
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "transparent"]}
          style={styles.gradientOverlay}
        />
        <View style={styles.header}>
          <BackButton color="white" />
          <Text style={styles.clubName}>{club?.name}</Text>
          {isFavourite ? (
            <TouchableOpacity onPress={handleRemoveFromFavourites}>
              <FontAwesome
                name="heart"
                size={24}
                color={Constants.purpleCOLOR}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleAddToFavourites}>
              <FontAwesome name="heart-o" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isGoing ? styles.goingButton : styles.notGoingButton,
            ]}
            onPress={() => setActiveClub(isGoing ? null : club?.id)}
          >
            <Ionicons
              name={isGoing ? "checkmark-circle" : "location"}
              size={24}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.actionButtonText}>
              {isGoing ? "You're Here!" : "Check In"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.externalActionButton]}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  club?.name || ""
                )}`
              )
            }
          >
            <Ionicons name="logo-google" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.externalActionButton]}
            onPress={() =>
              Linking.openURL(
                `https://www.instagram.com/${club?.instagram_handle || ""}`
              )
            }
          >
            <Ionicons name="logo-instagram" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <Text style={styles.sectionTitle}>Vibes</Text>
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, styles.ratingTag, styles.ratingTagRow]}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.tagText}>{club?.live_rating}</Text>
          </View>

          {musicSchedule?.map((genre: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{genre}</Text>
            </View>
          ))}
          {clubData.Tags?.map((tag: any, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Operating Hours with Long Press Popup */}
        {club?.hours && (
          <View style={styles.hoursSection}>
            <Pressable style={styles.hoursContainer} onPress={handleLongPress}>
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.hoursText}>{club.getCurrentDayHours()}</Text>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#fff"
                style={styles.hoursChevron}
              />
            </Pressable>
          </View>
        )}

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

        {/* Upcoming Events */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {events.length === 0 ? (
          <Text style={styles.noEvents}>No Events</Text>
        ) : (
          <FlatList
            data={events}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <Text style={styles.eventName}>{item.event_name}</Text>
                <Text style={styles.eventDate}>
                  {new Date(item.date).toDateString()}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        )}
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
    height: 300,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  contentContainer: {
    padding: 20,
    marginTop: -30,
    backgroundColor: Constants.backgroundCOLOR,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  clubName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  tag: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  tagText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
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
    width: 300,
    maxHeight: 400,
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  popupTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  closePopupButton: {
    padding: 5,
  },
  popupContent: {
    maxHeight: 300,
  },
  scheduleRow: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  currentDayRow: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  scheduleDay: {
    color: "#fff",
    fontSize: 16,
  },
  currentDayText: {
    color: Constants.purpleCOLOR,
    fontWeight: "bold",
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
    width: width * 0.7,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
  },
});
