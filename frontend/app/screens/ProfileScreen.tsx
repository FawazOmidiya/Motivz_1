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
import { Button, Text, TextInput } from "react-native-paper";
import { supabaseAuth } from "../utils/supabaseAuth";
import { useSession } from "@/components/SessionContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../utils/types";
import {
  fetchUserFavourites,
  fetchUserProfile,
  fetchUserFriends,
  fetchSingleClub,
  supabase,
} from "../utils/supabaseService";
import FavouriteClub from "@/components/ClubFavourite";
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

  async function handleRefresh() {
    setRefreshing(true);
    await getProfile();
    await getFavourites();
    setRefreshing(false);
  }

  async function handleSignOut() {
    try {
      const { error } = await supabaseAuth.auth.signOut();
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

  const ListHeaderComponent = () => (
    <View>
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={styles.headerGradient}
      />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Text style={styles.avatarInitial}>
                    {profile?.first_name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.username}>{profile?.username}</Text>
        <View style={styles.profileButtonsContainer}>
          <View style={styles.nameAndButtonsRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.firstName}>{profile?.first_name}</Text>
              <Text style={styles.lastName}>{profile?.last_name}</Text>
            </View>
            <View style={styles.buttonsRow}>
              {profile?.id && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    navigation.navigate("FriendsList", { userId: profile.id })
                  }
                >
                  <Ionicons
                    name="people-outline"
                    size={24}
                    color={Constants.whiteCOLOR}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("ProfileSettings")}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={Constants.whiteCOLOR}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSignOut}
              >
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  color={Constants.whiteCOLOR}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
      <FlatList
        data={favourites}
        keyExtractor={(item) => item?.id}
        renderItem={renderFavouriteClub}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.favouritesHorizontalList}
      />
      {/* {session?.user.id === profile?.id && (
        <View style={{ alignItems: "center", marginVertical: 16 }}>
          <Button
            title="Capture a Moment"
            onPress={handleCaptureMoment}
            buttonStyle={{
              backgroundColor: Constants.purpleCOLOR,
              borderRadius: 24,
              paddingHorizontal: 32,
              paddingVertical: 12,
            }}
            titleStyle={{ fontWeight: "bold", fontSize: 18 }}
          />
        </View>
      )} */}
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
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
});
