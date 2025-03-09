import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import { fetchEventsByClub } from "../utils/supabaseService";
import { Button } from "@rneui/themed";
import { supabaseAuth } from "../utils/supabaseAuth";
import { useSession } from "@/components/SessionContext";

export default function ClubDetailScreen() {
  const route = useRoute();
  const { club } = route.params;
  const [events, setEvents] = useState<any>([]);
  const [adding, setAdding] = useState(false);
  const session = useSession();

  useEffect(() => {
    const loadEvents = async () => {
      const eventData = await fetchEventsByClub(club.id);
      setEvents(eventData);
    };
    loadEvents();
  }, []);

  async function addToFavourites() {
    setAdding(true);
    // Get current user session
    const user = session?.user;
    if (!user) {
      Alert.alert("Not Signed In", "Please sign in to add favourites.");
      setAdding(false);
      return;
    }
    // Insert the favourite relation
    const { error } = await supabaseAuth.from("profile_favourites").insert({
      profile_id: user.id,
      club_id: club.id,
    });
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Club added to your favourites!");
    }
    setAdding(false);
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: club.Image }} style={styles.clubBanner} />
      <Text style={styles.clubName}>{club.Name}</Text>

      {/* Tags */}
      <Text style={styles.sectionTitle}>Tags:</Text>
      <View style={styles.tagsContainer}>
        {club.Tags?.map((tag: any, index: number) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Add to Favourites Button */}
      <Button
        title="Add to Favourites"
        onPress={addToFavourites}
        loading={adding}
        containerStyle={styles.buttonContainer}
      />

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
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
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
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 15 },
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
});
