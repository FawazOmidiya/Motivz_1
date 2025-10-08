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
  fetchUserAttendingEvents,
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
import { Video } from "expo-av";

type UserProfileScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export default function UserProfileScreen() {
  // Assume the user profile is passed via route params:
  const route = useRoute();
  const { user } = route.params as { user: types.UserProfile };
  const session = useSession();
  const navigation = useNavigation<UserProfileScreenNavigationProp>();
  const [favourites, setFavourites] = useState<types.Club[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<types.Event[]>([]);
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

  // Fetch events user is attending
  const loadAttendingEvents = useCallback(async () => {
    try {
      const events = await fetchUserAttendingEvents(user.id);
      setAttendingEvents(events);
    } catch (error) {
      console.error("Error loading attending events:", error);
      setAttendingEvents([]);
    }
  }, [user.id]);

  useEffect(() => {
    loadFavourites();
    loadAttendingEvents();
    if (user.active_club_id) {
      fetchSingleClub(user.active_club_id)
        .then((club) => setActiveClub(club))
        .catch((error) => console.error("Error fetching active club:", error));
    }
    if (user?.id) {
      fetchUserPosts(user.id).then(setPosts);
    }
  }, [loadFavourites, loadAttendingEvents, user.active_club_id, user]);

  async function onRefresh() {
    setRefreshing(true);
    await loadFavourites();
    await loadAttendingEvents();
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

  const renderAttendingEvent = ({ item }: { item: types.Event }) => (
    <TouchableOpacity
      style={styles.favouriteClubItem}
      onPress={() => navigation.navigate("EventDetail", { event: item })}
    >
      {item.poster_url ? (
        <Image
          source={{ uri: item.poster_url }}
          style={styles.favouriteClubImage}
        />
      ) : (
        <View style={[styles.favouriteClubImage, styles.eventPlaceholder]}>
          <Ionicons name="calendar-outline" size={24} color="#666" />
        </View>
      )}
      <Text style={styles.favouriteClubName} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.eventDate} numberOfLines={1}>
        {new Date(item.start_date).toLocaleDateString()}
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
    <View>
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={styles.headerGradient}
      />
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
          <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.avatarInitial}>
                  {user?.first_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        {/* Name and Friends button row */}
        <View style={styles.nameAndFriendsRow}>
          <Text style={styles.fullName}>
            {user.first_name} {user.last_name}
          </Text>
          <TouchableOpacity
            style={styles.friendsButton}
            onPress={() =>
              navigation.navigate("FriendsList", { userId: user.id })
            }
          >
            <Ionicons
              name="people-outline"
              size={22}
              color={Constants.whiteCOLOR}
            />
            <Text style={styles.friendsButtonText}>Friends</Text>
          </TouchableOpacity>
        </View>
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
      {/* Horizontal FlatList for Favourites with circular images */}
      <FlatList
        data={favourites}
        keyExtractor={(item) => item?.id}
        renderItem={renderFavouriteClub}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.favouritesHorizontalList}
      />

      <Text style={styles.sectionTitle}>Events They're Attending</Text>
      <FlatList
        data={attendingEvents}
        keyExtractor={(item) => item?.id}
        renderItem={renderAttendingEvent}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.favouritesHorizontalList}
      />
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
                  resizeMode="cover"
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
              resizeMode="contain"
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: Constants.whiteCOLOR,
    paddingHorizontal: 20,
    marginTop: 24,
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
  eventPlaceholder: {
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  eventDate: {
    color: Constants.greyCOLOR,
    fontSize: 11,
    textAlign: "center",
    width: 70,
    marginTop: 2,
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
