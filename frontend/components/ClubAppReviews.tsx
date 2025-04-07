// ClubAppReviews.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { fetchClubAppReviews } from "@/app/utils/supabaseService";
import { AppReview } from "@/app/utils/types";

interface Props {
  clubId: string;
}

const ClubAppReviews: React.FC<Props> = ({ clubId }) => {
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchClubAppReviews(clubId)
      .then((data) => setReviews(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clubId]);

  if (loading) return <ActivityIndicator />;

  if (reviews.length === 0)
    return <Text style={styles.noReviews}>No reviews.</Text>;

  const renderItem = ({ item }: { item: AppReview }) => (
    <View style={styles.card}>
      <Text style={styles.rating}>★ {item.rating}</Text>
      <Text style={styles.text} numberOfLines={3}>
        {item.text}
      </Text>
      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={reviews}
      keyExtractor={(i) => i.id}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingHorizontal: 10 },
  noReviews: {
    textAlign: "center",
    color: "gray",
    marginVertical: 10,
  },
  card: {
    width: 300,
    height: 150,
    backgroundColor: "#212f66",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  rating: { color: "#FFD700", fontWeight: "bold" },
  text: { color: "#fff", marginVertical: 5 },
  date: { color: "#ccc", fontSize: 12 },
});

export default ClubAppReviews;
