import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import MapView, {
  Marker,
  Callout,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import * as Location from "expo-location";
import { fetchClubs } from "../utils/supabaseService";
import { getAddressFromCoordinates } from "../utils/geocodingAPI";
import { useNavigation } from "@react-navigation/native";

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
  const [clubs, setClubs] = useState<Club[]>([]);
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  // Create a ref to store the debounce timeout ID
  const regionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
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

        // Fetch nearby clubs from Supabase
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

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <MapView
          ref={mapRef}
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
              >
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
      )}
      <TouchableOpacity style={styles.button} onPress={recenterMap}>
        <Text style={styles.buttonText}>Recenter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
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
    borderColor: "#fff",
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
  calloutContainer: {
    alignItems: "center",
    padding: 5,
    width: 120,
  },
  calloutTitle: { fontWeight: "bold", fontSize: 14 },
  calloutText: { fontSize: 12 },
  button: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 25,
    elevation: 2,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
