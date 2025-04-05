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

export default function ClubDetailScreen() {
  const route = useRoute();
  const { club } = route.params as { club: types.Club };
  const [events, setEvents] = useState<any>([]);
  const [adding, setAdding] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const session = useSession();
  const navigation = useNavigation();

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
      <Text style={styles.sectionTitle}>Tags:</Text>
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
    backgroundColor: "#007AFF",
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
});
