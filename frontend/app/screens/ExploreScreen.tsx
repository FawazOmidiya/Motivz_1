import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { Text, Button } from "@rneui/themed";
import {
  supabase,
  searchClubsByName,
  searchUsersByName,
} from "../utils/supabaseService"; // or supabaseAuth
import { useNavigation } from "@react-navigation/native";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<types.UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  async function handleTextChange(text: string) {
    setQuery(text);
    if (text.length !== 0) {
      setLoading(true);
      try {
        const users = await searchUsersByName(text);
        setResults(users);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setResults([]);
    }
  }

  useEffect(() => {
    // Optionally, you can trigger a search on component mount or whenever `searchType` changes
    // searchItems();
  }, []);

  async function searchItems() {
    // Hide keyboard once search starts
    Keyboard.dismiss();
    setLoading(true);

    try {
      // Query the "profiles" table
      const users: types.UserProfile[] = await searchUsersByName(query);
      setResults(users);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: types.Club | types.UserProfile }) {
    {
      const user = item as types.UserProfile;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => navigation.navigate("UserProfile", { user })}
        >
          <Text style={styles.resultTitle}>{user.username}</Text>
        </TouchableOpacity>
      );
    }
  }
  async function handleFocus() {
    setLoading(true);

    try {
      // Query the "profiles" table
      const users: types.UserProfile[] = await searchUsersByName(query);
      setResults(users);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder={"Search Users..."}
            value={query}
            onChangeText={handleTextChange}
            onSubmitEditing={searchItems}
            returnKeyType="search"
            clearButtonMode="always"
            onFocus={handleFocus}
          />
          {results.length > 0 && (
            <Button
              title="Cancel"
              onPress={() => {
                setQuery("");
                setResults([]);
                Keyboard.dismiss();
              }}
              containerStyle={styles.btn}
              color={Constants.purpleCOLOR}
            />
          )}
          {results.length === 0 && (
            <Button
              title="Search"
              onPress={searchItems}
              containerStyle={styles.btn}
              color={Constants.purpleCOLOR}
            />
          )}
        </View>
        {/* Segmented Control (toggle clubs/users) */}
        {/* Results List */}
        {results.length === 0 ? (
          <Text style={{ marginTop: 20, color: Constants.whiteCOLOR }}>
            Coming Soon
          </Text>
        ) : loading ? (
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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Constants.backgroundCOLOR,
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
    backgroundColor: Constants.purpleCOLOR,
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
    backgroundColor: Constants.greyCOLOR,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultTitle: {
    fontSize: 16,
  },
});
