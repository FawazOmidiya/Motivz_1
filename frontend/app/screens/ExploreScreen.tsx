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
  Dimensions,
} from "react-native";
import { Text, Button } from "react-native-paper";
import {
  supabase,
  searchClubsByName,
  searchUsersByName,
  fetchEventsByClub,
} from "../utils/supabaseService";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import defaultAvatar from "@/assets/images/default-avatar.png";

type NavigationProp = NativeStackNavigationProp<any, "UserProfile">;

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<types.UserProfile[]>([]);
  const [events, setEvents] = useState<types.Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      // For now, fetch all events from the test club
      const allEvents = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true })
        .limit(20);

      if (allEvents.error) {
        console.error("Error fetching events:", allEvents.error);
        return;
      }

      setEvents(allEvents.data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setEventsLoading(false);
    }
  };

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

  function renderUserItem({ item }: { item: types.UserProfile }) {
    const getInitials = (name: string) => {
      return name.charAt(0).toUpperCase();
    };
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => navigation.navigate("UserProfile", { user: item })}
      >
        <View style={styles.userInfoContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarInitial}>
                {getInitials(item.username)}
              </Text>
            </View>
          )}
          <Text variant="bodyMedium" style={styles.resultTitle}>
            {item.username}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderEventItem({ item }: { item: types.Event }) {
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const formatDay = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { weekday: "short" });
    };

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate("EventDetail", { event: item })}
        activeOpacity={0.8}
      >
        {/* Event Poster */}
        <View style={styles.eventPosterContainer}>
          {item.poster_url ? (
            <Image
              source={{ uri: item.poster_url }}
              style={styles.eventPoster}
            />
          ) : (
            <View style={styles.eventPosterPlaceholder}>
              <Ionicons
                name="calendar"
                size={32}
                color="rgba(255, 255, 255, 0.3)"
              />
            </View>
          )}
        </View>

        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.eventTime}>
            {formatTime(item.start_date)} • {formatDay(item.start_date)}
          </Text>
          {item.music_genres && item.music_genres.length > 0 && (
            <View style={styles.genreContainer}>
              <Ionicons
                name="musical-notes"
                size={12}
                color={Constants.purpleCOLOR}
              />
              <Text style={styles.genreText}>
                {item.music_genres.slice(0, 3).join(", ")}
              </Text>
            </View>
          )}
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
        ) : null}

        {/* Search Results Overlay */}
        {results.length > 0 && (
          <View style={styles.searchOverlay}>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}

        {/* Events Grid */}
        {results.length === 0 && (
          <>
            {eventsLoading ? (
              <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
                <Text style={styles.centeredText}>Loading events...</Text>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.centeredContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={64}
                  color="rgba(255, 255, 255, 0.3)"
                />
                <Text style={styles.centeredText}>No events found</Text>
              </View>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={renderEventItem}
                numColumns={2}
                columnWrapperStyle={styles.eventRow}
                contentContainerStyle={styles.eventsGrid}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
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
  // Event Grid Styles
  searchOverlay: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: Constants.backgroundCOLOR,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventsGrid: {
    paddingTop: 20,
  },
  eventRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  eventCard: {
    width: CARD_WIDTH,
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  eventPosterContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.75, // 75% of card height for poster
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  eventPoster: {
    width: "100%",
    height: "100%",
  },
  eventPosterPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  eventInfo: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
    lineHeight: 18,
  },
  eventTime: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 6,
  },
  genreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  genreText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginLeft: 4,
    flex: 1,
  },
});
