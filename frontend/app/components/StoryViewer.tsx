import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import * as Constants from "@/constants/Constants";

const { width, height } = Dimensions.get("window");

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "photo" | "video";
  caption?: string;
  location_name?: string;
  visibility: "public" | "friends";
  user?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  club?: {
    id: string;
    Name: string;
    Image?: string;
  };
  event?: {
    id: string;
    title: string;
    start_date: string;
  };
}

interface StoryViewerProps {
  visible: boolean;
  story: Story | null;
  onClose: () => void;
}

export default function StoryViewer({
  visible,
  story,
  onClose,
}: StoryViewerProps) {
  const [showCaption, setShowCaption] = useState(false);

  useEffect(() => {
    if (visible) {
      // Hide status bar for full-screen experience
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }

    return () => {
      StatusBar.setHidden(false);
    };
  }, [visible]);

  if (!story) return null;

  const handleBackdropPress = () => {
    onClose();
  };

  const handleContentPress = () => {
    setShowCaption(!showCaption);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const storyDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - storyDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.userInfo}>
                {story.user?.avatar_url ? (
                  <Image
                    source={{ uri: story.user.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons
                      name="person"
                      size={20}
                      color={Constants.whiteCOLOR}
                    />
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.username}>
                    {story.user?.first_name || story.user?.username || "User"}
                  </Text>
                  <Text style={styles.timeAgo}>
                    {formatTimeAgo(
                      story.created_at || new Date().toISOString()
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                {story.visibility === "public" && (
                  <View style={styles.publicBadge}>
                    <Ionicons name="globe" size={12} color="#fff" />
                  </View>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={Constants.whiteCOLOR}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Media Content */}
            <Pressable
              style={styles.mediaContainer}
              onPress={handleContentPress}
            >
              {story.media_type === "video" ? (
                <Video
                  source={{ uri: story.media_url }}
                  style={styles.media}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                />
              ) : (
                <Image
                  source={{ uri: story.media_url }}
                  style={styles.media}
                  resizeMode="cover"
                />
              )}
            </Pressable>

            {/* Caption Overlay */}
            {showCaption && story.caption && (
              <View style={styles.captionOverlay}>
                <Text style={styles.captionText}>{story.caption}</Text>
              </View>
            )}

            {/* Location Info */}
            {(story.club || story.event) && (
              <View style={styles.locationInfo}>
                <Ionicons
                  name="location"
                  size={16}
                  color={Constants.whiteCOLOR}
                />
                <Text style={styles.locationText}>
                  {story.club?.Name || story.event?.title}
                </Text>
              </View>
            )}

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons
                  name="heart-outline"
                  size={24}
                  color={Constants.whiteCOLOR}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons
                  name="chatbubble-outline"
                  size={24}
                  color={Constants.whiteCOLOR}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons
                  name="send-outline"
                  size={24}
                  color={Constants.whiteCOLOR}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.blackCOLOR,
  },
  backdrop: {
    flex: 1,
  },
  content: {
    flex: 1,
    position: "relative",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    fontWeight: "600",
  },
  timeAgo: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  publicBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: width,
    height: height,
  },
  captionOverlay: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    padding: 12,
  },
  captionText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    lineHeight: 22,
  },
  locationInfo: {
    position: "absolute",
    bottom: 120,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  bottomActions: {
    position: "absolute",
    bottom: 20,
    right: 16,
    flexDirection: "row",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
});
