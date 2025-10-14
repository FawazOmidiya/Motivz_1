import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Constants from "@/constants/Constants";
import { Story } from "../utils/storiesService";

interface StoryReelProps {
  stories: Story[];
  onStoryPress: (story: Story) => void;
  title?: string;
  showAddButton?: boolean;
  onAddStory?: () => void;
}

const { width } = Dimensions.get("window");
const STORY_SIZE = 80;
const STORY_SPACING = 12;

export default function StoryReel({
  stories,
  onStoryPress,
  title = "Stories",
  showAddButton = false,
  onAddStory,
}: StoryReelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const renderStory = ({ item, index }: { item: Story; index: number }) => (
    <TouchableOpacity
      style={styles.storyContainer}
      onPress={() => onStoryPress(item)}
    >
      <View style={styles.storyRing}>
        <Image
          source={{ uri: item.thumbnail_url || item.media_url }}
          style={styles.storyImage}
        />
        {item.visibility === "public" && (
          <View style={styles.publicBadge}>
            <Ionicons name="globe" size={12} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.user?.first_name || "User"}
      </Text>
      {item.club && (
        <Text style={styles.storyLocation} numberOfLines={1}>
          @ {item.club.Name}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderAddStory = () => (
    <TouchableOpacity style={styles.storyContainer} onPress={onAddStory}>
      <View style={[styles.storyRing, styles.addStoryRing]}>
        <Ionicons name="add" size={24} color={Constants.whiteCOLOR} />
      </View>
      <Text style={styles.storyUsername}>Add Story</Text>
    </TouchableOpacity>
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: Story | "add";
    index: number;
  }) => {
    if (item === "add") {
      return renderAddStory();
    }
    return renderStory({ item, index });
  };

  const data = showAddButton ? ["add", ...stories] : stories;

  if (stories.length === 0 && !showAddButton) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="camera-outline" size={48} color={Constants.greyCOLOR} />
        <Text style={styles.emptyText}>No stories yet</Text>
        <Text style={styles.emptySubtext}>Be the first to share a story!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{stories.length} stories</Text>
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item === "add" ? "add" : (item as Story).id
        }
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesList}
        ItemSeparatorComponent={() => <View style={{ width: STORY_SPACING }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
  },
  count: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },
  storiesList: {
    paddingHorizontal: 16,
  },
  storyContainer: {
    alignItems: "center",
    width: STORY_SIZE,
  },
  storyRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    borderWidth: 3,
    borderColor: Constants.purpleCOLOR,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  addStoryRing: {
    backgroundColor: Constants.greyCOLOR,
    borderColor: Constants.greyCOLOR,
  },
  storyImage: {
    width: STORY_SIZE - 6,
    height: STORY_SIZE - 6,
    borderRadius: (STORY_SIZE - 6) / 2,
  },
  publicBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  storyUsername: {
    fontSize: 12,
    color: Constants.whiteCOLOR,
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },
  storyLocation: {
    fontSize: 10,
    color: Constants.greyCOLOR,
    textAlign: "center",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    marginTop: 8,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginTop: 4,
  },
});
