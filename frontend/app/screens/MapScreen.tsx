import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  Image,
} from "react-native";
import MapView, {
  Marker,
  Callout,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import * as Location from "expo-location";
import { fetchClubs } from "../utils/supabaseService"; // ✅ Fetch clubs from Supabase
import { getAddressFromCoordinates } from "../utils/geocodingAPI";

type LocationCoords = {
  latitude: number;
  longitude: number;
};

type Club = {
  id: number;
  Name: string;
  latitude: number;
  longitude: number;
  Rating: number;
  Image: string;
  tags: string[]; // Example: ["Live Music", "Cocktails", "Dance"]
};

export default function MapScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [region, setRegion] = useState<Region | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]); // ✅ Store clubs from Supabase

  useEffect(() => {
    const getLocation = async () => {
      try {
        // ✅ Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Please allow location access.");
          return;
        }

        // ✅ Get user's current location
        const userLocation = await Location.getCurrentPositionAsync({});
        const coords: LocationCoords = {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        };
        setLocation(coords);

        // ✅ Set map region to user's location
        setRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // ✅ Fetch address using geocoding service
        const formattedAddress = await getAddressFromCoordinates(
          coords.latitude,
          coords.longitude
        );
        setAddress(formattedAddress || "Unknown Location");

        // ✅ Fetch nearby clubs from Supabase
        const fetchedClubs = await fetchClubs();
        setClubs(fetchedClubs);
      } catch (error) {
        console.error("Error getting location:", error);
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <>
          <MapView
            style={styles.map}
            region={
              region ?? {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            }
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {/* ✅ Show user's marker #TODO
            I may choose to change this later with a personalized icon, similar to snapmaps
            */}
            {/* {location && (
              <Marker
                coordinate={location}
                title="You are here"
                description={address}
              />
            )} */}

            {/* ✅ Display all clubs from Supabase */}
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
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{club.Name}</Text>
                    <Text style={styles.calloutText}>
                      ⭐ {club.Rating} | {club.tags}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  addressContainer: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  addressText: { fontSize: 16, fontWeight: "bold" },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    maxWidth: 200, // ✅ Limit width to prevent line wrapping
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20, // ✅ Circular Image
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 4,
    borderRadius: 4,
    maxWidth: 180, // ✅ Prevents text from overflowing
  },
  calloutContainer: { alignItems: "center", padding: 5, width: 100 },
  calloutTitle: { fontWeight: "bold", fontSize: 14 },
  calloutText: { fontSize: 12 },
});
