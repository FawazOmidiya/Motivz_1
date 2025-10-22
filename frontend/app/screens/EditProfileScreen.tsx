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
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Constants from "@/constants/Constants";
import { useSession, useProfile } from "@/components/SessionContext";
import { updateUserProfile } from "@/app/utils/supabaseService";
import {
  MUSIC_GENRES,
  CROWD_PREFERENCES,
  NIGHTLIFE_GOALS,
  DRESS_CODE_OPTIONS,
  BUDGET_OPTIONS,
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
} from "@/constants/NightlifeConstants";

interface EditProfileScreenProps {
  navigation: any;
}

export default function EditProfileScreen({
  navigation,
}: EditProfileScreenProps) {
  const session = useSession();
  const profile = useProfile();
  const [loading, setLoading] = useState(false);

  // Bio and basic info
  const [bio, setBio] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");

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
      const { data, error } = await updateUserProfile(session.user.id, {
        bio,
        first_name: firstName,
        last_name: lastName,
        username,
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
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={Constants.whiteCOLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? "Saving..." : "Done"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Text style={styles.profilePictureInitial}>
                  {profile.first_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.changePhotoButton}>
              <Ionicons name="camera" size={16} color={Constants.whiteCOLOR} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
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
});
