import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Text } from "@rneui/themed";
import { useRoute, useNavigation } from "@react-navigation/native";
import { fetchUserFavourites, fetchSingleClub } from "../utils/supabaseService";
import * as types from "@/app/utils/types";
import FavouriteClub from "@/components/ClubFavourite";
import BackButton from "@/components/BackButton";
import FriendButton from "@/components/FriendButton"; // Import your FriendButton component
import { useSession } from "@/components/SessionContext";
import * as Constants from "@/constants/Constants";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation";

type UserProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ClubDetail"
>;

export default function UserProfileScreen() {
  // Assume the user profile is passed via route params:
  const route = useRoute();
  const { user } = route.params as { user: types.UserProfile };
  const session = useSession();
  const navigation = useNavigation<UserProfileScreenNavigationProp>();
  const [favourites, setFavourites] = useState<types.Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeClub, setActiveClub] = useState<types.Club | null>(null);

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
    if (user.active_club_id) {
      fetchSingleClub(user.active_club_id)
        .then((club) => setActiveClub(club))
        .catch((error) => console.error("Error fetching active club:", error));
    }
  }, [loadFavourites, user.active_club_id]);

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

  const ListHeaderComponent = () => (
    <View>
      <View style={styles.header}>
        <View
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1,
          }}
        >
          <BackButton color="white" />
        </View>
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
        {/* Only show friend button if current user is not viewing their own profile */}
        {session?.user.id && session.user.id !== user.id && (
          <FriendButton targetUserId={user.id} />
        )}
        {activeClub && (
          <TouchableOpacity
            style={styles.activeClubContainer}
            onPress={() =>
              navigation.navigate("ClubDetail", { club: activeClub })
            }
          >
            <View style={styles.activeClubContent}>
              <Image
                source={{ uri: activeClub.Image }}
                style={styles.activeClubImage}
              />
              <View style={styles.activeClubInfo}>
                <Text style={styles.activeClubTitle}>Currently at</Text>
                <Text style={styles.activeClubName}>{activeClub.Name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.sectionTitle}>Favourites</Text>
    </View>
  );
  return (
    <View style={styles.container}>
      {/* Favourites Section */}
      <FlatList
        data={favourites}
        keyExtractor={(item) => item?.id}
        renderItem={({ item }) => <FavouriteClub club={item} />}
        numColumns={2}
        columnWrapperStyle={styles.favouritesRow}
        contentContainerStyle={styles.favouritesList}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const imageSize = (Constants.screenWidth - 60) / 2; // Adjust based on margins

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  // Header styles
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Constants.backgroundCOLOR,
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
    color: "#fff",
  },
  // Favourites styles
  favouritesContainer: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: Constants.whiteCOLOR,
    paddingHorizontal: 20,
  },
  favouritesList: {
    justifyContent: "space-between",
  },
  favouritesRow: {
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 20,
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
  activeClubContainer: {
    marginTop: 20,
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 12,
    padding: 12,
    width: "100%",
  },
  activeClubContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeClubImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  activeClubInfo: {
    flex: 1,
  },
  activeClubTitle: {
    color: Constants.whiteCOLOR,
    opacity: 0.7,
    fontSize: 12,
  },
  activeClubName: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    fontWeight: "600",
  },
});
