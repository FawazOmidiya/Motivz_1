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
} from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Constants from "@/constants/Constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase, storage } from "../utils/supabaseService";
import * as ImagePicker from "expo-image-picker";
import { supabaseAuth } from "../utils/supabaseAuth";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../utils/types";
import { decode } from "base64-arraybuffer";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

type ProfileCompletionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ProfileCompletion"
>;

type RouteParams = {
  signUpInfo: {
    username: string;
    email: string;
    password: string;
  };
};

export default function ProfileCompletionScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation<ProfileCompletionScreenNavigationProp>();
  const route = useRoute();
  const { signUpInfo } = route.params as RouteParams;

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
    if (!firstName || !lastName) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // 1. Create the user account
      const { data: authData, error: authError } =
        await supabaseAuth.auth.signUp({
          email: signUpInfo.email,
          password: signUpInfo.password,
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user account");

      // 2. Create the user profile with avatar URL if selected
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: signUpInfo.username,
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Constants.backgroundCOLOR}
      />

      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "transparent"]}
        style={styles.headerGradient}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text variant="displayLarge" style={styles.title}>
              Complete Your Profile
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Tell us a bit about yourself
            </Text>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={pickAndUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.avatar}>
                  <ActivityIndicator
                    size="large"
                    color={Constants.whiteCOLOR}
                  />
                </View>
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color="#fff" />
                </View>
              )}

              <View style={styles.editOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text variant="bodyMedium" style={styles.avatarLabel}>
              Tap to add a photo
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text variant="headlineSmall" style={styles.formTitle}>
              Personal Information
            </Text>

            <View style={styles.inputGroup}>
              <TextInput
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                placeholderTextColor="rgba(255,255,255,0.5)"
                textColor="#fff"
                mode="outlined"
                outlineColor="rgba(255,255,255,0.2)"
                activeOutlineColor={Constants.purpleCOLOR}
                left={
                  <TextInput.Icon
                    icon="account"
                    color="rgba(255,255,255,0.7)"
                  />
                }
              />

              <TextInput
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                placeholderTextColor="rgba(255,255,255,0.5)"
                textColor="#fff"
                mode="outlined"
                outlineColor="rgba(255,255,255,0.2)"
                activeOutlineColor={Constants.purpleCOLOR}
                left={
                  <TextInput.Icon
                    icon="account"
                    color="rgba(255,255,255,0.7)"
                  />
                }
              />
            </View>

            {loading ? (
              <ActivityIndicator
                size="large"
                color={Constants.purpleCOLOR}
                style={styles.loader}
              />
            ) : (
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                labelStyle={styles.buttonText}
                contentStyle={styles.buttonContent}
              >
                Create Account
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 1,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Constants.purpleCOLOR,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Constants.purpleCOLOR,
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Constants.purpleCOLOR,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Constants.backgroundCOLOR,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarLabel: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  formSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 32,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  loader: {
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 16,
    shadowColor: Constants.purpleCOLOR,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
