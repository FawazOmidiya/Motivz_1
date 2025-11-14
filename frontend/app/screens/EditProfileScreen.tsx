import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StatusBar,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Constants from "@/constants/Constants";
import { useSession, useProfile } from "@/components/SessionContext";
import { updateUserProfile, supabase } from "@/app/utils/supabaseService";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";
import {
  MUSIC_GENRES,
  CROWD_PREFERENCES,
  NIGHTLIFE_GOALS,
  DRESS_CODE_OPTIONS,
  BUDGET_OPTIONS,
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
} from "@/constants/NightlifeConstants";
import { router } from "expo-router";

interface EditProfileScreenProps {
  navigation: any;
}

export default function EditProfileScreen({
  navigation,
}: EditProfileScreenProps) {
  const session = useSession();
  const profile = useProfile();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  // Bio and basic info
  const [bio, setBio] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Nightlife preferences
  const [favoriteMusic, setFavoriteMusic] = useState<string[]>([]);
  const [crowdPreferences, setCrowdPreferences] = useState<string[]>([]);
  const [nightlifeGoals, setNightlifeGoals] = useState<string[]>([]);
  const [dressCode, setDressCode] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [drinkingPreference, setDrinkingPreference] = useState<string>("");
  const [smokingPreference, setSmokingPreference] = useState<string>("");

  // Music genres
  // Import constants from NightlifeConstants
  const musicGenres = [...MUSIC_GENRES];
  const crowdOptions = [...CROWD_PREFERENCES];
  const goalOptions = [...NIGHTLIFE_GOALS];
  const dressCodeOptions = [...DRESS_CODE_OPTIONS];
  const budgetOptions = [...BUDGET_OPTIONS];
  const drinkingOptions = [...DRINKING_OPTIONS];
  const smokingOptions = [...SMOKING_OPTIONS];

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatar_url || "");
      setDateOfBirth(
        profile.date_of_birth ? new Date(profile.date_of_birth) : null
      );

      // Load existing preferences
      setFavoriteMusic(profile.favorite_music || []);
      setCrowdPreferences(profile.crowd_preferences || []);
      setNightlifeGoals(profile.nightlife_goals || []);
      setDressCode(profile.dress_code || []);
      setBudget(profile.budget || "");
      setDrinkingPreference(profile.drinking_preference || "");
      setSmokingPreference(profile.smoking_preference || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      // Calculate age from date of birth
      const age = dateOfBirth
        ? Math.floor(
            (Date.now() - dateOfBirth.getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : null;

      const { data, error } = await updateUserProfile(session.user.id, {
        bio,
        first_name: firstName,
        last_name: lastName,
        username,
        avatar_url: avatarUrl,
        date_of_birth: dateOfBirth?.toISOString() || undefined,
        age: age || undefined,
        favorite_music: favoriteMusic,
        crowd_preferences: crowdPreferences,
        nightlife_goals: nightlifeGoals,
        dress_code: dressCode,
        budget,
        drinking_preference: drinkingPreference,
        smoking_preference: smokingPreference,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
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

    setUploading(true);
    try {
      // Compress image using ImageManipulator
      const compressedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 400, height: 400 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!compressedImage.base64) {
        throw new Error("Failed to compress image");
      }

      // Convert base64 to ArrayBuffer
      const buffer = decode(compressedImage.base64);

      // Upload to Supabase Storage
      const storage = supabase.storage.from("avatars");

      // Generate filename & path
      const ext = "jpg"; // Always use jpg for compressed images
      const timestamp = Date.now();
      const fileName = `${session!.user.id}_${timestamp}.${ext}`;
      const filePath = `avatars/${fileName}`;

      // Upload using ArrayBuffer
      const { error: uploadError } = await storage.upload(filePath, buffer, {
        upsert: true,
        contentType: `image/${ext}`,
      });

      if (uploadError) {
        Alert.alert("Upload Error", uploadError.message);
      }

      const { data } = storage.getPublicUrl(filePath);
      // after getting publicURL:
      setAvatarUrl(data.publicUrl);
    } catch (e) {
      Alert.alert("Upload Error", (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
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

  if (!session?.user || !profile) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Constants.blackCOLOR}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Constants.whiteCOLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
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
                  {profile.first_name?.charAt(0).toUpperCase()}
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
          <Text style={styles.sectionTitle}>Basic Information</Text>
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
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={Constants.greyCOLOR}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Birthday</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {dateOfBirth
                  ? dateOfBirth.toLocaleDateString()
                  : "Select your birthday"}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Constants.purpleCOLOR}
              />
            </TouchableOpacity>
            {dateOfBirth && (
              <Text style={styles.ageText}>
                {Math.floor(
                  (Date.now() - dateOfBirth.getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000)
                )}{" "}
                years old
              </Text>
            )}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
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
        <Text style={styles.categoryTitle}>Nightlife Preferences</Text>

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

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
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
      </Modal>
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
    justifyContent: "space-between",
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
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.purpleCOLOR,
  },
  saveButtonDisabled: {
    color: Constants.greyCOLOR,
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
  readOnlyField: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  readOnlyText: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    fontWeight: "500",
  },
  ageText: {
    fontSize: 14,
    color: Constants.greyCOLOR,
    marginTop: 4,
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
  bottomSpacing: {
    height: 40,
  },
  datePickerButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePickerText: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    fontWeight: "500",
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: Constants.blackCOLOR,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  datePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
  },
  datePickerDoneButton: {
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  datePickerDoneText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "600",
  },
});
