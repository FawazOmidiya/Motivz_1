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
import GoogleSignInButton from "../components/GoogleSignInButton";

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
        Alert.alert("Error", error.message);
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
            <Text variant="displayLarge" style={styles.title}>
              Join Motivz
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Create your account
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text variant="headlineSmall" style={styles.formTitle}>
              Get Started
            </Text>

            <View style={styles.inputGroup}>
              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                placeholderTextColor="rgba(255,255,255,0.5)"
                textColor="#fff"
                mode="outlined"
                outlineColor="rgba(255,255,255,0.2)"
                activeOutlineColor={Constants.purpleCOLOR}
                left={
                  <TextInput.Icon icon="email" color="rgba(255,255,255,0.7)" />
                }
              />

              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor="rgba(255,255,255,0.5)"
                textColor="#fff"
                mode="outlined"
                outlineColor="rgba(255,255,255,0.2)"
                activeOutlineColor={Constants.purpleCOLOR}
                left={
                  <TextInput.Icon icon="lock" color="rgba(255,255,255,0.7)" />
                }
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    color="rgba(255,255,255,0.7)"
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              <TextInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                placeholderTextColor="rgba(255,255,255,0.5)"
                textColor="#fff"
                mode="outlined"
                outlineColor="rgba(255,255,255,0.2)"
                activeOutlineColor={Constants.purpleCOLOR}
                left={
                  <TextInput.Icon icon="lock" color="rgba(255,255,255,0.7)" />
                }
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    color="rgba(255,255,255,0.7)"
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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
              <>
                <Button
                  mode="contained"
                  onPress={handleContinue}
                  style={styles.signUpButton}
                  labelStyle={styles.buttonText}
                  contentStyle={styles.buttonContent}
                >
                  Continue
                </Button>

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

                <View style={styles.signInContainer}>
                  <Text variant="bodyMedium" style={styles.signInText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SignIn")}
                  >
                    <Text variant="bodyMedium" style={styles.signInLink}>
                      Sign In
                    </Text>
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
    marginBottom: 60,
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
  signUpButton: {
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
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.7)",
    marginHorizontal: 16,
  },
});
