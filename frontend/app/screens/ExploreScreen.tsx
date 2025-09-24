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
  RefreshControl,
  ScrollView,
  Modal,
} from "react-native";
import { Text, Button } from "react-native-paper";
import DatePicker from "react-native-ui-datepicker";
import { supabase, searchUsersByName } from "../utils/supabaseService";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import EventItem from "@/components/EventItem";
import { useSession } from "@/components/SessionContext";

type NavigationProp = NativeStackNavigationProp<any, "UserProfile">;

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

// Music genres for filtering
const MUSIC_GENRES = [
  "HipHop",
  "Pop",
  "Soul",
  "Rap",
  "House",
  "Latin",
  "EDM",
  "Jazz",
  "Country",
  "Blues",
  "DanceHall",
  "Afrobeats",
  "Top 40",
  "Amapiano",
  "90's",
  "2000's",
  "2010's",
  "R&B",
];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<types.UserProfile[]>([]);
  const [events, setEvents] = useState<types.Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<types.Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [trendingEvents, setTrendingEvents] = useState<types.Event[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const session = useSession();

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Apply filters when selectedGenres, selectedDate, or events change
  useEffect(() => {
    applyFilters();
  }, [selectedGenres, selectedDate, events]);

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      // Fetch upcoming events (end date is later than now)
      const now = new Date().toISOString();
      const allEvents = await supabase
        .from("events")
        .select("*")
        .gt("end_date", now)
        .order("start_date", { ascending: true })
        .limit(20);

      if (allEvents.error) {
        console.error("Error fetching events:", allEvents.error);
        return;
      }

      const eventsData = allEvents.data || [];

      // Calculate trending events if user is logged in
      if (session?.user?.id) {
        const eventsWithTrending = await calculateTrendingEvents(eventsData);
        setEvents(eventsWithTrending);
      } else {
        setEvents(eventsData);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setEventsLoading(false);
    }
  };

  const calculateTrendingEvents = async (
    eventsData: types.Event[]
  ): Promise<types.Event[]> => {
    if (!session?.user?.id) return eventsData;

    try {
      // Get all event IDs
      const eventIds = eventsData.map((event) => event.id);

      // Fetch all friends attending data in a single query
      const { data: friendsAttendingData, error } = await supabase
        .from("events")
        .select(
          `
          id,
          attendees
        `
        )
        .in("id", eventIds)
        .not("attendees", "is", null);

      if (error) {
        console.error("Error fetching friends attending data:", error);
        return eventsData;
      }

      // Get user's friends list
      const { data: friendsData, error: friendsError } = await supabase
        .from("friendships")
        .select(
          `
          requester_id,
          receiver_id,
          status
        `
        )
        .or(
          `requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`
        )
        .eq("status", "friends");

      if (friendsError) {
        console.error("Error fetching friends list:", friendsError);
        return eventsData;
      }

      const friendIds =
        friendsData?.map((f) =>
          f.requester_id === session.user.id ? f.receiver_id : f.requester_id
        ) || [];

      const trendingEventsList: types.Event[] = [];
      const regularEventsList: types.Event[] = [];

      for (const event of eventsData) {
        const eventData = friendsAttendingData?.find((e) => e.id === event.id);
        const attendees = eventData?.attendees || [];

        // Count how many friends are attending this event
        const friendsAttendingCount = attendees.filter((attendeeId: string) =>
          friendIds.includes(attendeeId)
        ).length;

        if (friendsAttendingCount > 0) {
          // Add trending properties to the event
          const trendingEvent = {
            ...event,
            is_trending: true,
            has_friends_attending: true,
            friends_attending_count: friendsAttendingCount,
          };
          trendingEventsList.push(trendingEvent);
        } else {
          regularEventsList.push(event);
        }
      }

      // Sort trending events by number of friends attending (descending)
      trendingEventsList.sort(
        (a, b) =>
          (b.friends_attending_count || 0) - (a.friends_attending_count || 0)
      );

      // Combine trending events first, then regular events
      const combinedEvents = [...trendingEventsList, ...regularEventsList];
      setTrendingEvents(trendingEventsList);
      return combinedEvents;
    } catch (error) {
      console.error("Error calculating trending events:", error);
      return eventsData;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear search results if there's a query
      if (query.length > 0) {
        setResults([]);
      }
      // Refresh events
      await fetchEvents();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = events;

    // Apply genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter((event) => {
        if (!event.music_genres || event.music_genres.length === 0) {
          return false;
        }
        return selectedGenres.some((genre) =>
          event.music_genres?.includes(genre)
        );
      });
    }

    // Apply date filter
    if (selectedDate) {
      // Create a date range for the selected date (start and end of day in local timezone)
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.start_date);
        // Check if the event date falls within the selected day (accounting for timezone)
        return eventDate >= startOfDay && eventDate <= endOfDay;
      });
    }

    setFilteredEvents(filtered);
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedDate(null);
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

  const handleEventPress = (event: types.Event) => {
    navigation.navigate("EventDetail", { event });
  };

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
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            textContentType="none"
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

        {/* Filter Section - Only show when not searching */}
        {results.length === 0 && (
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="filter" size={20} color={Constants.whiteCOLOR} />
              <Text style={styles.filterButtonText}>
                {selectedGenres.length > 0 || selectedDate
                  ? `Filter (${selectedGenres.length + (selectedDate ? 1 : 0)})`
                  : "Filter Events"}
              </Text>
            </TouchableOpacity>
            {(selectedGenres.length > 0 || selectedDate) && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={clearFilters}
              >
                <Ionicons name="close" size={16} color={Constants.whiteCOLOR} />
              </TouchableOpacity>
            )}
          </View>
        )}
        {/* Main Content - Single State Display */}
        {results.length > 0 ? (
          /* Search Results */
          <View style={styles.searchOverlay}>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              contentContainerStyle={styles.listContent}
            />
          </View>
        ) : filteredEvents.length > 0 ? (
          /* Events Grid */
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EventItem
                event={item}
                onPress={handleEventPress}
                sourceScreen="explore"
              />
            )}
            numColumns={2}
            columnWrapperStyle={styles.eventRow}
            contentContainerStyle={styles.eventsGrid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
                colors={[Constants.purpleCOLOR]}
              />
            }
          />
        ) : null}

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Events</Text>
                <TouchableOpacity
                  onPress={() => setShowFilterModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Constants.whiteCOLOR}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Date Filter Section */}
                <View style={styles.dateFilterSection}>
                  <TouchableOpacity
                    style={styles.dateToggleButton}
                    onPress={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={Constants.purpleCOLOR}
                    />
                    <Text style={styles.dateToggleText}>
                      {selectedDate
                        ? selectedDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Select a date"}
                    </Text>
                    <Ionicons
                      name={showDatePicker ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={Constants.purpleCOLOR}
                    />
                  </TouchableOpacity>

                  {/* Date Picker - Conditionally rendered */}
                  {showDatePicker && (
                    <View style={styles.datePickerContent}>
                      <DatePicker
                        mode="single"
                        date={selectedDate || new Date()}
                        onChange={(params) => {
                          if (params.date) {
                            // Handle different date types (Date, string, number, Dayjs)
                            let date: Date;
                            if (params.date instanceof Date) {
                              date = params.date;
                            } else if (
                              typeof params.date === "string" ||
                              typeof params.date === "number"
                            ) {
                              date = new Date(params.date);
                            } else {
                              // Handle Dayjs or other date libraries
                              date = new Date(params.date.toString());
                            }
                            setSelectedDate(date);
                          }
                        }}
                        minDate={new Date()}
                        style={styles.calendar}
                        styles={{
                          today: {
                            borderColor: Constants.purpleCOLOR,
                            borderWidth: 1,
                            borderRadius: 8,
                          },
                          selected: {
                            backgroundColor: Constants.purpleCOLOR,
                            borderRadius: 8,
                            borderWidth: 0,
                            padding: 2,
                            margin: 1,
                          },
                          selected_label: {
                            color: "white",
                            fontWeight: "600",
                          },
                          day: { color: "white" },
                          day_label: { color: "white" },
                          weekday: { color: "white" },
                          weekday_label: { color: "white" },
                          month: { color: "white" },
                          month_label: { color: "white" },
                          year: { color: "white" },
                          year_label: { color: "white" },
                          month_selector_label: { color: "white" },
                          year_selector_label: { color: "white" },
                          day_cell: {
                            color: "white",
                            borderRadius: 10,
                            borderWidth: 0,
                            padding: 1,
                            marginHorizontal: 2,
                          },
                        }}
                      />
                    </View>
                  )}
                </View>

                {/* Genre Filter Section */}
                <View style={styles.genreFilterSection}>
                  <Text style={styles.sectionTitle}>Filter by Music Genre</Text>

                  <ScrollView
                    style={styles.genresContainer}
                    contentContainerStyle={styles.genresContentContainer}
                  >
                    {MUSIC_GENRES.map((genre) => (
                      <TouchableOpacity
                        key={genre}
                        style={[
                          styles.genreButton,
                          selectedGenres.includes(genre) &&
                            styles.genreButtonSelected,
                        ]}
                        onPress={() => handleGenreToggle(genre)}
                      >
                        <Text
                          style={[
                            styles.genreButtonText,
                            selectedGenres.includes(genre) &&
                              styles.genreButtonTextSelected,
                          ]}
                        >
                          {genre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearAllButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  centeredSubtext: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  // No Results Styles
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noResultsContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  noResultsIcon: {
    marginBottom: 24,
  },
  noResultsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    textAlign: "center",
    marginBottom: 12,
  },
  noResultsSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  featureList: {
    width: "100%",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    marginLeft: 12,
    fontWeight: "500",
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
  // Filter Styles
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Constants.greyCOLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    color: Constants.whiteCOLOR,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  clearFilterButton: {
    backgroundColor: Constants.purpleCOLOR,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Constants.backgroundCOLOR,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  closeButton: {
    padding: 4,
  },
  genresContainer: {
    maxHeight: 400,
    padding: 20,
  },
  genresContentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  genreButton: {
    backgroundColor: Constants.greyCOLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
    width: "31%", // Three columns with small gap
    alignItems: "center",
  },
  genreButtonSelected: {
    backgroundColor: Constants.purpleCOLOR,
  },
  genreButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "500",
  },
  genreButtonTextSelected: {
    color: Constants.whiteCOLOR,
    fontWeight: "bold",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  clearAllButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Constants.purpleCOLOR,
  },
  clearAllButtonText: {
    color: Constants.purpleCOLOR,
    fontSize: 14,
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  applyButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "bold",
  },
  // Date Filter Styles
  dateFilterSection: {
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  genreFilterSection: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 12,
  },
  dateToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 8,
  },
  dateToggleText: {
    flex: 1,
    color: Constants.whiteCOLOR,
    fontSize: 16,
    marginLeft: 8,
  },
  datePickerContent: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Constants.greyCOLOR,
  },
  calendar: {
    backgroundColor: "transparent",
    marginBottom: 16,
    height: 280, // Make calendar slightly larger
    borderRadius: 8,
    overflow: "hidden",
    // Add some custom styling to enhance selected date visibility
  },
  modalScrollView: {
    maxHeight: 500,
  },
  selectedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedDateText: {
    flex: 1,
    color: Constants.whiteCOLOR,
    fontSize: 14,
  },
  clearDateButton: {
    marginLeft: 8,
  },
});
