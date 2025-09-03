import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
  Pressable,
  Linking,
} from "react-native";
import MapView, {
  Marker,
  Callout,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import * as Location from "expo-location";
import { fetchClubs, searchClubsByName } from "../utils/supabaseService";
import {
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
} from "../utils/geocodingAPI";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Constants from "@/constants/Constants";
import * as types from "@/app/utils/types";
import { LinearGradient } from "expo-linear-gradient";

type LocationCoords = {
  latitude: number;
  longitude: number;
};

// Using the imported Club type from types
type Club = types.Club;

export default function MapScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [region, setRegion] = useState<Region | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [queriedClubs, setQueriedClubs] = useState<Club[]>([]);
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  // Create a ref to store the debounce timeout ID
  const regionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [clubParam, setClubParam] = useState<Club | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
        // Request location permissions first
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Location Permission Required",
            "This app needs location access to show nearby clubs and your current location on the map.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
          setLoading(false);
          return;
        }

        if (clubParam) {
          // Focus on the club if provided
          setRegion({
            latitude: clubParam.latitude,
            longitude: clubParam.longitude,
            latitudeDelta: 0.003, // closer zoom
            longitudeDelta: 0.003,
          });
        } else {
          // Get user's current location
          const userLocation = await Location.getCurrentPositionAsync({});
          const coords: LocationCoords = {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          };
          setLocation(coords);

          // Set map region to user's location
          setRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });

          // Fetch address using geocoding service
          const formattedAddress = await getAddressFromCoordinates(
            coords.latitude,
            coords.longitude
          );
          setAddress(formattedAddress || "Unknown Location");

          // Fetch all clubs from Supabase
          const fetchedClubs = await fetchClubs();
          setAllClubs(fetchedClubs);
          setClubs(fetchedClubs);
        }
      } catch (error) {
        console.error("Error getting location:", error);
        Alert.alert(
          "Location Error",
          "Unable to get your location. Please check your location settings and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, [clubParam]);

  const recenterMap = async () => {
    const locationData = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = locationData.coords;
    const zoomedRegion: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.005, // Closer zoom
      longitudeDelta: 0.005,
    };

    // Animate to the zoomed region over 1000 ms.
    mapRef.current?.animateToRegion(zoomedRegion, 1000);

    // Delay updating state until after the animation.
    setTimeout(() => {
      setRegion(zoomedRegion);
    }, 1000);
  };

  const handleSearch = async () => {
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const searchedClubs = await searchClubsByName(searchQuery);
      setQueriedClubs(searchedClubs.slice(0, 3));
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "An error occurred while searching.");
    } finally {
      setIsSearching(false);
    }
  };

  const queryClub = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setIsSearching(true);
      try {
        const searchedClubs = await searchClubsByName(text);
        setQueriedClubs(searchedClubs.slice(0, 3));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setQueriedClubs([]);
    }
  };

  function renderItem({ item }: { item: types.Club }) {
    const newRegion: Region = {
      latitude: item.latitude,
      longitude: item.longitude,
      latitudeDelta: 0.003, // closer zoom
      longitudeDelta: 0.003,
    };
    const moveToClub = () => {
      mapRef.current?.animateToRegion(newRegion, 1000);
      setRegion(newRegion);
      setQueriedClubs([]);
    };
    return (
      <Pressable
        onPress={moveToClub}
        style={({ pressed }) => [
          styles.dropdownItem,
          pressed && styles.dropdownItemPressed,
        ]}
      >
        <Text style={styles.dropdownItemText}>{item.Name}</Text>
      </Pressable>
    );
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
        ) : (
          <>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons
                  name="search"
                  size={20}
                  color={Constants.whiteCOLOR}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search clubs or locations..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={searchQuery}
                  onChangeText={queryClub}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={Constants.whiteCOLOR}
                    />
                  </TouchableOpacity>
                )}
              </View>
              {queriedClubs.length > 0 && (
                <View style={styles.searchResultContainer}>
                  <FlatList
                    data={queriedClubs}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.searchResultsList}
                  />
                </View>
              )}
            </View>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={
                region ?? {
                  latitude: 43.6548,
                  longitude: 79.3883,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              }
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {clubs.map((club) => (
                <Marker
                  key={club.id}
                  coordinate={{
                    latitude: club.latitude,
                    longitude: club.longitude,
                  }}
                >
                  <View style={styles.markerContainer}>
                    <Image
                      source={{ uri: club.Image }}
                      style={styles.markerImage}
                    />
                    <Text style={styles.markerText}>{club.Name}</Text>
                  </View>
                  <Callout
                    onPress={() => navigation.navigate("ClubDetail", { club })}
                    style={styles.callout}
                  >
                    <View style={styles.calloutContainer}>
                      <Image
                        source={{ uri: club.Image }}
                        style={styles.calloutImage}
                      />
                      <View style={styles.calloutContent}>
                        <Text style={styles.calloutTitle}>{club.Name}</Text>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.ratingText}>{club.Rating}</Text>
                        </View>
                        <View style={styles.tagsContainer}>
                          {club.Tags?.map((tag: string, index: number) => (
                            <View key={index} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
            <TouchableOpacity style={styles.button} onPress={recenterMap}>
              <Ionicons name="locate" size={24} color={Constants.whiteCOLOR} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  searchContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Constants.backgroundCOLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    marginBottom: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Constants.whiteCOLOR,
    fontSize: 16,
    height: "100%",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    maxWidth: 200,
    flex: 1,
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Constants.purpleCOLOR,
  },
  markerText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 4,
    borderRadius: 4,
    maxWidth: 180,
    flexWrap: "wrap",
  },
  callout: {
    width: 200,
    padding: 0,
  },
  calloutContainer: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: Constants.backgroundCOLOR,
    borderRadius: 12,
  },
  calloutImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  calloutContent: {
    flex: 1,
    justifyContent: "center",
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Constants.whiteCOLOR,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: Constants.whiteCOLOR,
  },
  button: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: Constants.purpleCOLOR,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  searchResultContainer: {
    backgroundColor: "rgba(20,20,20,0.85)", // almost see-through dark
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchResultsList: {
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "transparent",
  },
  dropdownItemPressed: {
    backgroundColor: "rgba(128,0,255,0.08)",
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
