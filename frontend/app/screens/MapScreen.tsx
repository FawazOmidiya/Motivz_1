import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ActivityIndicator, Text } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { getAddressFromCoordinates } from "../utils/geocodingAPI"; // ✅ Import Geocoding Service

type LocationCoords = {
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [region, setRegion] = useState<Region | null>(null);

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

        // ✅ Set map region with correct typing
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
                // ✅ Fallback to default region if `null`
                latitude: 37.7749, // Default San Francisco
                longitude: -122.4194,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            }
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {location && (
              <Marker
                coordinate={location}
                title="You are here"
                description={address}
              />
            )}
          </MapView>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>📍 {address}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
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
  addressText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
