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
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { fetchEventsByClub, getTodaysHours } from "../utils/supabaseService";
import { Button } from "@rneui/themed";
import { supabaseAuth } from "../utils/supabaseAuth";
import { useSession } from "@/components/SessionContext";
import * as types from "@/app/utils/types";
import {
  queryUserFavouriteExists,
  addClubToFavourites,
  removeClubFromFavourites,
} from "../utils/supabaseService";
import BackButton from "@/components/BackButton";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Constants from "@/constants/Constants";
import ClubGoogleReviews from "@/components/ClubGoogleReviews";
import ClubAppReviews from "@/components/ClubAppReviews";
import ReviewForm from "@/components/ReviewForm";

export default function ClubDetailScreen() {
  const route = useRoute();
  const { club } = route.params as { club: types.Club };
  const [events, setEvents] = useState<any>([]);
  const [adding, setAdding] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const session = useSession();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"google" | "app">("google");
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      const eventData = await fetchEventsByClub(club.id);
      setEvents(eventData);
    };
    loadEvents();
  }, [club.id]);

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <BackButton color="white" />
        <Text style={styles.clubName}>{club.Name}</Text>
        {isFavourite ? (
          <FontAwesome
            name="heart"
            size={24}
            color={Constants.purpleCOLOR}
            onPress={handleRemoveFromFavourites}
          />
        ) : (
          <FontAwesome
            name="heart-o"
            size={24}
            color="white"
            onPress={handleAddToFavourites}
          />
        )}
      </View>
      <Image source={{ uri: club.Image }} style={styles.clubBanner} />
      {/* Tags */}
      <Text style={styles.sectionTitle}>Vibes:</Text>
      <View style={styles.tagsContainer}>
        {club.Tags?.map((tag: any, index: number) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      {/* Operating Hours */}
      {club.hours && (
        <Text style={styles.hoursText}>{getTodaysHours(club.hours)}</Text>
      )}
      {/* Toggle Tabs */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "google" && styles.tabActive]}
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
            App Reviews
          </Text>
        </TouchableOpacity>
      </View>
      {/* Rate this club button */}
      <TouchableOpacity
        style={styles.rateButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.rateButtonText}>Rate this club</Text>
      </TouchableOpacity>

      {/* Reviews Section */}
      {activeTab === "google" ? (
        <ClubGoogleReviews clubId={club.id} />
      ) : (
        <ClubAppReviews clubId={club.id} />
      )}
      {/* Upcoming Events */}
      <Text style={styles.sectionTitle}>Upcoming Events:</Text>
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
      {/* Review Form Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <ReviewForm
              clubId={club.id}
              onSuccess={() => {
                setShowModal(false);
                setRefreshFlag((f) => !f);
              }}
            />
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
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
    padding: 20,
  },
  header: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clubBanner: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  clubName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    color: "#fff",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  tag: {
    backgroundColor: Constants.purpleCOLOR,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { color: "#fff", fontWeight: "bold" },
  noEvents: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
    marginTop: 10,
  },
  eventCard: {
    padding: 10,
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    marginRight: 10,
  },
  eventName: { fontSize: 16, fontWeight: "bold" },
  eventDate: { fontSize: 14, color: "gray" },
  buttonContainer: {
    marginVertical: 15,
  },
  hoursText: {
    fontSize: 14,
    color: "#fff",
    marginVertical: 5,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#333",
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Constants.purpleCOLOR,
  },
  tabText: {
    color: "#ccc",
    fontSize: 16,
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  rateButton: {
    backgroundColor: Constants.purpleCOLOR,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  rateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 10,
    alignItems: "center",
  },
  closeText: {
    color: "#007AFF",
    fontSize: 16,
  },
});
