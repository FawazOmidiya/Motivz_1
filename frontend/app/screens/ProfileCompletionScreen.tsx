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
} from "react-native";
import { Button, Input, Text } from "@rneui/themed";
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
      // Decode Base64 to ArrayBuffer
      const buffer = decode(asset.base64);

      // Generate filename & path
      const ext = asset.uri.split(".").pop()!;
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={styles.headerGradient}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text h2 style={styles.title}>
            Complete Your Profile
          </Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>

        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickAndUploadImage}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <Input
            placeholder="First Name"
            leftIcon={<Ionicons name="person-outline" size={20} color="#fff" />}
            onChangeText={setFirstName}
            value={firstName}
            inputStyle={styles.input}
            placeholderTextColor="rgba(255,255,255,0.5)"
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder="Last Name"
            leftIcon={<Ionicons name="person-outline" size={20} color="#fff" />}
            onChangeText={setLastName}
            value={lastName}
            inputStyle={styles.input}
            placeholderTextColor="rgba(255,255,255,0.5)"
            containerStyle={styles.inputContainer}
          />

          {loading || uploading ? (
            <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
          ) : (
            <Button
              title="Create Account"
              onPress={handleSubmit}
              buttonStyle={styles.submitButton}
              titleStyle={styles.buttonText}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    height: 200,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 30,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Constants.purpleCOLOR,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    paddingHorizontal: 0,
    width: "100%",
  },
  submitButton: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 20,
    width: "100%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
