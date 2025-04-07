import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Image, TouchableOpacity } from "react-native";
import { Button, Input, Text } from "@rneui/themed";
import { storage, supabase } from "../utils/supabaseService";
import * as ImagePicker from "expo-image-picker";
import { useSession } from "@/components/SessionContext";
import { useNavigation } from "@react-navigation/native";
import { supabaseAuth } from "../utils/supabaseAuth";
import { decode } from "base64-arraybuffer";
export default function ProfileSettings() {
  const session = useSession();
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    console.log("Picking image...");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"], // updated line
      allowsEditing: true,
      quality: 0.8,
      base64: true, //Add this line
    });
    if (result.canceled) return;
    setUploading(true);
    const asset = result.assets[0];
    if (!asset.base64) {
      return Alert.alert("Error", "Failed to get image data.");
    }

    setUploading(true);
    try {
      // 3. Decode Base64 to ArrayBuffer
      const buffer = decode(asset.base64);

      // 4. Generate filename & path
      const ext = asset.uri.split(".").pop()!;
      const timestamp = Date.now();
      const fileName = `${session!.user.id}_${timestamp}.${ext}`;
      const filePath = `avatars/${fileName}`;

      // 5. Upload using ArrayBuffer
      const { error: uploadError } = await storage.upload(filePath, buffer, {
        upsert: true,
        contentType: `image/${ext}`,
        metadata: { user_id: session!.user.id },
      });

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
    console.log("Updating profile...");
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
      <Text h3 style={styles.header}>
        Edit Profile
      </Text>

      <TouchableOpacity onPress={pickAndUploadImage}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Text style={styles.avatarInitial}>
              {session?.user?.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Input
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <Input label="First Name" value={firstName} onChangeText={setFirstName} />
      <Input label="Last Name" value={lastName} onChangeText={setLastName} />

      <Button
        title={loading ? "Updating..." : "Update Profile"}
        onPress={updateProfile}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
  },
  placeholderAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  avatarInitial: {
    fontSize: 40,
    color: "#fff",
  },
});
