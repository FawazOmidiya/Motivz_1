// ReviewForm.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useSession } from "@/components/SessionContext";
import { addAppReview, addAppReviewSimple } from "@/app/utils/supabaseService";
import { useNavigation } from "@react-navigation/native";

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

interface Props {
  clubId: string;
  onSuccess: () => void;
}

const ReviewForm: React.FC<Props> = ({ clubId, onSuccess }) => {
  const session = useSession();
  const [rating, setRating] = useState(0);
  // Replace single selection with multiselect state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation();

  // Toggle genre in multiselect state:
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prevSelected) =>
      prevSelected.includes(genre)
        ? prevSelected.filter((g) => g !== genre)
        : [...prevSelected, genre]
    );
  };

  const submit = async () => {
    if (!session?.user.id) {
      return Alert.alert("Error", "You must be logged in.");
    }
    if (rating < 1 || rating > 5) {
      return Alert.alert("Validation", "Please select a rating 1–5.");
    }
    if (selectedGenres.length === 0) {
      return Alert.alert("Validation", "Please select at least one genre.");
    }

    setSubmitting(true);

    // If your API expects a string, you can join the genres with a delimiter.
    const genresString = selectedGenres.join(", ");

    let result;
    if (text.trim().length === 0) {
      // No comment provided.
      result = await addAppReview(
        clubId,
        session.user.id,
        rating,
        genresString,
        text
      );
    } else {
      // With comment provided.
      result = await addAppReview(
        clubId,
        session.user.id,
        rating,
        genresString,
        text
      );
    }

    setSubmitting(false);

    if (result.error) {
      Alert.alert("Error", result.error.message);
    } else {
      Alert.alert("Thank you!", "Your review has been submitted.");
      onSuccess();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rating:</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, rating >= n && styles.starSel]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>What kind of music is being played?</Text>
      <ScrollView
        style={styles.genreScrollContainer}
        contentContainerStyle={styles.genreContainer}
      >
        {GENRES.map((g) => (
          <TouchableOpacity
            key={g}
            style={[
              styles.genreBtn,
              selectedGenres.includes(g) && styles.genreSel,
            ]}
            onPress={() => toggleGenre(g)}
          >
            <Text
              style={[
                styles.genreTxt,
                selectedGenres.includes(g) && styles.genreTxtSel,
              ]}
            >
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Review (optional):</Text>
      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Your thoughts..."
        placeholderTextColor="#aaa"
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.btnDisabled]}
        onPress={submit}
        disabled={submitting}
      >
        <Text style={styles.submitTxt}>
          {submitting ? "Submitting..." : "Submit"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { color: "#fff", marginBottom: 5 },
  ratingRow: { flexDirection: "row", marginBottom: 15 },
  star: { fontSize: 30, color: "#555", marginHorizontal: 5 },
  starSel: { color: "#FFD700" },
  // ScrollView that holds all genre buttons and enables vertical scrolling if needed.
  genreScrollContainer: {
    maxHeight: 100, // Adjust this height as needed to show approximately 2 rows.
    marginBottom: 15,
  },
  // Content container that lays out the buttons with flexWrap.
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  genreBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#333",
    borderRadius: 12,
    margin: 4,
  },
  genreSel: { backgroundColor: "#007AFF" },
  genreTxt: { color: "#fff" },
  genreTxtSel: { fontWeight: "bold" },
  textInput: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    height: 80,
    marginBottom: 15,
  },
  submitBtn: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#555" },
  submitTxt: { color: "#fff", fontWeight: "bold" },
});

export default ReviewForm;
