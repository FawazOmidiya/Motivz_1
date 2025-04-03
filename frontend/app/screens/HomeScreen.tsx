import {
  View,
  Text,
  FlatList,
  Button,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Keyboard,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect, useCallback } from "react";
import * as types from "@/app/utils/types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation"; // Import the types
import { fetchClubs, searchClubsByName } from "../utils/supabaseService";
import * as Constants from "@/constants/Constants";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen() {
  const [clubs, setClubs] = useState<types.Club[]>([]); // ✅ Store clubs from Supabase
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadClubs = async () => {
      const clubData = await fetchClubs();
      setClubs(clubData);
      setLoading(false);
    };
    loadClubs();
  }, []);
  const navigation = useNavigation(); // ✅ Use correct navigation type
  async function searchItems() {
    // Hide keyboard once search starts
    Keyboard.dismiss();
    setLoading(true);

    try {
      // Query the "Clubs" table
      const clubs: types.Club[] = await searchClubsByName(query);
      setClubs(clubs);
      console.log("Clubs:", clubs);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const clubData = await fetchClubs();
      setClubs(clubData);
    } catch (error) {
      console.error("Error refreshing clubs:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TextInput
          style={styles.searchInput}
          placeholder={"Search Clubs..."}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchItems}
          returnKeyType="search"
        />
        <Ionicons
          name="filter-sharp"
          size={24}
          color="white"
          onPress={() => console.log("pressed")}
        />
      </View>
      <Text style={styles.title}>
        Tonights <Text style={styles.Motivz}>Motivz</Text>
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={clubs}
          extraData={clubs}
          // keyExtractor={(item) => item.club_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate("ClubDetail", { club: item })}
            >
              <View style={styles.clubCard}>
                <Image source={{ uri: item.Image }} style={styles.clubImage} />
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{item.Name}</Text>
                  <Text style={styles.clubDetails}>
                    ⭐ {item.Rating} | {item.Tags?.join(", ")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: StatusBar.currentHeight || 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: Constants.backgroundCOLOR,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#fff",
  },
  clubCard: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#212f66",
    borderRadius: 10,
    marginBottom: 10,
  },
  clubImage: { width: 60, height: 60, borderRadius: 10, marginRight: 10 },
  clubInfo: { justifyContent: "center" },
  clubName: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  clubDetails: { fontSize: 14, color: "gray" },
  searchInput: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    width: "70%",
  },
  Motivz: {
    color: Constants.purpleCOLOR,
    fontSize: 30,
    textTransform: "uppercase",
    fontFamily: "PlayfairDisplay_700Bold",
  },
});
