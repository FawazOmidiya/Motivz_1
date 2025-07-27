// ReviewForm.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useSession } from "@/components/SessionContext";
import { useNavigation } from "@react-navigation/native";
import * as Constants from "@/constants/Constants";
import { Club } from "@/app/utils/Club";
import { Ionicons } from "@expo/vector-icons";

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
  club: Club;
  onSuccess: () => void;
}

const ReviewForm: React.FC<Props> = ({ club, onSuccess }) => {
  const session = useSession();
  const [rating, setRating] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        // Scroll to bottom when keyboard shows
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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

    let result;
    result = await club.addAppReview(
      session.user.id,
      rating,
      selectedGenres,
      text
    );

    setSubmitting(false);

    if (result.error) {
      Alert.alert("Error", result.error.message);
    } else {
      Alert.alert("Thank you!", "Your review has been submitted.");
      onSuccess();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Rate your experience</Text>
        <Text style={styles.subtitle}>How would you rate {club.name}?</Text>

        {/* Rating Section */}
        <View style={styles.ratingContainer}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setRating(n)}
                style={styles.starButton}
              >
                <Ionicons
                  name="star"
                  size={48}
                  color={rating >= n ? "#FFD700" : "#555"}
                  style={styles.star}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0 && "Tap a star to rate"}
            {rating === 1 && "Wack"}
            {rating === 2 && "Mid"}
            {rating === 3 && "It's okay"}
            {rating === 4 && "Kinda lit"}
            {rating === 5 && "It's bumping"}
          </Text>
        </View>

        {/* Genres Section */}
        <Text style={styles.label}>What kind of music is being played?</Text>
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

        <Text style={styles.label}>Review:</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="How were the vibes?"
          placeholderTextColor="#aaa"
          value={text}
          onChangeText={setText}
          autoCorrect={true}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={styles.submitTxt}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  ratingContainer: {
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
  label: {
    color: "#fff",
    marginBottom: 15,
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
    backgroundColor: Constants.purpleCOLOR,
  },
  genreTxt: {
    color: "#fff",
    fontSize: 14,
  },
  genreTxtSel: {
    fontWeight: "bold",
  },
  textInput: {
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
    backgroundColor: Constants.purpleCOLOR,
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

export default ReviewForm;
