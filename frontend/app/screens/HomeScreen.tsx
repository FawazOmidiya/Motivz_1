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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation"; // Import the types
import {
  fetchClubs,
  searchClubsByName,
  isClubOpenDynamic,
} from "../utils/supabaseService";
import * as Constants from "@/constants/Constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import ClubHours from "@/components/ClubHours"; // Import the ClubHours component

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen() {
  const [clubs, setClubs] = useState<types.Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  // Filters
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async (pageNum = 1) => {
    try {
      const clubData = await fetchClubs(pageNum);
      if (pageNum === 1) {
        setClubs(clubData);
      } else {
        setClubs((prevClubs) => [...prevClubs, ...clubData]);
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

  const navigation = useNavigation();

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
      if (!club.hours) return false; // No hours data, include club
      else if (filterOpen && !isClubOpenDynamic(club.hours)) return false;
      return true;
    });
  }, [clubs, filterOpen]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={"Search Clubs..."}
          placeholderTextColor="#fff"
          value={query}
          onChangeText={(text) => handleTextChange(text)}
          onSubmitEditing={searchItems}
          returnKeyType="search"
          clearButtonMode="always"
        />
        <Ionicons
          name="filter-sharp"
          size={24}
          color="white"
          onPress={() => handleOpen()}
        />
      </View>

      <Text style={styles.title}>
        Tonights <Text style={styles.Motivz}>Motivz</Text>
      </Text>

      {loading && !isLoadingMore ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={filteredClubs}
          extraData={clubs}
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
                  {item.hours && <ClubHours hours={item.hours} />}
                </View>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMoreClubs}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isLoadingMore ? (
              <ActivityIndicator
                size="small"
                color="#007AFF"
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
        }}
        backgroundStyle={{
          backgroundColor: Constants.backgroundCOLOR,
        }}
      >
        <BottomSheetView style={styles.modalSheet}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              // Example: Apply filter logic
              bottomSheetRef.current?.close();
            }}
          >
            <Text style={styles.filterText}>⭐ Show 4.5+ Rated Clubs</Text>
          </TouchableOpacity>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Open Now</Text>
            <Switch
              value={filterOpen}
              onValueChange={setFilterOpen}
              thumbColor={filterOpen ? "#007AFF" : "#ccc"}
            />
          </View>

          <TouchableOpacity onPress={handleClose} style={{ marginTop: 20 }}>
            <Text style={{ color: "white", textAlign: "center" }}>Close</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: Constants.backgroundCOLOR,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  searchInput: {
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    width: "70%",
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
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 10,
    marginBottom: 10,
  },
  clubImage: { width: 60, height: 60, borderRadius: 10, marginRight: 10 },
  clubInfo: { justifyContent: "center" },
  clubName: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  clubDetails: { fontSize: 14, color: Constants.whiteCOLOR },
  Motivz: {
    color: Constants.purpleCOLOR,
    fontSize: 30,
    textTransform: "uppercase",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  modalSheet: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
    padding: 20,
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  filterButton: {
    backgroundColor: Constants.greyCOLOR,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  filterText: {
    color: "#fff",
    fontSize: 16,
  },
  filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  filterLabel: { flex: 1, color: "#fff", fontSize: 16 },
  loadingMore: {
    marginVertical: 20,
  },
});
