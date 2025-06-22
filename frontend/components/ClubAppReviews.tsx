// ClubAppReviews.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Modal,
  SafeAreaView,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { supabase } from "../app/utils/supabaseService";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { Club } from "../app/utils/Club";
import { useSession } from "@/components/SessionContext";

export type Props = {
  clubId: string;
  isLiveOnly?: boolean;
};

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user: {
    username: string;
    avatar_url: string | null;
  };
  genres: string[];
  like_ids: string[];
  user_id: string;
}

export default function ClubAppReviews({ clubId, isLiveOnly = true }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<{ [id: string]: boolean }>({});
  const [likeAnim] = useState<{ [id: string]: Animated.Value }>({});
  const [showAll, setShowAll] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState("");
  const [editGenres, setEditGenres] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const session = useSession();
  const PREVIEW_COUNT = 3;

  const GENRES = [
    "EDM",
    "HipHop",
    "Rock",
    "Pop",
    "House",
    "Jazz",
    "R&B",
    "Latin",
    "Top40",
    "90's",
    "2000's",
    "2010's",
    "Afrobeats",
    "Reggae",
    "Blues",
    "Soul",
    "Amapiano",
    "Country",
  ];

  // Initialize liked state for reviews
  const initializeLikedState = async (reviews: Review[]) => {
    if (!session?.user?.id || reviews.length === 0) return;

    try {
      const initialLikedState: { [id: string]: boolean } = {};
      reviews.forEach((review) => {
        const likeIds = review.like_ids || [];
        initialLikedState[review.id] = likeIds.includes(session.user.id);
      });
      setLiked(initialLikedState);
    } catch (error) {
      console.error("Error initializing liked state:", error);
    }
  };

  useEffect(() => {
    setLoading(true);

    if (isLiveOnly) {
      fetchClubAndLiveReviews();
    } else {
      fetchReviews();
    }
  }, [clubId, isLiveOnly]);

  // Fetch club and then live reviews for current period
  const fetchClubAndLiveReviews = async () => {
    try {
      // First get the club data to calculate the current period's opening time
      const { data: clubData, error: clubError } = await supabase
        .from("Clubs")
        .select("*")
        .eq("id", clubId)
        .single();

      if (clubError) {
        console.log("ClubAppReviews: Club fetch error:", clubError);
        setReviews([]);
        setLoading(false);
        return;
      }

      if (!clubData) {
        console.log("ClubAppReviews: No club data found");
        setReviews([]);
        setLoading(false);
        return;
      }

      // Create a Club instance to use its methods
      const club = new Club(clubData);
      const period = club.getCurrentPeriod();

      if (!period) {
        console.log("ClubAppReviews: No current period found");
        setReviews([]);
        setLoading(false);
        return;
      }

      // Calculate the actual opening date for this period
      const now = new Date();
      const currentDay = now.getDay();

      // Since we're currently in this period, we need to calculate when it opened
      // For periods that span midnight, the opening time might be yesterday
      let openDate: Date;

      if (period.open.day === currentDay) {
        // Period opened today
        openDate = new Date(now);
        openDate.setHours(period.open.hour, period.open.minute, 0, 0);
      } else {
        // Period opened on a different day (likely yesterday for midnight-spanning periods)
        openDate = new Date(now);

        // Calculate how many days ago the period opened
        let daysAgo = 0;
        if (period.open.day < currentDay) {
          // Period opened earlier this week (e.g., Saturday opening, now Sunday)
          daysAgo = currentDay - period.open.day;
        } else {
          // Period opened later this week (e.g., Sunday opening, now Saturday)
          daysAgo = 7 - period.open.day + currentDay;
        }

        openDate.setDate(openDate.getDate() - daysAgo);
        openDate.setHours(period.open.hour, period.open.minute, 0, 0);
      }

      // Fetch reviews created after the opening time
      let query = supabase
        .from("club_reviews")
        .select(
          `
          id,
          rating,
          review_text,
          created_at,
          genres,
          like_ids,
          user_id,
          user:user_id (
            username,
            avatar_url
          )
        `
        )
        .eq("club_id", clubId)
        .gte("created_at", openDate.toISOString())
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.log("ClubAppReviews: Supabase error:", error);
        setReviews([]);
        setLoading(false);
        return;
      }
      // Only reviews with non-empty text
      const filtered = (data as unknown as Review[]).filter(
        (review) => review.review_text && review.review_text.trim().length > 0
      );

      const transformedReviews: Review[] = filtered.map((review) => ({
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        created_at: review.created_at,
        genres: review.genres,
        like_ids: review.like_ids || [],
        user_id: review.user_id,
        user: {
          username: review.user.username,
          avatar_url: review.user.avatar_url,
        },
      }));

      setReviews(transformedReviews);
      // Initialize liked state for the loaded reviews
      await initializeLikedState(transformedReviews);
      setLoading(false);
    } catch (e) {
      console.error("ClubAppReviews: Unexpected error:", e);
      setReviews([]);
      setLoading(false);
    }
  };

  // For non-live reviews, just filter out those without text
  const fetchReviews = async () => {
    try {
      let query = supabase
        .from("club_reviews")
        .select(
          `
          id,
          rating,
          review_text,
          created_at,
          genres,
          like_ids,
          user_id,
          user:user_id (
            username,
            avatar_url
          )
        `
        )
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.log("ClubAppReviews: fetchReviews error:", error);
        setReviews([]);
        setLoading(false);
        return;
      }

      // Only reviews with non-empty text
      const filtered = (data as unknown as Review[]).filter(
        (review) => review.review_text && review.review_text.trim().length > 0
      );

      const transformedReviews: Review[] = filtered.map((review) => ({
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        created_at: review.created_at,
        genres: review.genres,
        like_ids: review.like_ids || [],
        user_id: review.user_id,
        user: {
          username: review.user.username,
          avatar_url: review.user.avatar_url,
        },
      }));

      setReviews(transformedReviews);
      // Initialize liked state for the loaded reviews
      await initializeLikedState(transformedReviews);
      setLoading(false);
    } catch (e) {
      console.error("ClubAppReviews: fetchReviews unexpected error:", e);
      setReviews([]);
      setLoading(false);
    }
  };

  const handleLike = async (id: string) => {
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to like reviews.");
      return;
    }

    // Find the current review
    const review = reviews.find((r) => r.id === id);
    if (!review) return;

    // Optimistically update the UI first
    const currentLikedState = liked[id] || false;
    const newLikedState = !currentLikedState;
    const currentLikeIds = review.like_ids || [];
    const newLikeIds = newLikedState
      ? [...currentLikeIds, session.user.id]
      : currentLikeIds.filter((userId) => userId !== session.user.id);

    // Update local state immediately for responsive UI
    setLiked((prev) => ({ ...prev, [id]: newLikedState }));
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, like_ids: newLikeIds } : r))
    );

    // Animate the heart
    if (!likeAnim[id]) {
      likeAnim[id] = new Animated.Value(1);
    }
    Animated.sequence([
      Animated.timing(likeAnim[id], {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnim[id], {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    // Update the database
    try {
      const { error } = await supabase
        .from("club_reviews")
        .update({ like_ids: newLikeIds })
        .eq("id", id);

      if (error) {
        console.error("Error updating likes:", error);
        // Revert the UI state if the update failed
        setLiked((prev) => ({ ...prev, [id]: currentLikedState }));
        setReviews((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, like_ids: currentLikeIds } : r
          )
        );
        Alert.alert("Error", "Failed to update like. Please try again.");
      }
    } catch (error) {
      console.error("Error handling like:", error);
      // Revert the UI state if the update failed
      setLiked((prev) => ({ ...prev, [id]: currentLikedState }));
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, like_ids: currentLikeIds } : r))
      );
      Alert.alert("Error", "Failed to update like. Please try again.");
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditText(review.review_text || "");
    setEditGenres(review.genres);
    setEditModalVisible(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("club_reviews")
                .delete()
                .eq("id", reviewId);

              if (error) {
                Alert.alert("Error", "Failed to delete review.");
              } else {
                // Remove from local state
                setReviews((prev) => prev.filter((r) => r.id !== reviewId));
                setEditModalVisible(false);
                setEditingReview(null);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete review.");
            }
          },
        },
      ]
    );
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;

    if (editRating < 1 || editRating > 5) {
      return Alert.alert("Validation", "Please select a rating 1–5.");
    }
    if (editGenres.length === 0) {
      return Alert.alert("Validation", "Please select at least one genre.");
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("club_reviews")
        .update({
          rating: editRating,
          review_text: editText,
          genres: editGenres,
        })
        .eq("id", editingReview.id);

      if (error) {
        Alert.alert("Error", "Failed to update review.");
      } else {
        // Update local state
        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingReview.id
              ? {
                  ...r,
                  rating: editRating,
                  review_text: editText,
                  genres: editGenres,
                }
              : r
          )
        );
        setEditModalVisible(false);
        setEditingReview(null);
        Alert.alert("Success", "Review updated successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update review.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEditGenre = (genre: string) => {
    setEditGenres((prevSelected) =>
      prevSelected.includes(genre)
        ? prevSelected.filter((g) => g !== genre)
        : [...prevSelected, genre]
    );
  };

  const renderReview = ({ item }: { item: Review }) => {
    // Log the review text for debugging
    const dateObj = new Date(item.created_at);
    const dateStr = dateObj.toLocaleDateString();
    const timeStr = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const isOwnReview = session?.user?.id === item.user_id;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeaderRow}>
          <View style={styles.avatarShadow}>
            {item.user.avatar_url ? (
              <Image
                source={{ uri: item.user.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Ionicons name="person" size={28} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.username}>{item.user.username}</Text>
            <Text style={styles.reviewDate}>{dateStr}</Text>
            <Text style={styles.reviewTime}>{timeStr}</Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons
              name="star"
              size={22}
              color="#FFD700"
              style={{ marginRight: 2 }}
            />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => handleLike(item.id)}>
              <Animated.View
                style={{ transform: [{ scale: likeAnim[item.id] || 1 }] }}
              >
                <FontAwesome
                  name={liked[item.id] ? "heart" : "heart-o"}
                  size={22}
                  color={liked[item.id] ? "#E91E63" : "#aaa"}
                />
              </Animated.View>
            </TouchableOpacity>
            {item.like_ids && item.like_ids.length > 0 && (
              <Text style={styles.likesCount}>{item.like_ids.length}</Text>
            )}
            {isOwnReview && (
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={() => handleEditReview(item)}
                  style={styles.editButton}
                >
                  <Ionicons name="pencil" size={18} color="#aaa" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteReview(item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash" size={18} color="#E91E63" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <View style={styles.reviewTextRow}>
          <Ionicons
            name="chatbubble-ellipses"
            size={18}
            color="#B388FF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.reviewText}>
            {item.review_text || "No review text"}
          </Text>
        </View>
        {item.genres && item.genres.length > 0 && (
          <View style={styles.genresContainer}>
            {item.genres.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Ionicons
                  name="musical-notes"
                  size={12}
                  color="#fff"
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {isLiveOnly
            ? "No live reviews yet. Be the first to review!"
            : "No reviews yet."}
        </Text>
      </View>
    );
  }

  // Preview mode: show only first PREVIEW_COUNT reviews
  const previewReviews = reviews.slice(0, PREVIEW_COUNT);
  const hasMore = reviews.length > PREVIEW_COUNT;

  return (
    <>
      <View style={styles.list}>
        {(showAll ? reviews : previewReviews).map((item) => (
          <View key={item.id}>{renderReview({ item })}</View>
        ))}
      </View>
      {hasMore && !showAll && (
        <TouchableOpacity
          style={styles.seeMoreButton}
          onPress={() => setShowAll(true)}
        >
          <Text style={styles.seeMoreText}>See More</Text>
        </TouchableOpacity>
      )}
      <Modal
        visible={showAll}
        animationType="slide"
        onRequestClose={() => setShowAll(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Reviews</Text>
            <TouchableOpacity onPress={() => setShowAll(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={reviews}
            renderItem={renderReview}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        </SafeAreaView>
      </Modal>

      {/* Edit Review Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Review</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.editModalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.editLabel}>Rating:</Text>
            <View style={styles.editRatingContainer}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setEditRating(n)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name="star"
                      size={48}
                      color={editRating >= n ? "#FFD700" : "#555"}
                      style={styles.star}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingText}>
                {editRating === 0 && "Tap a star to rate"}
                {editRating === 1 && "Wack"}
                {editRating === 2 && "Mid"}
                {editRating === 3 && "It's okay"}
                {editRating === 4 && "Kinda lit"}
                {editRating === 5 && "It's bumping"}
              </Text>
            </View>

            <Text style={styles.editLabel}>Genres:</Text>
            <ScrollView
              style={styles.genreScrollContainer}
              contentContainerStyle={styles.genreContainer}
              showsVerticalScrollIndicator={false}
            >
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genreBtn,
                    editGenres.includes(g) && styles.genreSel,
                  ]}
                  onPress={() => toggleEditGenre(g)}
                >
                  <Text
                    style={[
                      styles.genreTxt,
                      editGenres.includes(g) && styles.genreTxtSel,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.editLabel}>Review:</Text>
            <TextInput
              style={styles.editTextInput}
              multiline
              placeholder="How were the vibes?"
              placeholderTextColor="#aaa"
              value={editText}
              onChangeText={setEditText}
              autoCorrect={true}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.btnDisabled]}
              onPress={handleUpdateReview}
              disabled={submitting}
            >
              <Text style={styles.submitTxt}>
                {submitting ? "Updating..." : "Update Review"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    // Removed flex: 1 since this is no longer a FlatList
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
  },
  reviewCard: {
    backgroundColor: "rgba(40, 30, 60, 0.95)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 22,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#888",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultAvatar: {
    backgroundColor: "#888",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  username: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  reviewDate: {
    color: "#bbb",
    fontSize: 13,
    marginTop: 2,
  },
  reviewTime: {
    color: "#bbb",
    fontSize: 12,
    marginTop: -2,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  rating: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  likesCount: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 4,
    marginRight: 8,
  },
  editActions: {
    flexDirection: "row",
    marginLeft: 8,
  },
  editButton: {
    padding: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  reviewTextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    marginTop: 2,
  },
  reviewText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  genreTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C4DFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 6,
  },
  genreText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  seeMoreButton: {
    alignSelf: "center",
    backgroundColor: "#7C4DFF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  seeMoreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(40, 30, 60, 1)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  editModalContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  editLabel: {
    color: "#fff",
    marginBottom: 15,
    fontSize: 18,
    fontWeight: "600",
  },
  editRatingContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  starButton: {
    padding: 8,
  },
  star: {
    marginHorizontal: 8,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "600",
  },
  genreScrollContainer: {
    maxHeight: 150,
    marginBottom: 30,
  },
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  genreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#333",
    borderRadius: 12,
    margin: 4,
  },
  genreSel: {
    backgroundColor: "#7C4DFF",
  },
  genreTxt: {
    color: "#fff",
    fontSize: 14,
  },
  genreTxtSel: {
    fontWeight: "bold",
  },
  editTextInput: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 12,
    padding: 15,
    height: 120,
    marginBottom: 30,
    fontSize: 16,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#7C4DFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnDisabled: {
    backgroundColor: "#555",
  },
  submitTxt: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
