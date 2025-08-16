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
import GoogleSignInButton from "../utils/googleAuth/GoogleSignInButton";
import { Auth } from "../utils/NativeAuth/Auth";
import { Auth as NativeAuth } from "../utils/NativeAuth/Auth.native";
import { LinearGradient } from "expo-linear-gradient";
import * as Constants from "@/constants/Constants";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation";
import { supabase } from "../utils/supabaseService";

type SignInScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SignIn"
>;

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation<SignInScreenNavigationProp>();

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Sign In Failed", error.message);
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
              Motivz
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Your Nightlife Companion
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text variant="headlineSmall" style={styles.formTitle}>
              Welcome Back
            </Text>

            <View style={styles.inputGroup}>
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
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text variant="bodyMedium" style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

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
                  onPress={signInWithEmail}
                  style={styles.signInButton}
                  labelStyle={styles.buttonText}
                  contentStyle={styles.buttonContent}
                >
                  Sign In
                </Button>

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
                    // console.log("Google sign-in successful:", data);
                    // Handle successful sign-in - navigate to main app
                  }}
                  onError={(error) => {
                    // console.error("Google sign-in error:", error);
                    // Handle error if needed
                  }}
                />

                {/* Apple Sign In Button */}
                <View style={styles.nativeAuthContainer}>
                  <NativeAuth />
                </View>

                <View style={styles.signUpContainer}>
                  <Text variant="bodyMedium" style={styles.signUpText}>
                    Don't have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SignUp")}
                  >
                    <Text variant="bodyMedium" style={styles.signUpLink}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate("AnonymousHome")}
                  style={styles.anonymousLinkContainer}
                >
                  <Text variant="bodyMedium" style={styles.anonymousLink}>
                    Continue Without Account
                  </Text>
                </TouchableOpacity>
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
    marginBottom: 30,
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
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: Constants.purpleCOLOR,
    fontWeight: "500",
  },
  loader: {
    marginVertical: 20,
  },
  signInButton: {
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
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signUpText: {
    color: "rgba(255,255,255,0.7)",
  },
  signUpLink: {
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
    color: "rgba(255,255,255,0.6)",
    marginHorizontal: 16,
  },
  anonymousLinkContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  anonymousLink: {
    color: Constants.purpleCOLOR,
    fontWeight: "600",
  },
  nativeAuthContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
});
