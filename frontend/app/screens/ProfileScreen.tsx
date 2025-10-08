import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Alert,
  FlatList,
  Image,
  Dimensions,
  TouchableHighlight,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  Linking,
  Pressable,
} from "react-native";
import { Button, Text, TextInput, SegmentedButtons } from "react-native-paper";

import { useSession } from "@/components/SessionContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../utils/types";
import {
  fetchUserFavourites,
  fetchUserProfile,
  fetchSingleClub,
  fetchPendingFriendRequestsCount,
  fetchUserAttendingEvents,
  storeUserPushToken,
  supabase,
} from "../utils/supabaseService";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { uploadPost, fetchUserPosts, deletePost } from "../utils/postService";
import { decode } from "base64-arraybuffer";
import { Video, ResizeMode } from "expo-av";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  Camera,
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

type ProfileScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

function CameraModal({
  visible,
  onClose,
  onCapture,
  setPickedAssetType,
}: {
  visible: boolean;
  onClose: () => void;
  onCapture: (media: any) => void;
  setPickedAssetType: (type: "photo" | "video") => void;
}) {
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "black",
          }}
        >
          <Text style={{ color: "white", marginBottom: 20 }}>
            We need your permission to show the camera
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={{ backgroundColor: "white", padding: 16, borderRadius: 8 }}
          >
            <Text>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
            <Text style={{ color: "white" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
      });
      setPickedAssetType("photo");
      onCapture(photo);
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !recording) {
      setRecording(true);
      const video = await cameraRef.current.recordAsync();
      setRecording(false);
      setPickedAssetType("video");
      onCapture(video);
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && recording) {
      await cameraRef.current.stopRecording();
      setRecording(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          ref={cameraRef}
          facing={facing}
          mode="video"
        />
        <View
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={takePicture}
            onLongPress={startRecording}
            onPressOut={stopRecording}
            style={{
              backgroundColor: recording ? "red" : "white",
              padding: 20,
              borderRadius: 50,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: recording ? "white" : "black" }}>
              {recording ? "Recording..." : "Capture"}
            </Text>
          </Pressable>
        </View>
        <TouchableOpacity
          onPress={() => setFacing(facing === "back" ? "front" : "back")}
          style={{ position: "absolute", top: 60, left: 20 }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          style={{ position: "absolute", top: 60, right: 20 }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favourites, setFavourites] = useState<types.Club[]>([]);
  const [profile, setProfile] = useState<types.UserProfile | null>(null);
  const [activeClub, setActiveClub] = useState<types.Club | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [posts, setPosts] = useState<types.Post[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<types.Event[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeTab, setActiveTab] = useState("bookmarks");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const session = useSession();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [showPostModal, setShowPostModal] = useState(false);
  const [pickedAsset, setPickedAsset] = useState<any>(null);
  const [pickedAssetType, setPickedAssetType] = useState<"photo" | "video">(
    "photo"
  );
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: "photo" | "video";
  } | null>(null);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (session) {
      getProfile();
      getFavourites();
      getPendingRequestsCount();
      getAttendingEvents();
    }
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const data = await fetchUserProfile(session.user.id);
      if (data) {
        setProfile(data);
        if (data.active_club_id) {
          const club = await fetchSingleClub(data.active_club_id);
          setActiveClub(club);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Profile Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Pull user Favourites
  async function getFavourites() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");
      const data = await fetchUserFavourites(session.user.id);
      if (data) {
        // Map each row's club object into our Club type.
        const mappedFavourites = data.map((favourite: any) => {
          return favourite.club;
        });
        setFavourites(mappedFavourites);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Favourites Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Fetch pending friend requests count only
  async function getPendingRequestsCount() {
    try {
      if (!session?.user) return;

      const count = await fetchPendingFriendRequestsCount(session.user.id);
      setPendingRequestsCount(count);
    } catch (error) {
      console.error("Error fetching pending friend requests count:", error);
      setPendingRequestsCount(0);
    }
  }

  // Fetch events user is attending
  async function getAttendingEvents() {
    try {
      if (!session?.user) return;

      const events = await fetchUserAttendingEvents(session.user.id);
      setAttendingEvents(events);
    } catch (error) {
      console.error("Error fetching attending events:", error);
      setAttendingEvents([]);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await getProfile();
    await getFavourites();
    await getPendingRequestsCount();
    await getAttendingEvents();
    setRefreshing(false);
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Sign Out Error", error.message);
      }
    }
  }

  const handleCaptureMoment = async () => {
    Alert.alert("Add Media", "Choose an option", [
      {
        text: "Take Photo or Video",
        onPress: async () => {
          // Request camera permissions first
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Camera permission is required!",
              "Please enable permissions in your device settings.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            return;
          }
          setShowCameraModal(true);
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          // Request media library permissions first
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Media library permission is required!",
              "Please enable permissions in your device settings.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            allowsEditing: true,
            quality: 0.8,
            base64: true, // only works for images
          });
          if (!result.canceled && result.assets && result.assets[0].uri) {
            setPickedAsset(result.assets[0]);
            setPickedAssetType(
              result.assets[0].type === "video"
                ? "video"
                : result.assets[0].type === "livePhoto"
                ? "photo"
                : result.assets[0].type === "image"
                ? "photo"
                : "video"
            );
            setShowPostModal(true);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleUploadPost = async () => {
    if (!pickedAsset || !profile) return;
    setUploading(true);
    try {
      // 1. Create the post record (without media_url yet)
      const { data: insertPost, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: profile.id,
          caption,
          location: undefined,
          media_type: pickedAssetType,
        })
        .select()
        .single();
      if (!insertPost || !insertPost.id)
        throw new Error("Failed to create post.");

      // 2. Prepare file info
      const ext =
        pickedAsset.uri.split(".").pop() ||
        (pickedAsset.type === "video" ? "mp4" : "jpg");
      const timestamp = Date.now();
      const fileName = `post_${timestamp}.${ext}`;
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const postId = insertPost.id;
      const storagePath = `${profile.id}/${year}/${month}/${day}/${postId}/original/${fileName}`;
      const mimeType =
        pickedAssetType === "photo" ? `image/${ext}` : "video/mp4";

      // 3. Compress image if needed
      let uploadUri = pickedAsset.uri;
      if (pickedAssetType === "photo") {
        const manipulated = await ImageManipulator.manipulateAsync(
          pickedAsset.uri,
          [],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        uploadUri = manipulated.uri;
      }

      // 4. Upload file directly to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("posts")
        .upload(storagePath, uploadUri, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 5. Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("posts").getPublicUrl(storagePath);

      // 6. Update post record with the public URL
      await supabase
        .from("posts")
        .update({
          id: postId,
          user_id: profile.id,
          club_id: null,
          media_type: pickedAssetType,
          media_url: publicUrl,
          thumbnail_url: publicUrl, // TODO: generate real thumbnail for video
          caption,
          location: undefined,
        })
        .eq("user_id", profile.id)
        .eq("id", postId);

      setShowPostModal(false);
      setPickedAsset(null);
      setCaption("");
      // Optionally refresh posts here
      if (profile.id) {
        const newPosts = await fetchUserPosts(profile.id);
        setPosts(newPosts);
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message || "Failed to upload post.");
    } finally {
      setUploading(false);
    }
  };

  // Add delete handler
  const handleDeletePost = async (postId: string) => {
    if (!profile) return;
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deletePost(postId, profile.id);
            if (success) {
              // Refresh posts
              const newPosts = await fetchUserPosts(profile.id);
              setPosts(newPosts);
            } else {
              Alert.alert("Error", "Failed to delete post.");
            }
          },
        },
      ]
    );
  };

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

  const renderTicketItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Image
          source={{ uri: item.event_poster }}
          style={styles.ticketEventImage}
        />
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketEventTitle}>{item.event_title}</Text>
          <Text style={styles.ticketEventDate}>{item.event_date}</Text>
          <Text style={styles.ticketStatus}>{item.status}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Constants.greyCOLOR}
        />
      </View>
      <View style={styles.ticketDetails}>
        <Text style={styles.ticketCode}>Code: {item.ticket_code}</Text>
        <Text style={styles.ticketPrice}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderNotificationItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.notificationCard}>
      <View style={styles.notificationIcon}>
        <Ionicons
          name={item.icon}
          size={24}
          color={item.iconColor || Constants.purpleCOLOR}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const ListHeaderComponent = () => (
    <View style={styles.profileContainer}>
      {/* Instagram-style Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileTopRow}>
          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={() => setIsImageModalVisible(true)}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profile?.first_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile?.first_name} {profile?.last_name}
          </Text>
        </View>

        <View style={styles.profileActions}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons
              name="share-outline"
              size={20}
              color={Constants.whiteCOLOR}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("ProfileSettings")}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={Constants.whiteCOLOR}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() =>
              navigation.navigate("FriendsList", { userId: profile?.id })
            }
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={Constants.whiteCOLOR}
            />
            {pendingRequestsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Instagram-style Stories */}
      <View style={styles.storiesSection}>
        <View style={styles.storiesList}>
          <TouchableOpacity style={styles.addStoryButton}>
            <View style={styles.addStoryIcon}>
              <Ionicons name="add" size={20} color={Constants.whiteCOLOR} />
            </View>
            <Text style={styles.addStoryText}>Your story</Text>
          </TouchableOpacity>
          {stories.map((story, index) => (
            <TouchableOpacity key={index} style={styles.storyItem}>
              <View style={styles.storyRing}>
                <Image
                  source={{ uri: story.thumbnail }}
                  style={styles.storyImage}
                />
              </View>
              <Text style={styles.storyUsername} numberOfLines={1}>
                {story.username}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Instagram-style Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
        >
          <Ionicons
            name="grid-outline"
            size={24}
            color={
              activeTab === "posts" ? Constants.whiteCOLOR : Constants.greyCOLOR
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "reels" && styles.activeTab]}
          onPress={() => setActiveTab("reels")}
        >
          <Ionicons
            name="play-outline"
            size={24}
            color={
              activeTab === "reels" ? Constants.whiteCOLOR : Constants.greyCOLOR
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "bookmarks" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("bookmarks")}
        >
          <Ionicons
            name="bookmark-outline"
            size={24}
            color={
              activeTab === "bookmarks"
                ? Constants.whiteCOLOR
                : Constants.greyCOLOR
            }
          />
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "posts" && (
        <View style={styles.tabContent}>
          <Text style={styles.emptyTabText}>Your posts will appear here</Text>
        </View>
      )}

      {activeTab === "reels" && (
        <View style={styles.tabContent}>
          <Text style={styles.emptyTabText}>Your reels will appear here</Text>
        </View>
      )}

      {activeTab === "bookmarks" && (
        <View style={styles.bookmarksContent}>
          {/* Currently Active Club */}
          {activeClub && (
            <View style={styles.activeClubSection}>
              <Text style={styles.sectionTitle}>Currently Active</Text>
              <TouchableOpacity
                style={styles.activeClubCard}
                onPress={() =>
                  navigation.navigate("ClubDetail", { club: activeClub })
                }
              >
                <Image
                  source={{ uri: activeClub.Image }}
                  style={styles.clubImage}
                />
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{activeClub.Name}</Text>
                  <Text style={styles.clubStatus}>Currently here</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Constants.greyCOLOR}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Favourite Clubs */}
          {favourites.length > 0 && (
            <View style={styles.bookmarkSection}>
              <Text style={styles.sectionTitle}>Favourite Clubs</Text>
              <View style={styles.clubsGrid}>
                {favourites.map((club) => (
                  <TouchableOpacity
                    key={club?.id}
                    style={styles.clubCard}
                    onPress={() => navigation.navigate("ClubDetail", { club })}
                  >
                    <Image
                      source={{ uri: club?.Image }}
                      style={styles.clubCardImage}
                    />
                    <Text style={styles.clubCardName} numberOfLines={2}>
                      {club?.Name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Events I'm Attending */}
          {attendingEvents.length > 0 && (
            <View style={styles.bookmarkSection}>
              <Text style={styles.sectionTitle}>Events I'm Attending</Text>
              <View style={styles.eventsList}>
                {attendingEvents.map((event) => (
                  <TouchableOpacity
                    key={event?.id}
                    style={styles.eventCard}
                    onPress={() =>
                      navigation.navigate("EventDetail", { event })
                    }
                  >
                    <Image
                      source={{ uri: event?.poster_url }}
                      style={styles.eventCardImage}
                    />
                    <View style={styles.eventCardInfo}>
                      <Text style={styles.eventCardTitle} numberOfLines={2}>
                        {event?.title}
                      </Text>
                      <Text style={styles.eventCardDate}>
                        {new Date(event?.start_date).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Tickets */}
          {tickets.length > 0 && (
            <View style={styles.bookmarkSection}>
              <Text style={styles.sectionTitle}>My Tickets</Text>
              <View style={styles.ticketsList}>
                {tickets.map((ticket) => (
                  <View key={ticket.id} style={styles.ticketCard}>
                    <Image
                      source={{ uri: ticket.event_poster }}
                      style={styles.ticketImage}
                    />
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketTitle}>
                        {ticket.event_title}
                      </Text>
                      <Text style={styles.ticketDate}>{ticket.event_date}</Text>
                      <Text style={styles.ticketStatus}>{ticket.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
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
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.modalPlaceholder}>
                <Text style={styles.modalPlaceholderText}>
                  {profile?.first_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      <CameraModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(media) => {
          setPickedAsset(media);
          setShowCameraModal(false);
          setShowPostModal(true);
        }}
        setPickedAssetType={setPickedAssetType}
      />
      {/* Post Modal */}
      <Modal
        visible={showPostModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPostModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: Constants.backgroundCOLOR,
              borderRadius: 16,
              padding: 24,
              width: "90%",
              alignItems: "center",
            }}
          >
            {pickedAsset &&
              (pickedAssetType === "video" ? (
                <Video
                  source={{ uri: pickedAsset.uri }}
                  style={{
                    width: 220,
                    height: 220,
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={true}
                  isLooping={true}
                />
              ) : (
                <Image
                  source={{ uri: pickedAsset.uri }}
                  style={{
                    width: 220,
                    height: 220,
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                />
              ))}
            <TextInput
              placeholder="Write a caption..."
              value={caption}
              onChangeText={setCaption}
              style={{ color: Constants.whiteCOLOR }}
              placeholderTextColor={Constants.whiteCOLOR + "80"}
              mode="outlined"
              outlineColor="rgba(255,255,255,0.3)"
              activeOutlineColor={Constants.whiteCOLOR}
              textColor={Constants.whiteCOLOR}
            />
            <Button
              mode="contained"
              onPress={handleUploadPost}
              disabled={uploading}
              style={{
                backgroundColor: Constants.purpleCOLOR,
                borderRadius: 20,
                width: 120,
              }}
              labelStyle={{ fontWeight: "bold" }}
            >
              {uploading ? "Posting..." : "Post"}
            </Button>
            <Button
              mode="text"
              onPress={() => setShowPostModal(false)}
              labelStyle={{ color: Constants.whiteCOLOR, marginTop: 8 }}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
      {/* Posts Section (main FlatList) */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={{ position: "relative", flex: 1 }}>
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => {
                setSelectedMedia({
                  url: item.media_url,
                  type: item.media_type,
                });
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
            {/* Delete button overlay, only for current user's posts */}
            {profile && item.user_id === profile.id && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  borderRadius: 16,
                  padding: 4,
                  zIndex: 2,
                }}
                onPress={() => handleDeletePost(item.id)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListHeaderComponent={ListHeaderComponent}
        // ListEmptyComponent={
        //   <Text style={{ color: "#fff", textAlign: "center", marginTop: 40 }}>
        //     More features coming soon!
        //   </Text>
        // }
        contentContainerStyle={styles.gridList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={[Constants.purpleCOLOR]}
          />
        }
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
  headerRow: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
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
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconButtonContainer: {
    position: "relative",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Constants.whiteCOLOR,
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: Constants.whiteCOLOR,
    paddingHorizontal: 20,
    marginTop: 24,
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
  activeClubContainer: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  activeClubContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeClubImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  activeClubInfo: {
    flex: 1,
  },
  activeClubTitle: {
    color: Constants.whiteCOLOR,
    opacity: 0.7,
    fontSize: 14,
    marginBottom: 4,
  },
  activeClubName: {
    color: Constants.whiteCOLOR,
    fontSize: 18,
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
  // Instagram-style Profile Design
  profileContainer: {
    backgroundColor: Constants.blackCOLOR,
  },
  profileHeader: {
    padding: 20,
    paddingTop: 60,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Constants.purpleCOLOR,
    marginRight: 20,
  },
  avatarImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  avatarPlaceholder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
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
  profileInfo: {
    marginBottom: 20,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    color: Constants.whiteCOLOR,
    lineHeight: 20,
  },
  profileActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: Constants.whiteCOLOR,
    fontSize: 12,
    fontWeight: "bold",
  },
  storiesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  storiesList: {
    flexDirection: "row",
    alignItems: "center",
  },
  addStoryButton: {
    alignItems: "center",
    marginRight: 20,
  },
  addStoryIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  addStoryText: {
    fontSize: 12,
    color: Constants.whiteCOLOR,
    textAlign: "center",
  },
  storyItem: {
    alignItems: "center",
    marginRight: 20,
  },
  storyRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: Constants.purpleCOLOR,
    padding: 2,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  storyImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  storyUsername: {
    fontSize: 12,
    color: Constants.whiteCOLOR,
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Constants.purpleCOLOR,
  },
  bookmarksContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activeClubSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 16,
  },
  activeClubCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
  },
  clubImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  clubStatus: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },
  bookmarkSection: {
    marginBottom: 24,
  },
  clubsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  clubCard: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  clubCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  clubCardName: {
    fontSize: 14,
    fontWeight: "500",
    color: Constants.whiteCOLOR,
    textAlign: "center",
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  eventCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  eventCardDate: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  ticketImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginBottom: 2,
  },
  ticketStatus: {
    fontSize: 12,
    color: Constants.purpleCOLOR,
    fontWeight: "500",
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTabText: {
    fontSize: 16,
    color: Constants.greyCOLOR,
    textAlign: "center",
  },
  activeClubStory: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 20,
  },
  clubStoryRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Constants.purpleCOLOR,
    padding: 2,
    marginRight: 12,
  },
  clubStoryImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  clubStoryText: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    fontWeight: "500",
  },
  highlightsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  highlightsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 16,
  },
  highlightsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  highlightItem: {
    alignItems: "center",
    width: "12.5%",
    marginBottom: 16,
  },
  highlightRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Constants.purpleCOLOR,
    padding: 2,
    marginBottom: 8,
  },
  highlightImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  highlightName: {
    fontSize: 12,
    color: Constants.whiteCOLOR,
    textAlign: "center",
  },
  eventsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 16,
  },
  eventsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  eventItem: {
    width: "32%",
    aspectRatio: 1,
    marginBottom: 8,
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  eventOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 10,
    color: Constants.greyCOLOR,
  },
  section: {
    marginBottom: 20,
  },
  favouritesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  favouriteCard: {
    width: "30%",
    alignItems: "center",
    marginBottom: 16,
  },
  favouriteImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  favouriteName: {
    fontSize: 12,
    color: Constants.whiteCOLOR,
    textAlign: "center",
    fontWeight: "500",
  },
  eventsList: {
    paddingHorizontal: 20,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  eventImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },
  ticketsList: {
    paddingHorizontal: 20,
  },
  ticketCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  ticketImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginBottom: 2,
  },
  ticketStatus: {
    fontSize: 12,
    color: Constants.purpleCOLOR,
    fontWeight: "500",
  },
  notificationsList: {
    paddingHorizontal: 20,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    position: "relative",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: Constants.greyCOLOR,
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Constants.purpleCOLOR,
  },
  profileHeader: {
    padding: 20,
    paddingTop: 60,
  },
  profileAvatarContainer: {
    position: "relative",
  },
  profileTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Constants.whiteCOLOR,
  },
  profileAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Constants.whiteCOLOR,
  },
  profileAvatarInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    borderWidth: 3,
    borderColor: "#1a1a1a",
  },
  profileActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: Constants.whiteCOLOR,
    fontSize: 12,
    fontWeight: "bold",
  },
  profileInfo: {
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: Constants.greyCOLOR,
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: Constants.whiteCOLOR,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    position: "relative",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Constants.greyCOLOR,
  },
  friendRequestBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  friendRequestBadgeText: {
    color: Constants.whiteCOLOR,
    fontSize: 10,
    fontWeight: "bold",
  },
  activeClubCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  activeClubContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeClubImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  activeClubInfo: {
    flex: 1,
  },
  activeClubLabel: {
    fontSize: 12,
    color: Constants.greyCOLOR,
    marginBottom: 4,
  },
  activeClubName: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  segmentedButtons: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  tabContent: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 16,
  },
  storiesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  addStoryButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Constants.purpleCOLOR,
    borderStyle: "dashed",
  },
  addStoryText: {
    fontSize: 10,
    color: Constants.purpleCOLOR,
    marginTop: 4,
    textAlign: "center",
  },
  storyItem: {
    width: 80,
    height: 80,
    position: "relative",
  },
  storyThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  storyRing: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: Constants.purpleCOLOR,
  },
  ticketCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketEventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  ticketEventDate: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginBottom: 4,
  },
  ticketStatus: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  ticketDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  ticketCode: {
    fontSize: 12,
    color: Constants.greyCOLOR,
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Constants.greyCOLOR,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4444",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    textAlign: "center",
  },
});
