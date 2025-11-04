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
  Modal,
  StatusBar,
} from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  fetchUserFavourites,
  fetchSingleClub,
  areFriends,
} from "../utils/supabaseService";
import * as types from "@/app/utils/types";
import FavouriteClub from "@/components/ClubFavourite";
import BackButton from "@/components/BackButton";
import FriendButton from "@/components/FriendButton"; // Import your FriendButton component
import { useSession } from "@/components/SessionContext";
import * as Constants from "@/constants/Constants";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../utils/types";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { fetchUserPosts } from "../utils/postService";
import { Video, ResizeMode } from "expo-av";

type UserProfileScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

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
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [posts, setPosts] = useState<types.Post[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: "photo" | "video";
  } | null>(null);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("favourites");
  const [isFriends, setIsFriends] = useState(false);

  // Check friendship status
  const checkFriendshipStatus = useCallback(async () => {
    if (!session?.user || !user) return;

    try {
      const friendsStatus = await areFriends(session.user.id, user.id);
      setIsFriends(friendsStatus);
    } catch (error) {
      console.error("Error checking friendship status:", error);
      setIsFriends(false);
    }
  }, [session?.user, user]);

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
    checkFriendshipStatus();
    if (user.active_club_id) {
      fetchSingleClub(user.active_club_id)
        .then((club) => setActiveClub(club))
        .catch((error) => console.error("Error fetching active club:", error));
    }
    if (user?.id) {
      fetchUserPosts(user.id).then(setPosts);
    }
  }, [loadFavourites, checkFriendshipStatus, user.active_club_id, user]);

  async function onRefresh() {
    setRefreshing(true);
    await loadFavourites();
    setRefreshing(false);
  }

  const renderFavouriteClub = ({ item }: { item: types.Club }) => (
    <TouchableOpacity
      style={styles.favouriteClubItem}
      onPress={() => navigation.navigate("ClubDetail", { club: item })}
    >
      <Image source={{ uri: item.Image }} style={styles.favouriteClubImage} />
      <Text style={styles.favouriteClubName} numberOfLines={1}>
        {item.Name}
      </Text>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }: { item: types.Post }) => (
    // Placeholder for post item
    <View>
      <Text style={{ color: "#fff" }}>{item.caption || "Untitled Post"}</Text>
    </View>
  );

  const ListHeaderComponent = () => (
    <View style={styles.profileContainer}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileTopRow}>
          <View style={styles.profileAvatarContainer}>
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={() => setIsImageModalVisible(true)}
            >
              <Image
                source={
                  user.avatar_url
                    ? { uri: user.avatar_url }
                    : require("@/assets/images/default-avatar.png")
                }
                style={styles.avatarImage}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.profileStats}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                navigation.navigate("FriendsList", { userId: user.id })
              }
            >
              <Text style={styles.statNumber}>{user?.friends_count || 0}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.clubs_count || 0}</Text>
              <Text style={styles.statLabel}>Clubs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.events_count || 0}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user.first_name} {user.last_name}
          </Text>

          {/* Active Club Display */}
          {activeClub && isFriends && (
            <TouchableOpacity
              style={styles.activeClubInfo}
              onPress={() =>
                navigation.navigate("ClubDetail", { club: activeClub })
              }
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={Constants.purpleCOLOR}
              />
              <Text style={styles.activeClubText}>{activeClub.Name}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.profileBio}>{user.bio}</Text>
        </View>

        <View style={styles.profileActions}>
          {/* Only show friend button if current user is not viewing their own profile */}
          {session?.user.id && session.user.id !== user.id && (
            <FriendButton targetUserId={user.id} />
          )}
        </View>
      </View>

      {/* Favourite Clubs Section */}
      <Text style={styles.sectionTitle}>Favourite Clubs</Text>
      {favourites.length > 0 && (
        <View style={styles.favouritesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {favourites.map((club) => (
              <TouchableOpacity
                key={club?.id}
                style={styles.horizontalClubCard}
                onPress={() => navigation.navigate("ClubDetail", { club })}
              >
                <Image
                  source={{ uri: club?.Image }}
                  style={styles.horizontalClubImage}
                />
                <View style={styles.horizontalClubInfo}>
                  <Text style={styles.horizontalClubName} numberOfLines={1}>
                    {club?.Name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        onRequestClose={() => setIsImageModalVisible(false)}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.modalPlaceholder}>
                <Text style={styles.modalPlaceholderText}>
                  {user?.first_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Posts Section */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => {
              setSelectedMedia({ url: item.media_url, type: item.media_type });
              setMediaModalVisible(true);
            }}
          >
            {item.media_type === "video" ? (
              <View style={{ flex: 1 }}>
                <Video
                  source={{ uri: item.media_url }}
                  style={styles.gridImage}
                  resizeMode={ResizeMode.COVER}
                  isMuted
                  shouldPlay={false}
                />
                <View
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    borderRadius: 12,
                    padding: 2,
                  }}
                >
                  <Ionicons name="play" size={20} color="#fff" />
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: item.media_url }}
                style={styles.gridImage}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={ListHeaderComponent}
        // ListEmptyComponent={
        //   <Text style={{ color: "#fff", textAlign: "center", marginTop: 40 }}>
        //     No posts yet.
        //   </Text>
        // }
        contentContainerStyle={styles.gridList}
      />
      <Modal
        visible={mediaModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMediaModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{ position: "absolute", top: 40, right: 20, zIndex: 2 }}
            onPress={() => setMediaModalVisible(false)}
          >
            <Ionicons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          {selectedMedia && selectedMedia.type === "video" && (
            <Video
              source={{ uri: selectedMedia.url }}
              style={{ width: "90%", aspectRatio: 9 / 16, borderRadius: 16 }}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
            />
          )}
          {selectedMedia && selectedMedia.type === "photo" && (
            <Image
              source={{ uri: selectedMedia.url }}
              style={{ width: "90%", aspectRatio: 1, borderRadius: 16 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const imageSize = (Constants.screenWidth - 60) / 2; // Adjust based on margins

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },

  // Profile Container
  profileContainer: {
    backgroundColor: Constants.blackCOLOR,
  },

  // Profile Header
  profileHeader: {
    padding: 20,
    paddingTop: 60,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileAvatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 0,
    borderColor: "transparent",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },

  // Profile Stats
  profileStats: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },

  // Profile Info
  profileInfo: {
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  activeClubInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  activeClubText: {
    fontSize: 14,
    color: Constants.purpleCOLOR,
    fontWeight: "500",
  },
  profileBio: {
    fontSize: 14,
    color: Constants.whiteCOLOR,
    lineHeight: 20,
  },

  // Profile Actions
  profileActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 16,
  },

  // Favourites Section (matching ProfileScreen)
  favouritesSection: {
    marginBottom: 32,
  },
  favouritesSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Constants.blackCOLOR,
    marginBottom: 4,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
  },
  horizontalClubCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  horizontalClubImage: {
    width: "100%",
    height: 100,
    position: "absolute",
    resizeMode: "cover",
    top: 0,
    left: 0,
  },
  horizontalClubInfo: {
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    marginTop: 50,
    marginHorizontal: 8,
    marginBottom: 8,
    position: "relative",
    zIndex: 1,
  },
  horizontalClubName: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Constants.backgroundCOLOR,
    alignItems: "center",
    zIndex: 2,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: Constants.greyCOLOR,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Constants.purpleCOLOR,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 48,
    color: Constants.whiteCOLOR,
    fontWeight: "600",
  },
  username: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: Constants.whiteCOLOR,
  },
  profileButtonsContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 16,
  },
  nameAndButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
  },
  nameContainer: {
    flex: 1,
  },
  firstName: {
    color: Constants.whiteCOLOR,
    fontSize: 20,
    fontWeight: "600",
  },
  lastName: {
    color: Constants.whiteCOLOR,
    fontSize: 18,
    opacity: 0.8,
  },
  favouritesList: {
    paddingBottom: 20,
  },
  favouritesRow: {
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  favouriteItem: {
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 8,
    width: "45%",
  },
  favouriteImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    borderRadius: 12,
    marginBottom: 8,
  },
  favouriteTitle: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    fontWeight: "600",
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "90%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  modalPlaceholderText: {
    fontSize: 80,
    color: Constants.whiteCOLOR,
  },
  nameAndFriendsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  fullName: {
    fontSize: 18,
    color: Constants.whiteCOLOR,
    marginBottom: 8,
    fontWeight: "500",
  },
  friendsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  friendsButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 15,
    marginLeft: 6,
    fontWeight: "500",
  },
  favouritesHorizontalList: {
    paddingVertical: 8,
    paddingLeft: 20,
    gap: 12,
  },
  favouriteClubItem: {
    alignItems: "center",
    marginRight: 18,
    width: 80,
  },
  favouriteClubImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
    backgroundColor: Constants.greyCOLOR,
  },
  favouriteClubName: {
    color: Constants.whiteCOLOR,
    fontSize: 13,
    textAlign: "center",
    width: 70,
  },
  gridList: {
    paddingBottom: 20,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    backgroundColor: "#222",
    borderRadius: 8,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
});
