import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Text, Button } from "@rneui/themed";
import { supabase, searchClubsByName } from "../utils/supabaseService"; // or supabaseAuth
import { useNavigation } from "@react-navigation/native";

type Club = {
  id: number;
  Name: string;
  latitude: number;
  longitude: number;
  Rating: number;
  Image: string;
  Tags: string[]; // Example: ["Live Music", "Cocktails", "Dance"]
};

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  // any other fields
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"clubs" | "users">("clubs");
  const [results, setResults] = useState<(Club | UserProfile)[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    // Optionally, you can trigger a search on component mount or whenever `searchType` changes
    // searchItems();
  }, [searchType]);

  async function searchItems() {
    // Hide keyboard once search starts
    Keyboard.dismiss();
    setLoading(true);

    try {
      if (searchType === "clubs") {
        // Query the "Clubs" table
        const clubs: Club[] = await searchClubsByName(query);
        setResults(clubs);
      } else {
        // Query the "profiles" table
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .like("username", `%${query}%`);

        if (error) throw error;
        if (data) setResults(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: Club | UserProfile }) {
    if (searchType === "clubs") {
      const club = item as Club;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => navigation.navigate("ClubDetail", { club })}
        >
          <Text style={styles.resultTitle}>{club.Name}</Text>
        </TouchableOpacity>
      );
    } else {
      const user = item as UserProfile;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => navigation.navigate("ProfileScreen", { user })}
        >
          <Text style={styles.resultTitle}>{user.username}</Text>
        </TouchableOpacity>
      );
    }
  }

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder={
            searchType === "clubs" ? "Search Clubs..." : "Search Users..."
          }
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchItems}
          returnKeyType="search"
        />
        <Button
          title="Search"
          onPress={searchItems}
          containerStyle={styles.btn}
        />
      </View>

      {/* Segmented Control (toggle clubs/users) */}
      <View style={styles.toggleContainer}>
        <Button
          title="Clubs"
          type={searchType === "clubs" ? "solid" : "outline"}
          onPress={() => setSearchType("clubs")}
          containerStyle={styles.toggleButton}
        />
        <Button
          title="Users"
          type={searchType === "users" ? "solid" : "outline"}
          onPress={() => setSearchType("users")}
          containerStyle={styles.toggleButton}
        />
      </View>

      {/* Results List */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  btn: {
    marginLeft: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    marginVertical: 10,
    justifyContent: "center",
  },
  toggleButton: {
    marginHorizontal: 5,
  },
  listContent: {
    paddingVertical: 10,
  },
  resultItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultTitle: {
    fontSize: 16,
  },
});
