import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { storage, supabase } from "../utils/supabaseService";
import * as ImagePicker from "expo-image-picker";
import { useSession } from "@/components/SessionContext";
import { useNavigation } from "@react-navigation/native";
import { supabaseAuth } from "../utils/supabaseAuth";
import { decode } from "base64-arraybuffer";
import {
  backgroundCOLOR,
  whiteCOLOR,
  purpleCOLOR,
  greyCOLOR,
} from "@/constants/Constants";
import BackButton from "@/components/BackButton";
import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

export default function ProfileSettings() {
  const session = useSession();
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [imagePickerPermission, setImagePickerPermission] = useState(false);

  useEffect(() => {
    async function requestPermissions() {
      await Camera.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    requestPermissions();
  }, []);

  // Fetch profile info when screen mounts
  useEffect(() => {
    if (session) {
      getProfile();
    }
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, first_name, last_name, avatar_url`)
        .eq("id", session.user.id)
        .single();
      if (error && status !== 406) throw error;
      if (data) {
        setUsername(data.username);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Profile Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

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
      const fileName = `${session!.user.id}_${timestamp}.${ext}`;
      const filePath = `avatars/${fileName}`;

      // Upload using ArrayBuffer
      const { error: uploadError } = await storage.upload(filePath, buffer, {
        upsert: true,
        contentType: `image/${ext}`,
        metadata: { user_id: session!.user.id },
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
  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session.user.id,
        username: username,
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };
      const { data, error } = await supabase
        .from("profiles")
        .upsert(updates)
        .select();
      if (error) throw error;
      Alert.alert("Success", "Profile updated successfully.");
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Update Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <BackButton color={whiteCOLOR} />
        <Text variant="headlineMedium" style={styles.header}>
          Edit Profile
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <TouchableOpacity
            onPress={pickAndUploadImage}
            style={styles.avatarContainer}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.avatarInitial}>
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editOverlay}>
              <Text style={styles.editText}>Edit</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor={whiteCOLOR + "60"}
              placeholder="Enter your username"
              mode="outlined"
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor={purpleCOLOR}
              textColor={whiteCOLOR}
              left={<TextInput.Icon icon="account" color={whiteCOLOR + "80"} />}
            />
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              placeholderTextColor={whiteCOLOR + "60"}
              placeholder="Enter your first name"
              mode="outlined"
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor={purpleCOLOR}
              textColor={whiteCOLOR}
              left={
                <TextInput.Icon
                  icon="account-details"
                  color={whiteCOLOR + "80"}
                />
              }
            />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              placeholderTextColor={whiteCOLOR + "60"}
              placeholder="Enter your last name"
              mode="outlined"
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor={purpleCOLOR}
              textColor={whiteCOLOR}
              left={
                <TextInput.Icon
                  icon="account-details"
                  color={whiteCOLOR + "80"}
                />
              }
            />

            <Button
              mode="contained"
              onPress={updateProfile}
              disabled={loading}
              style={styles.button}
              labelStyle={styles.buttonText}
            >
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundCOLOR,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    flex: 1,
    textAlign: "center",
    color: whiteCOLOR,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 24, // Same width as the back button for balance
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 24,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: purpleCOLOR,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: purpleCOLOR,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitial: {
    fontSize: 48,
    color: whiteCOLOR,
    fontWeight: "600",
  },
  editOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: purpleCOLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: whiteCOLOR,
  },
  editText: {
    color: whiteCOLOR,
    fontSize: 12,
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: greyCOLOR,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainer: {
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: whiteCOLOR,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 16,
  },
  label: {
    color: whiteCOLOR,
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  button: {
    backgroundColor: purpleCOLOR,
    borderRadius: 12,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: whiteCOLOR,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
