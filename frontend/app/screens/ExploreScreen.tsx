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
  Image,
} from "react-native";
import { Text, Button } from "react-native-paper";
import {
  supabase,
  searchClubsByName,
  searchUsersByName,
} from "../utils/supabaseService";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import { defaultAvatar } from "@/assets/images/default-avatar.png";

type NavigationProp = NativeStackNavigationProp<any, "UserProfile">;

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<types.UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();

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

  function renderItem({ item }: { item: types.UserProfile }) {
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => navigation.navigate("UserProfile", { user: item })}
      >
        <View style={styles.userInfoContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <Image source={defaultAvatar} style={styles.avatar} />
          )}
          <Text variant="bodyMedium" style={styles.resultTitle}>
            {item.username}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  async function handleFocus() {
    setLoading(true);

    try {
      setResults(await searchUsersByName(query));
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
            placeholder={"Find Friends..."}
            placeholderTextColor={Constants.whiteCOLOR}
            value={query}
            onChangeText={handleTextChange}
            onSubmitEditing={searchItems}
            returnKeyType="search"
            clearButtonMode="always"
            onFocus={handleFocus}
          />
          {results.length > 0 && (
            <Button
              mode="contained"
              onPress={() => {
                setQuery("");
                setResults([]);
                Keyboard.dismiss();
              }}
              style={styles.btn}
              buttonColor={Constants.purpleCOLOR}
            >
              Cancel
            </Button>
          )}
          {results.length === 0 && (
            <Button
              mode="contained"
              onPress={searchItems}
              style={styles.btn}
              buttonColor={Constants.purpleCOLOR}
            >
              Search
            </Button>
          )}
        </View>
        {/* Results List */}
        {results.length === 0 ? (
          <View style={styles.centeredContainer}>
            {/* <Text variant="bodyLarge" style={styles.centeredText}>
              Explore Page Coming Soon...
            </Text> */}
            <Text variant="bodyMedium" style={styles.centeredText}>
              Find your friends above
            </Text>
          </View>
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
    backgroundColor: Constants.greyCOLOR,
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
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 16,
    color: "#fff",
  },
  resultItem: {
    backgroundColor: Constants.greyCOLOR,
    marginBottom: 10,
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
  },
});
