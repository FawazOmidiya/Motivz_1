import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Alert,
  FlatList,
  Image,
  Dimensions,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Text } from "@rneui/themed";
import { useRoute } from "@react-navigation/native";
import { fetchUserFavourites } from "../utils/supabaseService";
import * as types from "@/app/utils/types";
import FavouriteClub from "@/components/ClubFavourite";
import BackButton from "@/components/BackButton";
export default function UserProfileScreen() {
  // Assume the user profile is passed via route params:
  const route = useRoute();
  const { user } = route.params as { user: types.UserProfile };

  const [favourites, setFavourites] = useState<types.Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch favourites when the screen mounts or when the user changes.
  const loadFavourites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUserFavourites(user.id);
      if (data) {
        // Each row should have a "club" property with club details.
        const mappedFavourites = data.map((favourite: any) => favourite.club);
        setFavourites(mappedFavourites);
      }
    } catch (error) {
      Alert.alert("Error", "Error loading favourites.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadFavourites();
  }, [loadFavourites]);

  async function onRefresh() {
    setRefreshing(true);
    await loadFavourites();
    setRefreshing(false);
  }

  const renderFavourite = ({ item }: { item: types.Club }) => (
    <View style={styles.favouriteItem}>
      <Image source={{ uri: item.Image }} style={styles.favouriteImage} />
      <Text style={styles.favouriteTitle}>{item.Name}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.avatarContainer}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarInitial}>
                {user?.first_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>{user.username}</Text>
      </View>

      {/* Favourites Section */}
      <View style={styles.favouritesContainer}>
        <Text style={styles.sectionTitle}>Favourites</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading favourites...</Text>
        ) : (
          <FlatList
            data={favourites}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <FavouriteClub club={item} />}
            numColumns={2}
            columnWrapperStyle={styles.favouritesRow}
            contentContainerStyle={styles.favouritesList}
          />
        )}
      </View>
    </ScrollView>
  );
}

const screenWidth = Dimensions.get("window").width;
const imageSize = (screenWidth - 60) / 2; // Adjust based on margins

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Header styles
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: "#ccc",
    marginBottom: 10,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  placeholderAvatar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 40,
    color: "#fff",
  },
  username: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
  },
  // Favourites styles
  favouritesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  favouritesList: {
    justifyContent: "space-between",
  },
  favouritesRow: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  favouriteItem: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 10,
    width: 180,
  },
  favouriteImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: 12,
    marginBottom: 5,
  },
  favouriteTitle: {
    fontSize: 14,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
  },
});
