import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Dimensions,
  Alert,
  SafeAreaView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Constants from "@/constants/Constants";
import { supabase } from "../utils/supabaseService";
import { useSession, useProfile } from "@/components/SessionContext";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { Video, ResizeMode } from "expo-av";
import * as types from "../utils/types";

const { width, height } = Dimensions.get("window");

type StoryCreationNavigationProp =
  NativeStackNavigationProp<types.RootStackParamList>;

interface StoryCreationScreenProps {
  route: {
    params: {
      mediaUri: string;
      mediaType: "photo" | "video";
    };
  };
}

export default function StoryCreationScreen({
  route,
}: StoryCreationScreenProps) {
  const navigation = useNavigation<StoryCreationNavigationProp>();
  const session = useSession();
  const profile = useProfile();
  const { mediaUri, mediaType } = route.params;

  if (!session?.user || !profile) {
    return null;
  }

  // Story configuration
  const [visibility, setVisibility] = useState<"public" | "friends">("friends");
  const [selectedClubId, setSelectedClubId] = useState<string | undefined>();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  // Available events
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [activeClub, setActiveClub] = useState<any>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);

  // UI state
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (profile) {
      console.log("📱 Profile from context:", {
        active_club_id: profile.active_club_id,
      });

      setSelectedClubId(profile.active_club_id || undefined);
      // Note: active_event_id is not in UserProfile type, we'll handle events separately

      // Load club and event details
      loadClubAndEventDetails();
    }
  }, [profile]);

  // Ensure video plays when component mounts and stays playing
  useEffect(() => {
    if (mediaType === "video") {
      const playVideo = async () => {
        if (videoRef.current) {
          try {
            await videoRef.current.playAsync();
            console.log("🎥 Video started playing");
          } catch (error) {
            console.error("🎥 Error starting video:", error);
          }
        }
      };

      // Try to play immediately
      playVideo();

      // Set up interval to ensure video keeps playing
      const interval = setInterval(() => {
        if (videoRef.current) {
          videoRef.current.getStatusAsync().then((status) => {
            if (
              status.isLoaded &&
              !(status as any).isPlaying &&
              !(status as any).didJustFinish
            ) {
              console.log("🎥 Video stopped, restarting...");
              videoRef.current?.playAsync();
            }
          });
        }
      }, 2000); // Check every 2 seconds

      return () => {
        clearInterval(interval);
        // Stop video when component unmounts
        cleanupVideo();
      };
    }
  }, [mediaType]);

  // Cleanup video when component unmounts
  useEffect(() => {
    return () => {
      cleanupVideo();
    };
  }, []);

  const loadClubAndEventDetails = async () => {
    if (!profile?.active_club_id) return;

    try {
      // Load club details
      const { data: club } = await supabase
        .from("Clubs")
        .select("id, Name, Image")
        .eq("id", profile.active_club_id)
        .single();

      if (club) {
        setActiveClub(club);
      }

      // Note: Events are loaded separately through the event selector

      // Load events for the active club
      loadEventsForClub(profile.active_club_id);
    } catch (error) {
      console.error("Error loading club/event details:", error);
    }
  };

  const loadEventsForClub = async (clubId: string) => {
    try {
      const { data: events } = await supabase
        .from("Events")
        .select("id, title, start_date, club_id")
        .eq("club_id", clubId)
        .gte("start_date", new Date().toISOString())
        .order("start_date");

      setAvailableEvents(events || []);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const handleEventSelect = (event: any) => {
    setSelectedEventId(event.id);
    setActiveEvent(event);
    setShowEventSelector(false);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const cleanupVideo = () => {
    if (videoRef.current) {
      console.log("🎥 Cleaning up video resources");
      videoRef.current.pauseAsync();
      videoRef.current.unloadAsync();
    }
  };

  const handleCreateStory = async (
    storyVisibility: "public" | "friends" = "friends"
  ) => {
    if (!session?.user?.id) return;

    setUploading(true);
    try {
      console.log("🎬 Creating story with:", {
        visibility: storyVisibility,
        clubId: selectedClubId,
        eventId: selectedEventId,
        caption,
      });

      // 1. Create story record
      const { data: insertStory, error: insertError } = await supabase
        .from("stories")
        .insert({
          user_id: session.user.id,
          caption: caption || null,
          media_type: mediaType,
          visibility: storyVisibility,
          club_id: selectedClubId,
          event_id: selectedEventId,
          location_name: activeClub?.Name,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Process and upload media
      let processedUri = mediaUri;
      let buffer: ArrayBuffer;

      if (mediaType === "photo") {
        const manipulated = await ImageManipulator.manipulateAsync(
          mediaUri,
          [],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        processedUri = manipulated.uri;

        const base64 = await FileSystem.readAsStringAsync(processedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        buffer = decode(base64);
      } else {
        const binaryData = await FileSystem.readAsStringAsync(processedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        buffer = decode(binaryData);
      }

      // 3. Upload to storage
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${mediaType === "photo" ? "jpg" : "mp4"}`;
      const storagePath = `stories/${session.user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("posts")
        .upload(storagePath, buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: mediaType === "photo" ? "image/jpeg" : "video/mp4",
        });

      if (uploadError) throw uploadError;

      // 4. Update story with media URL
      const { data: publicUrl } = supabase.storage
        .from("posts")
        .getPublicUrl(storagePath);

      const { error: updateError } = await supabase
        .from("stories")
        .update({ media_url: publicUrl.publicUrl })
        .eq("id", insertStory.id);

      if (updateError) throw updateError;

      // Clean up video before navigating back
      cleanupVideo();

      navigation.goBack();
    } catch (error) {
      console.error("Error creating story:", error);
      Alert.alert("Error", "Failed to create story. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const toggleVisibility = () => {
    setVisibility(visibility === "public" ? "friends" : "public");
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Media Display */}
      <View style={styles.mediaContainer}>
        {mediaType === "photo" ? (
          <Image source={{ uri: mediaUri }} style={styles.media} />
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: mediaUri }}
            style={styles.media}
            shouldPlay={true}
            isLooping={true}
            isMuted={false}
            volume={1.0}
            resizeMode={ResizeMode.COVER}
            useNativeControls={false}
            progressUpdateIntervalMillis={1000}
            onLoad={(status) => {
              console.log("🎥 Video loaded successfully:", status);
              // Ensure video starts playing and stays playing
              if (videoRef.current) {
                videoRef.current.playAsync();
              }
            }}
            onPlaybackStatusUpdate={(status) => {
              console.log("🎥 Video status:", status);
              const isPlaying = status.isLoaded && (status as any).isPlaying;
              setIsVideoPlaying(isPlaying || false);

              // If video stops playing, restart it
              if (
                status.isLoaded &&
                !(status as any).isPlaying &&
                !(status as any).didJustFinish
              ) {
                console.log("🎥 Video stopped, restarting...");
                videoRef.current?.playAsync();
              }
            }}
            onError={(error) => console.error("🎥 Video error:", error)}
          />
        )}

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Clean up video before navigating back
              cleanupVideo();
              navigation.goBack();
            }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={Constants.whiteCOLOR}
            />
          </TouchableOpacity>

          <View style={styles.topRightControls}>
            {/* Club Selector */}
            {/* Club Display - Read Only */}
            <View style={styles.clubButton}>
              <Ionicons
                name="location"
                size={16}
                color={Constants.whiteCOLOR}
              />
              <Text style={styles.clubButtonText}>
                {activeClub?.Name || "No Club"}
              </Text>
            </View>
          </View>
        </View>

        {/* Caption Input Overlay */}
        {/* {showCaptionInput && (
          <Pressable style={styles.captionBackdrop} onPress={dismissKeyboard}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.captionContainer}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.captionOverlay}>
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Add a caption..."
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                  />
                </View>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        )} */}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Friends Button */}
          <TouchableOpacity
            style={[
              styles.shareButton,
              styles.friendsButton,
              uploading && styles.shareButtonDisabled,
            ]}
            onPress={() => handleCreateStory("friends")}
            disabled={uploading}
          >
            <LinearGradient
              colors={["#4CAF50", "#45A049"]}
              style={styles.shareButtonGradient}
            >
              <Ionicons name="people" size={20} color={Constants.whiteCOLOR} />
              <Text style={styles.shareButtonText}>
                {uploading ? "Sharing..." : "Friends"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Public Button */}
          <TouchableOpacity
            style={[
              styles.shareButton,
              styles.publicButton,
              uploading && styles.shareButtonDisabled,
            ]}
            onPress={() => handleCreateStory("public")}
            disabled={uploading}
          >
            <LinearGradient
              colors={[Constants.purpleCOLOR, "#8B45FF"]}
              style={styles.shareButtonGradient}
            >
              <Ionicons name="globe" size={20} color={Constants.whiteCOLOR} />
              <Text style={styles.shareButtonText}>
                {uploading ? "Sharing..." : "Public"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Selector Modal */}
      {showEventSelector && availableEvents.length > 0 && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Event</Text>
              <TouchableOpacity onPress={() => setShowEventSelector(false)}>
                <Ionicons name="close" size={24} color={Constants.whiteCOLOR} />
              </TouchableOpacity>
            </View>
            {availableEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventOption}
                onPress={() => handleEventSelect(event)}
              >
                <Ionicons
                  name="calendar"
                  size={20}
                  color={Constants.purpleCOLOR}
                />
                <View style={styles.eventOptionText}>
                  <Text style={styles.eventOptionTitle}>{event.title}</Text>
                  <Text style={styles.eventOptionDate}>
                    {new Date(event.start_date).toLocaleDateString()}
                  </Text>
                </View>
                {selectedEventId === event.id && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={Constants.purpleCOLOR}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.blackCOLOR,
    position: "absolute",
    top: -50, // Extend beyond safe area
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  mediaContainer: {
    flex: 1,
    position: "relative",
  },
  media: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  topControls: {
    position: "absolute",
    top: 50, // Account for extended area
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  topRightControls: {
    flexDirection: "row",
    gap: 8,
  },
  clubButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  clubButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  visibilityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  visibilityButtonActive: {
    backgroundColor: Constants.purpleCOLOR,
  },
  visibilityButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  captionBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20, // Ensure it's above other elements
  },
  captionContainer: {
    position: "absolute",
    bottom: 200, // Position above the posting buttons
    left: 0,
    right: 0,
  },
  captionOverlay: {
    marginHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    padding: 16,
  },
  captionInput: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  captionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  captionButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    fontWeight: "600",
  },
  shareButton: {
    borderRadius: 25,
    overflow: "hidden",
    flex: 1,
    marginHorizontal: 5,
  },
  friendsButton: {
    // Additional styles for friends button if needed
  },
  publicButton: {
    // Additional styles for public button if needed
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  shareButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  modalContent: {
    width: "90%",
    maxHeight: "70%",
    backgroundColor: Constants.blackCOLOR,
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: Constants.whiteCOLOR,
    fontSize: 18,
    fontWeight: "600",
  },
  eventOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Constants.greyCOLOR,
    gap: 12,
  },
  eventOptionText: {
    flex: 1,
  },
  eventOptionTitle: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    fontWeight: "600",
  },
  eventOptionDate: {
    color: Constants.greyCOLOR,
    fontSize: 14,
  },
});
