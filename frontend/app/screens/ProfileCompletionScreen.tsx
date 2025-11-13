import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Constants from "@/constants/Constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase, storage } from "../utils/supabaseService";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MUSIC_GENRES,
  CROWD_PREFERENCES,
  NIGHTLIFE_GOALS,
  DRESS_CODE_OPTIONS,
  BUDGET_OPTIONS,
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
} from "@/constants/NightlifeConstants";

// Route params type for reference
type RouteParams = {
  signUpInfo?: {
    username: string;
    email: string;
    password: string;
  };
  googleUserData?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  googleTokens?: {
    idToken: string;
    accessToken: string;
  };
  appleUserData?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function ProfileCompletionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    signUpInfo?: string;
    googleUserData?: string;
    googleTokens?: string;
    appleUserData?: string;
    appleTokens?: string;
  }>();

  // Parse signUpInfo if it's a JSON string
  let signUpInfo: { username: string; email: string; password: string } = {
    username: "",
    email: "",
    password: "",
  };
  try {
    if (params.signUpInfo) {
      signUpInfo = JSON.parse(params.signUpInfo);
    }
  } catch (e) {
    // Ignore parsing errors
  }

  // Parse other params if they're JSON strings
  let googleUserData: RouteParams["googleUserData"] | undefined;
  let googleTokens: RouteParams["googleTokens"] | undefined;
  let appleUserData: RouteParams["appleUserData"] | undefined;
  let appleTokens: { identityToken: string } | undefined;

  try {
    if (params.googleUserData) {
      googleUserData = JSON.parse(params.googleUserData);
    }
    if (params.googleTokens) {
      googleTokens = JSON.parse(params.googleTokens);
    }
    if (params.appleUserData) {
      appleUserData = JSON.parse(params.appleUserData);
    }
    if (params.appleTokens) {
      appleTokens = JSON.parse(params.appleTokens);
    }
  } catch (e) {
    // Ignore parsing errors
  }

  const [firstName, setFirstName] = useState(
    googleUserData?.firstName || appleUserData?.firstName || ""
  );
  const [lastName, setLastName] = useState(
    googleUserData?.lastName || appleUserData?.lastName || ""
  );
  const [username, setUsername] = useState(signUpInfo?.username || "");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Nightlife preferences
  const [favoriteMusic, setFavoriteMusic] = useState<string[]>([]);
  const [crowdPreferences, setCrowdPreferences] = useState<string[]>([]);
  const [nightlifeGoals, setNightlifeGoals] = useState<string[]>([]);
  const [dressCode, setDressCode] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [drinkingPreference, setDrinkingPreference] = useState<string>("");
  const [smokingPreference, setSmokingPreference] = useState<string>("");

  // Music genres
  const musicGenres = [...MUSIC_GENRES];
  const crowdOptions = [...CROWD_PREFERENCES];
  const goalOptions = [...NIGHTLIFE_GOALS];
  const dressCodeOptions = [...DRESS_CODE_OPTIONS];
  const budgetOptions = [...BUDGET_OPTIONS];
  const drinkingOptions = [...DRINKING_OPTIONS];
  const smokingOptions = [...SMOKING_OPTIONS];

  // Calculate age from date of birth
  const calculateAge = (dob: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const toggleArrayItem = (
    array: string[],
    setArray: (arr: string[]) => void,
    item: string
  ) => {
    if (array.includes(item)) {
      setArray(array.filter((i) => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  async function pickAndUploadImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("Permission Denied", "Media access is required.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;
    setUploading(true);
    const asset = result.assets[0];
    if (!asset.base64) {
      return Alert.alert("Error", "Failed to get image data.");
    }

    try {
      // Compress image using ImageManipulator
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert compressed image to base64
      const compressedBase64 = await FileSystem.readAsStringAsync(
        manipulated.uri,
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );

      // Decode Base64 to ArrayBuffer
      const buffer = decode(compressedBase64);

      // Generate filename & path
      const ext = "jpg"; // Always use jpg for compressed images
      const timestamp = Date.now();
      const fileName = `temp_${timestamp}.${ext}`;
      const filePath = `avatars/${fileName}`;

      // Upload using ArrayBuffer
      const { error: uploadError } = await storage.upload(filePath, buffer, {
        upsert: true,
        contentType: `image/${ext}`,
      });

      if (uploadError) throw uploadError;

      const { data } = storage.getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (e) {
      Alert.alert("Upload Error", (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const handleSubmit = async () => {
    if (!firstName || !lastName || !username) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!dateOfBirth) {
      Alert.alert("Error", "Please select your date of birth");
      return;
    }

    // Check if user is at least 18 years old
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      Alert.alert("Error", "You must be at least 18 years old to use this app");
      return;
    }

    // Check if at least one nightlife preference is selected
    const hasNightlifePreferences =
      favoriteMusic.length > 0 ||
      crowdPreferences.length > 0 ||
      nightlifeGoals.length > 0 ||
      dressCode.length > 0 ||
      budget ||
      drinkingPreference ||
      smokingPreference;

    if (!hasNightlifePreferences) {
      Alert.alert(
        "Error",
        "Please select at least one nightlife preference to help us personalize your experience"
      );
      return;
    }

    setLoading(true);
    try {
      let userId: string;

      // FIRST: Check if user is already authenticated (most common case for OAuth)
      // This handles Apple/Google users who signed in and were redirected to profile completion
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        // User is already authenticated - use their ID
        // This is the normal flow for Apple/Google sign-in users
        userId = currentUser.id;
      } else if (googleUserData && googleTokens) {
        // Fallback: Google sign-in with tokens (if passed as params)
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: googleTokens.idToken,
        });

        if (error) throw error;
        if (!data.user) throw new Error("Failed to authenticate with Google");

        userId = data.user.id;
      } else if (appleUserData && appleTokens) {
        // Fallback: Apple sign-in with tokens (if passed as params)
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: appleTokens.identityToken,
        });

        if (error) throw error;
        if (!data.user) throw new Error("Failed to authenticate with Apple");

        userId = data.user.id;
      } else {
        // Last resort: Regular email/password sign-up
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: signUpInfo.email,
            password: signUpInfo.password,
          }
        );

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user account");
        userId = authData.user.id;
      }

      // Mark that user just completed profile - this will trigger tutorial
      await AsyncStorage.setItem("profile_just_completed", "true");
      console.log(
        "✅ ProfileCompletionScreen: Set profile_just_completed flag"
      );

      // Create or update the user profile
      const age = calculateAge(dateOfBirth);
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        username: username,
        first_name: firstName,
        last_name: lastName,
        bio: bio,
        date_of_birth: dateOfBirth,
        age: age,
        avatar_url: avatarUrl,
        favorite_music: favoriteMusic,
        crowd_preferences: crowdPreferences,
        nightlife_goals: nightlifeGoals,
        dress_code: dressCode,
        budget: budget,
        drinking_preference: drinkingPreference,
        smoking_preference: smokingPreference,
        is_complete: true,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // Trigger a session refresh to update the profile status
      const { data: refreshedSession } = await supabase.auth.refreshSession();

      Alert.alert("Success", "Profile completed successfully!");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error completing profile:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderMultiSelect = (
    title: string,
    options: string[],
    selected: string[],
    onToggle: (item: string) => void,
    maxSelections?: number
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionChip,
              selected.includes(option) && styles.optionChipSelected,
            ]}
            onPress={() => {
              if (
                maxSelections &&
                selected.length >= maxSelections &&
                !selected.includes(option)
              ) {
                Alert.alert(
                  "Limit reached",
                  `You can only select up to ${maxSelections} options`
                );
                return;
              }
              onToggle(option);
            }}
          >
            <Text
              style={[
                styles.optionChipText,
                selected.includes(option) && styles.optionChipTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSingleSelect = (
    title: string,
    options: string[],
    selected: string,
    onSelect: (item: string) => void
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionChip,
              selected === option && styles.optionChipSelected,
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.optionChipText,
                selected === option && styles.optionChipTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Constants.blackCOLOR}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Text style={styles.profilePictureInitial}>
                  {firstName?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={pickAndUploadImage}
              disabled={uploading}
            >
              <Ionicons name="camera" size={16} color={Constants.whiteCOLOR} />
              <Text style={styles.changePhotoText}>
                {uploading ? "Uploading..." : "Change Photo"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information *</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor={Constants.greyCOLOR}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor={Constants.greyCOLOR}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={(text) => {
                const validPattern = /^[a-z0-9\-_.]*$/;
                const lowercaseText = text.toLowerCase();
                if (validPattern.test(lowercaseText)) {
                  setUsername(lowercaseText);
                } else {
                  Alert.alert(
                    "Invalid Username",
                    "Username can only contain lowercase letters, numbers, hyphens (-), underscores (_), and periods (.)"
                  );
                }
              }}
              placeholder="Enter your username"
              placeholderTextColor={Constants.greyCOLOR}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Birthday *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateInputText}>
                {dateOfBirth
                  ? dateOfBirth.toLocaleDateString()
                  : "Select your date of birth"}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Constants.greyCOLOR}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio (Optional)</Text>
          <View style={styles.bioContainer}>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself and what you're looking for..."
              placeholderTextColor={Constants.greyCOLOR}
              multiline
              maxLength={150}
            />
            <Text style={styles.characterCount}>{bio.length}/150</Text>
          </View>
        </View>

        {/* Nightlife Preferences */}
        <Text style={styles.categoryTitle}>Nightlife Preferences *</Text>

        {/* Favorite Music */}
        {renderMultiSelect(
          "Favorite Music Genres",
          musicGenres,
          favoriteMusic,
          (item) => toggleArrayItem(favoriteMusic, setFavoriteMusic, item),
          5
        )}

        {/* Crowd Preferences */}
        {renderMultiSelect(
          "Crowd Preferences",
          crowdOptions,
          crowdPreferences,
          (item) =>
            toggleArrayItem(crowdPreferences, setCrowdPreferences, item),
          4
        )}

        {/* Nightlife Goals */}
        {renderMultiSelect(
          "What are you looking for?",
          goalOptions,
          nightlifeGoals,
          (item) => toggleArrayItem(nightlifeGoals, setNightlifeGoals, item),
          3
        )}

        {/* Dress Code */}
        {renderMultiSelect(
          "Dress Code Preferences",
          dressCodeOptions,
          dressCode,
          (item) => toggleArrayItem(dressCode, setDressCode, item),
          3
        )}

        {/* Budget */}
        {renderSingleSelect(
          "Budget Preference",
          budgetOptions,
          budget,
          setBudget
        )}

        {/* Drinking Preference */}
        {renderSingleSelect(
          "Drinking Preference",
          drinkingOptions,
          drinkingPreference,
          setDrinkingPreference
        )}

        {/* Smoking Preference */}
        {renderSingleSelect(
          "Smoking Preference",
          smokingOptions,
          smokingPreference,
          setSmokingPreference
        )}

        {/* Submit Button */}
        <View style={styles.submitSection}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={Constants.purpleCOLOR}
              style={styles.loader}
            />
          ) : (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {googleUserData ? "Complete Profile" : "Create Account"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerCancelButton}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Select Birthday</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerDoneButton}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={dateOfBirth || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setDateOfBirth(selectedDate);
                }
              }}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.blackCOLOR,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Constants.whiteCOLOR,
    marginTop: 24,
    marginBottom: 16,
  },
  profilePictureContainer: {
    alignItems: "center",
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profilePicturePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Constants.purpleCOLOR,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profilePictureInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  changePhotoText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Constants.whiteCOLOR,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Constants.whiteCOLOR,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  dateInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateInputText: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
  },
  bioContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  bioInput: {
    padding: 12,
    fontSize: 16,
    color: Constants.whiteCOLOR,
    minHeight: 80,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: Constants.greyCOLOR,
    textAlign: "right",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  optionChipSelected: {
    backgroundColor: Constants.purpleCOLOR,
    borderColor: Constants.purpleCOLOR,
  },
  optionChipText: {
    fontSize: 14,
    color: Constants.whiteCOLOR,
    fontWeight: "500",
  },
  optionChipTextSelected: {
    color: Constants.whiteCOLOR,
    fontWeight: "600",
  },
  submitSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    marginVertical: 20,
  },
  bottomSpacing: {
    height: 40,
  },
  datePickerModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  datePickerContainer: {
    backgroundColor: Constants.blackCOLOR,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20, // Account for home indicator
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  datePickerCancelButton: {
    paddingVertical: 8,
  },
  datePickerCancelText: {
    color: Constants.greyCOLOR,
    fontSize: 16,
  },
  datePickerTitle: {
    color: Constants.whiteCOLOR,
    fontSize: 18,
    fontWeight: "600",
  },
  datePickerDoneButton: {
    paddingVertical: 8,
  },
  datePickerDoneText: {
    color: Constants.purpleCOLOR,
    fontSize: 16,
    fontWeight: "600",
  },
});
