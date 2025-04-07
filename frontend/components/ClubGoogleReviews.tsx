import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { fetchClubGoogleReviews } from "@/app/utils/supabaseService";
import { GoogleReview } from "@/app/utils/types";

interface ClubGoogleReviewsProps {
  clubId: string;
}

const CARD_WIDTH = Dimensions.get("window").width * 0.8; // 80% of screen width
const CARD_HEIGHT_COLLAPSED = 150;
const CARD_PADDING = 10;

const ClubGoogleReviews: React.FC<ClubGoogleReviewsProps> = ({ clubId }) => {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      const data = await fetchClubGoogleReviews(clubId);
      setReviews(data);
      setLoading(false);
    }
    loadReviews();
  }, [clubId]);

  if (loading) {
    return <ActivityIndicator />;
  }
  if (reviews.length === 0) {
    return <Text style={styles.noReviews}>No Google reviews.</Text>;
  }

  const renderReview = ({ item }: { item: GoogleReview }) => {
    const isExpanded = item.review_id === expandedId;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          setExpandedId(isExpanded ? null : item.review_id);
        }}
        style={[
          styles.card,
          {
            width: CARD_WIDTH,
            height: isExpanded ? undefined : CARD_HEIGHT_COLLAPSED,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.rating}>★ {item.rating}</Text>
          <Text style={styles.time}>
            {item.relative_publish_time_description}
          </Text>
        </View>
        <Text style={styles.text} numberOfLines={isExpanded ? undefined : 4}>
          {item.text}
        </Text>
        {item.author_display_name && (
          <View style={styles.authorRow}>
            {item.author_photo_uri && (
              <Image
                source={{ uri: item.author_photo_uri }}
                style={styles.avatar}
              />
            )}
            <Text style={styles.author}> {item.author_display_name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item) => item.review_id}
      renderItem={renderReview}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      snapToInterval={CARD_WIDTH + CARD_PADDING * 2}
      decelerationRate="fast"
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: CARD_PADDING,
  },
  noReviews: {
    textAlign: "center",
    color: "gray",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#212f66",
    borderRadius: 10,
    padding: CARD_PADDING,
    marginHorizontal: CARD_PADDING,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  rating: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  time: {
    color: "#ccc",
    fontSize: 12,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  author: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 5,
  },
});

export default ClubGoogleReviews;
