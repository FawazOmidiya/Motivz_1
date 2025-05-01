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
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  fetchEventsByClub,
  getTodaysHours,
  queryUserFavouriteExists,
  addClubToFavourites,
  removeClubFromFavourites,
  fetchClubMusicSchedules,
  updateUserActiveClub,
  fetchClubAppReviews,
} from "../utils/supabaseService";
import { Button } from "@rneui/themed";
import { useSession, useProfile } from "@/components/SessionContext";
import * as types from "@/app/utils/types";
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
  const { club } = route.params as { club: types.Club };
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

  useEffect(() => {
    const loadEvents = async () => {
      const eventData = await fetchEventsByClub(club.id);
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
    setIsGoing(profile?.active_club_id === club.id);
    getMusicSchedule();
  }, [club.id, profile]);

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
    if (profile?.active_club_id === club.id) {
      setIsGoing(true);
    }
  }, [session, club.id]);

  async function handleAddToFavourites() {
    setAdding(true);
    try {
      const added = await addClubToFavourites(session, club);
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
    setAdding(true);
    try {
      const removed = await removeClubFromFavourites(session, club);
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
      // For testing, set to Friday (5)
      const testDay = new Date().getDay();
      const musicData = await fetchClubMusicSchedules(club.id, testDay);
      if (musicData === null) {
        setMusicSchedule(null);
        return;
      }

      const genreEntries = Object.entries(musicData)
        .filter(([key, value]) => typeof value === "number" && value > 0)
        .sort((a, b) => Number(b[1]) - Number(a[1]));

      setMusicSchedule(genreEntries.slice(0, 3).map(([key]) => key));
    } catch (error) {
      console.error("Error fetching music schedule:", error);
      setMusicSchedule(null);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Image source={{ uri: club.Image }} style={styles.clubBanner} />
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "transparent"]}
          style={styles.gradientOverlay}
        />
        <View style={styles.header}>
          <BackButton color="white" />
          <Text style={styles.clubName}>{club.Name}</Text>
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
            style={[styles.actionButton, styles.rateButton]}
            onPress={() => setShowModal(true)}
          >
            <Ionicons
              name="star"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.actionButtonText}>Rate this club</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isGoing ? styles.goingButton : styles.notGoingButton,
            ]}
            onPress={() => setActiveClub(isGoing ? null : club.id)}
          >
            <Ionicons
              name={isGoing ? "checkmark-circle" : "add-circle"}
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.actionButtonText}>
              {isGoing ? "I'm Going" : "I'm Not Going"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <Text style={styles.sectionTitle}>Vibes</Text>
        <View style={styles.tagsContainer}>
          {musicSchedule?.map((genre: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{genre}</Text>
            </View>
          ))}
          {club.Tags?.map((tag: any, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Operating Hours */}
        {club.hours && (
          <View style={styles.hoursContainer}>
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.hoursText}>
              {getTodaysHours(club.hours, new Date())[1]?.toString()}
            </Text>
          </View>
        )}

        {/* Toggle Tabs */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "google" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("google")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "google" && styles.tabTextActive,
              ]}
            >
              Google Reviews
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "app" && styles.tabActive]}
            onPress={() => setActiveTab("app")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "app" && styles.tabTextActive,
              ]}
            >
              Live Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reviews Section */}
        {activeTab === "google" ? (
          <ClubGoogleReviews clubId={club.id} />
        ) : (
          <ClubAppReviews clubId={club.id} />
        )}

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
        transparent
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
              clubId={club.id}
              onSuccess={() => {
                setShowModal(false);
                setRefreshFlag((f) => !f);
              }}
            />
          </View>
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
    padding: 12,
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
  rateButton: {
    backgroundColor: Constants.purpleCOLOR,
  },
  goingButton: {
    backgroundColor: "#4CAF50",
  },
  notGoingButton: {
    backgroundColor: "#FF5252",
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
  hoursContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  hoursText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Constants.purpleCOLOR,
  },
  tabText: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "500",
  },
  tabTextActive: {
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 5,
  },
});
