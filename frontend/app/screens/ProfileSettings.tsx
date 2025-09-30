import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { storage, supabase, deleteUserAccount } from "../utils/supabaseService";
import * as ImagePicker from "expo-image-picker";
import { useSession } from "@/components/SessionContext";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "../utils/supabaseService";
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
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";

export default function ProfileSettings() {
  const session = useSession();
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [imagePickerPermission, setImagePickerPermission] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  useEffect(() => {
    async function requestPermissions() {
      await Camera.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    requestPermissions();
  }, []);

  // Check notification permissions
  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === "granted");
    } catch (error) {
      console.error("Error checking notification permissions:", error);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      // User wants to disable notifications
      setNotificationsEnabled(false);
      Alert.alert(
        "Notifications Disabled",
        "You can re-enable notifications in your device settings.",
        [{ text: "OK" }]
      );
    } else {
      // User wants to enable notifications
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === "granted") {
          setNotificationsEnabled(true);
          Alert.alert(
            "Notifications Enabled",
            "You'll now receive notifications for friend requests and events.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive updates.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: openDeviceSettings },
            ]
          );
        }
      } catch (error) {
        console.error("Error requesting notification permissions:", error);
        Alert.alert("Error", "Failed to update notification settings.");
      }
    }
  };

  const openDeviceSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Error opening device settings:", error);
      Alert.alert("Error", "Could not open device settings.");
    }
  };

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

  async function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              "Final Confirmation",
              "This is your final warning. Your account and all associated data will be permanently deleted. Are you absolutely sure?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Yes, Delete My Account",
                  style: "destructive",
                  onPress: deleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  }

  async function deleteAccount() {
    if (!session?.user) {
      Alert.alert("Error", "No user session found.");
      return;
    }

    try {
      setDeleting(true);
      await deleteUserAccount(session.user.id);

      // Sign out the user after successful deletion
      await signOut();

      Alert.alert(
        "Account Deleted",
        "Your account has been successfully deleted. You will be signed out.",
        [
          {
            text: "OK",
            onPress: () => {
              // The sign out will automatically redirect to auth screen
              // No need for manual navigation
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert(
        "Error",
        "Failed to delete account. Please try again or contact support."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <BackButton color={whiteCOLOR} />
        <Text variant="headlineMedium" style={styles.header}>
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <TouchableOpacity
            onPress={pickAndUploadImage}
            style={styles.profileRow}
          >
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.placeholderAvatar}>
                    <Text style={styles.avatarInitial}>
                      {session?.user?.email?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileTitle}>Profile Picture</Text>
                <Text style={styles.profileSubtitle}>Tap to change</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={greyCOLOR} />
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={styles.instagramInput}
              placeholderTextColor={greyCOLOR}
              placeholder="Enter username"
              mode="flat"
              textColor={whiteCOLOR}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              style={styles.instagramInput}
              placeholderTextColor={greyCOLOR}
              placeholder="Enter first name"
              mode="flat"
              textColor={whiteCOLOR}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              style={styles.instagramInput}
              placeholderTextColor={greyCOLOR}
              placeholder="Enter last name"
              mode="flat"
              textColor={whiteCOLOR}
            />
          </View>

          <TouchableOpacity
            onPress={updateProfile}
            disabled={loading}
            style={[
              styles.updateButton,
              loading && styles.updateButtonDisabled,
            ]}
          >
            <Text style={styles.updateButtonText}>
              {loading ? "Updating..." : "Update Profile"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <TouchableOpacity
            onPress={openDeviceSettings}
            style={styles.settingRow}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="settings" size={24} color={whiteCOLOR} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Device Settings</Text>
                <Text style={styles.settingSubtitle}>
                  Open notification settings
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={greyCOLOR} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity onPress={() => signOut()} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="log-out" size={24} color="#FF6B6B" />
              <Text style={[styles.settingTitle, { color: "#FF6B6B" }]}>
                Sign Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={greyCOLOR} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={styles.settingRow}
            disabled={deleting}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="trash" size={24} color="#FF4444" />
              <Text style={[styles.settingTitle, { color: "#FF4444" }]}>
                {deleting ? "Deleting..." : "Delete Account"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={greyCOLOR} />
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: greyCOLOR + "20",
  },
  header: {
    flex: 1,
    textAlign: "center",
    color: whiteCOLOR,
    fontWeight: "600",
    fontSize: 18,
  },
  headerSpacer: {
    width: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: whiteCOLOR,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: greyCOLOR + "20",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: purpleCOLOR,
  },
  placeholderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: purpleCOLOR,
  },
  avatarInitial: {
    fontSize: 24,
    color: whiteCOLOR,
    fontWeight: "600",
  },
  profileText: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: whiteCOLOR,
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 14,
    color: greyCOLOR,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: whiteCOLOR,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  instagramInput: {
    fontSize: 16,
    color: whiteCOLOR,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: greyCOLOR + "40",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  updateButton: {
    backgroundColor: purpleCOLOR,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  updateButtonDisabled: {
    backgroundColor: greyCOLOR + "40",
  },
  updateButtonText: {
    color: whiteCOLOR,
    fontSize: 16,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: greyCOLOR + "20",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: whiteCOLOR,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: greyCOLOR,
  },
});
