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
  StatusBar,
} from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Constants from "@/constants/Constants";
import { supabase } from "../utils/supabaseService";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../utils/types";
import GoogleSignInButton from "../utils/googleAuth/GoogleSignInButton";
import { Auth as NativeAuth } from "../utils/NativeAuth/Auth.native";

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SignUp"
>;

export default function SignUpScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigation = useNavigation<SignUpScreenNavigationProp>();

  async function checkUsernameExists(username: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();
    return data !== null;
  }

  async function handleContinue() {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const usernameTaken = await checkUsernameExists(username);
      if (usernameTaken) {
        Alert.alert("Error", "Username is already taken");
        setLoading(false);
        return;
      }

      // Store the initial sign-up info and navigate to profile completion
      navigation.navigate("ProfileCompletion", {
        signUpInfo: {
          username,
          email,
          password,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error during sign-up:", error);
        Alert.alert(
          "Error",
          "An error occurred during sign-up. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

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
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Text style={styles.title}>Motivz</Text>
            <Text style={styles.subtitle}>Your Nightlife Companion</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  textColor="#fff"
                  mode="outlined"
                  outlineColor="rgba(255,255,255,0.15)"
                  activeOutlineColor={Constants.purpleCOLOR}
                  autoComplete="off"
                  left={
                    <TextInput.Icon
                      icon="account"
                      color="rgba(255,255,255,0.6)"
                    />
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  textColor="#fff"
                  mode="outlined"
                  outlineColor="rgba(255,255,255,0.15)"
                  activeOutlineColor={Constants.purpleCOLOR}
                  left={
                    <TextInput.Icon
                      icon="email"
                      color="rgba(255,255,255,0.6)"
                    />
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  textColor="#fff"
                  mode="outlined"
                  outlineColor="rgba(255,255,255,0.15)"
                  activeOutlineColor={Constants.purpleCOLOR}
                  left={
                    <TextInput.Icon icon="lock" color="rgba(255,255,255,0.6)" />
                  }
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      color="rgba(255,255,255,0.6)"
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  textColor="#fff"
                  mode="outlined"
                  outlineColor="rgba(255,255,255,0.15)"
                  activeOutlineColor={Constants.purpleCOLOR}
                  left={
                    <TextInput.Icon icon="lock" color="rgba(255,255,255,0.6)" />
                  }
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      color="rgba(255,255,255,0.6)"
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />
                  }
                />
              </View>
            </View>

            {loading ? (
              <ActivityIndicator
                size="large"
                color={Constants.purpleCOLOR}
                style={styles.loader}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text variant="bodyMedium" style={styles.dividerText}>
                    or
                  </Text>
                  <View style={styles.divider} />
                </View>

                {/* Google Sign In Button */}
                <GoogleSignInButton
                  onSuccess={(data) => {
                    console.log("Google sign-in successful:", data);
                    // Handle successful sign-in - navigate to main app
                  }}
                  onError={(error) => {
                    console.error("Google sign-in error:", error);
                    // Handle error if needed
                  }}
                />

                {/* Apple Sign In Button */}
                <View style={styles.nativeAuthContainer}>
                  <NativeAuth />
                </View>

                <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SignIn")}
                  >
                    <Text style={styles.signInLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </>
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
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    color: Constants.purpleCOLOR,
    fontWeight: "bold",
    fontSize: 48,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "400",
  },
  formSection: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 28,
    padding: 36,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
  },
  loader: {
    marginVertical: 20,
  },
  signUpButton: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Constants.purpleCOLOR,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signInText: {
    color: "rgba(255,255,255,0.7)",
  },
  signInLink: {
    color: Constants.purpleCOLOR,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.5)",
    marginHorizontal: 20,
    fontSize: 14,
    fontWeight: "500",
  },
  anonymousLink: {
    color: Constants.purpleCOLOR,
    fontWeight: "600",
  },
  nativeAuthContainer: {
    alignItems: "center",
    marginBottom: 28,
    width: "100%",
  },
});
