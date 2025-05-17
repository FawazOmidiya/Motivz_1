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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation"; // Import the types
import {
  fetchClubs,
  searchClubsByName,
  isClubOpenDynamic,
  fetchClubMusicSchedules,
} from "../utils/supabaseService";
import * as Constants from "@/constants/Constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import ClubHours from "@/components/ClubHours"; // Import the ClubHours component
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const [clubs, setClubs] = useState<types.Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [musicSchedules, setMusicSchedules] = useState<
    Record<string, types.musicGenres>
  >({});

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

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async (pageNum = 1) => {
    try {
      const clubData = await fetchClubs();
      if (pageNum === 1) {
        setClubs(clubData);
        // Fetch music schedules for all clubs
        const schedules: Record<string, types.musicGenres> = {};
        // For testing, set to Friday (5)
        const today = new Date().getDay();
        for (const club of clubData) {
          const schedule = await fetchClubMusicSchedules(club.id, today);
          if (schedule) {
            schedules[club.id] = schedule;
          }
        }
        setMusicSchedules(schedules);
      } else {
        setClubs((prevClubs) => [...prevClubs, ...clubData]);
        // Fetch music schedules for new clubs
        const newSchedules = { ...musicSchedules };
        const today = new Date().getDay();
        for (const club of clubData) {
          const schedule = await fetchClubMusicSchedules(club.id, today);
          if (schedule) {
            newSchedules[club.id] = schedule;
          }
        }
        setMusicSchedules(newSchedules);
      }
      setHasMore(clubData.length === 10); // Assuming pageSize is 10
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
      const clubs: types.Club[] = await searchClubsByName(query);
      setClubs(clubs);
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
      setClubs(clubData);
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

  // Apply filters
  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      // Check if club is open if filterOpen is true
      if (filterOpen && club.hours && !isClubOpenDynamic(club.hours)) {
        return false;
      }

      // Check rating filter
      if (minRating > 0 && club.Rating < minRating) {
        return false;
      }

      // Check genre filter if any genres are selected
      if (selectedGenres.length > 0) {
        const schedule = musicSchedules[club.id];
        if (!schedule) return false;

        // Check if any of the selected genres have a positive value in the schedule
        return selectedGenres.some((genre) => {
          const genreValue = schedule[genre as keyof types.musicGenres];
          return typeof genreValue === "number" && genreValue > 0;
        });
      }

      return true;
    });
  }, [clubs, filterOpen, selectedGenres, musicSchedules, minRating]);

  const getTopGenres = (clubId: string) => {
    const schedule = musicSchedules[clubId];
    if (!schedule) return "No music schedule";

    // Get all numeric genre values
    const genreEntries = Object.entries(schedule)
      .filter(([key, value]) => typeof value === "number" && value > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]));

    // Return top 3 genres
    const topGenres = genreEntries.slice(0, 3).map(([genre]) => genre);
    return topGenres.length > 0 ? topGenres.join(", ") : "No music today";
  };

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
          extraData={clubs}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate("ClubDetail", { club: item })}
              style={styles.clubCardContainer}
            >
              <Image source={{ uri: item.Image }} style={styles.clubImage} />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.imageGradient}
              />
              <View style={styles.clubInfo}>
                <Text style={styles.clubName}>{item.Name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{item.Rating}</Text>
                </View>
                <View style={styles.genreContainer}>
                  <Ionicons name="musical-notes" size={16} color="#fff" />
                  <Text style={styles.genreText}>{getTopGenres(item.id)}</Text>
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
          <Text style={styles.sheetTitle}>Filters</Text>
          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <View style={styles.filterLabelContainer}>
                <Ionicons
                  name="time"
                  size={20}
                  color="#fff"
                  style={styles.filterIcon}
                />
                <Text style={styles.filterLabel}>Open Now</Text>
              </View>
              <Switch
                value={filterOpen}
                onValueChange={setFilterOpen}
                trackColor={{ false: "#767577", true: Constants.purpleCOLOR }}
                thumbColor={filterOpen ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Music Genres</Text>
            <ScrollView
              style={styles.genreScrollContainer}
              contentContainerStyle={styles.genreGridContainer}
            >
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
            </ScrollView>
          </View>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Minimum Rating</Text>
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
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Apply Filters</Text>
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
  filterSection: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterIcon: {
    marginRight: 10,
  },
  filterLabel: {
    color: "#fff",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: Constants.purpleCOLOR,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
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
});
