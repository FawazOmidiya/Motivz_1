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
import { fetchClubs, searchClubsByName } from "../utils/supabaseService";
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

  useEffect(() => {
    const loadClubs = async () => {
      const clubData = await fetchClubs();
      setClubs(clubData);
      setLoading(false);
    };
    loadClubs();
  }, []);
  const navigation = useNavigation();
  async function searchItems() {
    Keyboard.dismiss();
    setLoading(true);
    try {
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

  const snapPoints = useMemo(() => ["50%"], []);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const handleOpen = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);
  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={"Search Clubs..."}
          placeholderTextColor="#fff"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchItems}
          returnKeyType="search"
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

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={clubs}
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
                  {/* Render dynamic operating hours using the 'hours' property */}
                  {item.hours && <ClubHours hours={item.hours} />}
                </View>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
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
    backgroundColor: "#212f66",
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
});
