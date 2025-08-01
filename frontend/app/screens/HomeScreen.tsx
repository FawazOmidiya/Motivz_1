import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Keyboard,
  TouchableOpacity,
  TextInput,
  Switch,
  Dimensions,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import * as types from "@/app/utils/types";
import { Club } from "@/app/utils/Club";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation"; // Import the types
import {
  fetchClubs,
  isClubOpenDynamic,
  searchClubsByName,
  fetchFriendsAttending,
} from "../utils/supabaseService";
import * as Constants from "@/constants/Constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import ClubHours from "@/components/ClubHours"; // Import the ClubHours component
import { LinearGradient } from "expo-linear-gradient";
import { useSession } from "@/components/SessionContext";

const { width } = Dimensions.get("window");

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  // Filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  const GENRES = [
    "EDM",
    "HipHop",
    "Rock",
    "Pop",
    "House",
    "Jazz",
    "R&B",
    "Latin",
    "Top40",
    "90's",
    "2000's",
    "2010's",
    "Afrobeats",
    "Reggae",
    "Blues",
    "Soul",
    "Amapiano",
    "Country",
  ];

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prevSelected) =>
      prevSelected.includes(genre)
        ? prevSelected.filter((g) => g !== genre)
        : [...prevSelected, genre]
    );
  };

  const [friendsAttending, setFriendsAttending] = useState<{
    [clubId: string]: { id: string; avatar_url: string | null }[];
  }>({});

  const session = useSession();

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    if (clubs.length === 0 || !session?.user?.id) return;
    let mounted = true;
    (async () => {
      const result: {
        [clubId: string]: { id: string; avatar_url: string | null }[];
      } = {};
      await Promise.all(
        clubs.map(async (club) => {
          result[club.id] = await fetchFriendsAttending(
            club.id,
            session.user.id
          );
        })
      );
      if (mounted) setFriendsAttending(result);
    })();
    return () => {
      mounted = false;
    };
  }, [clubs, session?.user?.id]);

  const loadClubs = async (pageNum = 1) => {
    try {
      const clubData = await fetchClubs();
      const today = new Date().getDay();

      // Convert raw club data to Club objects
      const clubObjects = clubData.map((data) => new Club(data));

      // Load music schedules in parallel
      await Promise.all(
        clubObjects.map((club) => club.loadMusicSchedule(today))
      );

      // Load live ratings in parallel
      await Promise.all(clubObjects.map((club) => club.initLiveRating()));

      if (pageNum === 1) {
        setClubs(clubObjects);
      } else {
        setClubs((prevClubs) => [...prevClubs, ...clubObjects]);
      }

      setHasMore(clubData.length === 10);
    } catch (error) {
      console.error("Error loading clubs:", error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreClubs = () => {
    if (!hasMore || isLoadingMore || searchMode) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    loadClubs(nextPage);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setSearchMode(false);
    await loadClubs(1);
    setRefreshing(false);
  }, []);

  const navigation = useNavigation<HomeScreenNavigationProp>();

  async function searchItems() {
    Keyboard.dismiss();
    setLoading(true);
    setSearchMode(true);
    try {
      const clubData = await searchClubsByName(query);
      const clubObjects = clubData.map((data) => new Club(data));
      setClubs(clubObjects);
      setHasMore(false); // Disable infinite scroll in search mode
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTextChange(text: string) {
    setQuery(text);
    if (text.length === 0) {
      setSearchMode(false);
      setPage(1);
      await loadClubs(1);
      return;
    }

    setLoading(true);
    setSearchMode(true);
    try {
      const clubData = await searchClubsByName(text);
      const clubObjects = clubData.map((data) => new Club(data));
      setClubs(clubObjects);
      setHasMore(false); // Disable infinite scroll in search mode
    } catch (error) {
      console.error("Error fetching clubs:", error);
    } finally {
      setLoading(false);
    }
  }

  const snapPoints = useMemo(() => ["50%"], []);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const handleOpen = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);
  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  // Apply filters and sort by open status
  const filteredClubs = useMemo(() => {
    const filtered = clubs.filter((club) => {
      if (filterOpen) {
        // Defensive: skip if club or club.hours is missing, or if isOpen throws
        try {
          if (!club || !club.hours) return false;
          if (typeof club.isOpen !== "function") return false;
          if (!isClubOpenDynamic(club.hours)) return false;
        } catch (e) {
          return true;
        }
      }

      if (minRating > 0 && club.rating < minRating) {
        return false;
      }

      if (selectedGenres.length > 0) {
        const schedule = club.musicSchedule;
        if (!schedule) return false;

        // Check if any of the selected genres have a positive value in the schedule
        return selectedGenres.some((genre) => {
          const genreValue = schedule[genre as keyof types.musicGenres];
          return typeof genreValue === "number" && genreValue > 0;
        });
      }

      return true;
    });

    // Sort clubs: open clubs first, then by rating (highest first)
    return filtered.sort((a, b) => {
      // First, check if clubs are open
      let aIsOpen = false;
      let bIsOpen = false;

      try {
        aIsOpen = a.hours ? isClubOpenDynamic(a.hours) : false;
        bIsOpen = b.hours ? isClubOpenDynamic(b.hours) : false;
      } catch (e) {
        // If there's an error checking open status, treat as closed
        aIsOpen = false;
        bIsOpen = false;
      }

      // If one is open and the other isn't, open club comes first
      if (aIsOpen && !bIsOpen) return -1;
      if (!aIsOpen && bIsOpen) return 1;

      // If both have the same open status, sort by rating (highest first)
      const aRating =
        a.live_rating !== undefined && a.live_rating !== null
          ? a.live_rating
          : a.rating;
      const bRating =
        b.live_rating !== undefined && b.live_rating !== null
          ? b.live_rating
          : b.rating;

      return bRating - aRating;
    });
  }, [clubs, filterOpen, selectedGenres, minRating]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={styles.headerGradient}
      />
      <View style={styles.header}>
        <Text style={styles.title}>
          Tonight's <Text style={styles.Motivz}>Motivz</Text>
        </Text>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#fff"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={"Search Clubs..."}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={query}
              onChangeText={(text) => handleTextChange(text)}
              onSubmitEditing={searchItems}
              returnKeyType="search"
              clearButtonMode="always"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => handleOpen()}
          >
            <Ionicons name="filter-sharp" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !isLoadingMore ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
        </View>
      ) : filteredClubs.length === 0 ? (
        <View style={styles.noMatchesContainer}>
          <Ionicons
            name="musical-notes"
            size={48}
            color={Constants.purpleCOLOR}
          />
          <Text style={styles.noMatchesTitle}>No Matches Found</Text>
          <Text style={styles.noMatchesText}>
            {selectedGenres.length > 0
              ? "No clubs found matching your selected genres"
              : "No clubs found matching your filters"}
          </Text>
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSelectedGenres([]);
              setFilterOpen(false);
              setMinRating(0);
            }}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredClubs}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ClubDetail", { club: item.toJSON() })
              }
              style={styles.clubCardContainer}
            >
              <Image source={{ uri: item.image }} style={styles.clubImage} />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.imageGradient}
              />
              <View style={styles.clubInfo}>
                <Text style={styles.clubName}>{item.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {item.live_rating !== undefined && item.live_rating !== null
                      ? item.live_rating
                      : item.rating}
                  </Text>
                </View>
                <View style={styles.friendsRow}>
                  {friendsAttending[item.id] &&
                    friendsAttending[item.id].slice(0, 3).map((friend, idx) => (
                      <View
                        key={friend.id}
                        style={[
                          styles.friendAvatar,
                          {
                            marginLeft: idx === 0 ? 0 : -12,
                            zIndex: 3 - idx,
                          },
                        ]}
                      >
                        {friend.avatar_url ? (
                          <Image
                            source={{ uri: friend.avatar_url }}
                            style={styles.friendAvatarImage}
                          />
                        ) : (
                          <Ionicons name="person" size={20} color="#fff" />
                        )}
                      </View>
                    ))}
                  {friendsAttending[item.id] &&
                    friendsAttending[item.id].length > 3 && (
                      <View
                        style={[
                          styles.friendAvatar,
                          styles.plusAvatar,
                          {
                            marginLeft: -12,
                            zIndex: 1,
                          },
                        ]}
                      >
                        <Text style={styles.plusText}>
                          +{friendsAttending[item.id].length - 3}
                        </Text>
                      </View>
                    )}
                </View>
                <View style={styles.genreContainer}>
                  <Ionicons name="musical-notes" size={16} color="#fff" />
                  <Text style={styles.genreText}>{item.getTopGenres()}</Text>
                </View>
                {item.hours && <ClubHours hours={item.hours} />}
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Constants.purpleCOLOR}
            />
          }
          onEndReached={loadMoreClubs}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isLoadingMore ? (
              <ActivityIndicator
                size="small"
                color={Constants.purpleCOLOR}
                style={styles.loadingMore}
              />
            ) : null
          }
        />
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: Constants.whiteCOLOR,
          width: 40,
        }}
        backgroundComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.modalSheet}>
          <View style={styles.filterHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setFilterOpen(false);
                setSelectedGenres([]);
                setMinRating(0);
              }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterOpen && styles.filterPillActive,
                ]}
                onPress={() => setFilterOpen(!filterOpen)}
              >
                <Ionicons
                  name="time"
                  size={16}
                  color={filterOpen ? "#fff" : "rgba(255,255,255,0.7)"}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    filterOpen && styles.filterPillTextActive,
                  ]}
                >
                  Open Now
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Music Genres</Text>
            <View style={styles.genreGrid}>
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreBtn,
                    selectedGenres.includes(genre) && styles.genreSel,
                  ]}
                  onPress={() => toggleGenre(genre)}
                >
                  <Text
                    style={[
                      styles.genreTxt,
                      selectedGenres.includes(genre) && styles.genreTxtSel,
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingFilterContainer}>
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingBtn,
                    minRating === rating && styles.ratingBtnSel,
                  ]}
                  onPress={() => setMinRating(rating)}
                >
                  <Text
                    style={[
                      styles.ratingTxt,
                      minRating === rating && styles.ratingTxtSel,
                    ]}
                  >
                    {rating === 0 ? "Any" : `${rating}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity onPress={handleClose} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: "#fff",
    fontSize: 16,
  },
  filterButton: {
    width: 45,
    height: 45,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 20,
  },
  clubCardContainer: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: Constants.greyCOLOR,
  },
  clubImage: {
    width: "100%",
    height: 200,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  clubInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  clubName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    alignSelf: "flex-start",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  ratingText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 14,
  },
  genreContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  genreText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 14,
  },
  Motivz: {
    color: Constants.purpleCOLOR,
    fontSize: 32,
    textTransform: "uppercase",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSheet: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
    padding: 20,
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  filterContent: {
    flex: 1,
  },
  filterRow: {
    marginBottom: 20,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-start",
  },
  filterPillActive: {
    backgroundColor: Constants.purpleCOLOR,
  },
  filterPillText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginLeft: 8,
  },
  filterPillTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  applyButton: {
    backgroundColor: Constants.purpleCOLOR,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingMore: {
    marginVertical: 20,
  },
  genreScrollContainer: {
    maxHeight: 200,
    marginTop: 10,
  },
  genreGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  genreSel: {
    backgroundColor: Constants.purpleCOLOR,
  },
  genreTxt: {
    color: "#fff",
    fontSize: 14,
  },
  genreTxtSel: {
    fontWeight: "bold",
  },
  noMatchesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noMatchesTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  noMatchesText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  ratingFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  ratingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  ratingBtnSel: {
    backgroundColor: Constants.purpleCOLOR,
  },
  ratingTxt: {
    color: "#fff",
    fontSize: 14,
  },
  ratingTxtSel: {
    fontWeight: "bold",
  },
  friendsRow: {
    flexDirection: "row",
    marginTop: 4,
    height: 32,
    position: "absolute",
    bottom: 15,
    right: "5%",
    zIndex: 3,
    alignItems: "center",
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#888",
    justifyContent: "center",
    alignItems: "center",
  },
  friendAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  plusAvatar: {
    backgroundColor: "#888",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  plusText: { color: "#fff", fontWeight: "bold" },
});
