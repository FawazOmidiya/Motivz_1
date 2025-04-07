// ReviewForm.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSession } from "@/components/SessionContext";
import { addAppReview, addAppReviewSimple } from "@/app/utils/supabaseService";
import { useNavigation } from "@react-navigation/native";

const GENRES = ["EDM", "Hip-Hop", "Rock", "Pop", "House", "Other"];

interface Props {
  clubId: string;
  onSuccess: () => void;
}

const ReviewForm: React.FC<Props> = ({ clubId, onSuccess }) => {
  const session = useSession();
  const [rating, setRating] = useState(0);
  const [genre, setGenre] = useState(GENRES[0]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!session?.user.id)
      return Alert.alert("Error", "You must be logged in.");
    if (rating < 1 || rating > 5)
      return Alert.alert("Validation", "Please select a rating 1–5.");

    setSubmitting(true);

    let result;
    if (text.trim().length === 0) {
      // No comment
      result = await addAppReviewSimple(
        clubId,
        session?.user.id,
        rating,
        genre
      );
    } else {
      // With comment
      result = await addAppReview(
        clubId,
        session?.user.id,
        rating,
        genre,
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

      <Text style={styles.label}>Genre:</Text>
      <View style={styles.genreRow}>
        {GENRES.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.genreBtn, genre === g && styles.genreSel]}
            onPress={() => setGenre(g)}
          >
            <Text style={[styles.genreTxt, genre === g && styles.genreTxtSel]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
  container: { marginVertical: 20 },
  label: { color: "#fff", marginBottom: 5 },
  ratingRow: { flexDirection: "row", marginBottom: 15 },
  star: { fontSize: 30, color: "#555", marginHorizontal: 5 },
  starSel: { color: "#FFD700" },
  genreRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  genreBtn: {
    padding: 8,
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
