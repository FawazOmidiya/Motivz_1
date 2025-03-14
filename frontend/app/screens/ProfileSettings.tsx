import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Image, TouchableOpacity } from "react-native";
import { Button, Input, Text } from "@rneui/themed";
import { supabaseAuth } from "../utils/supabaseAuth";
import * as ImagePicker from "expo-image-picker";
import { useSession } from "@/components/SessionContext";
import { useNavigation } from "@react-navigation/native";

export default function ProfileSettings() {
  const session = useSession();
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);

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

      const { data, error, status } = await supabaseAuth
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

  async function pickImage() {
    // Request permission to access the media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Permission to access media library is required!"
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.cancelled) {
      // For a real app, upload the image to Supabase Storage and retrieve the public URL.
      // Here we assume the returned URI can serve as the avatar URL.
      setAvatarUrl(result.uri);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session.user.id,
        username,
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabaseAuth.from("profiles").upsert(updates);
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

      <TouchableOpacity onPress={pickImage}>
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
