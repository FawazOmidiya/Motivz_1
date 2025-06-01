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
} from "react-native";
import { Button, Input, Text } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Constants from "@/constants/Constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../utils/supabaseService";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation";

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
            Join Motivz
          </Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            placeholder="Username"
            leftIcon={<Ionicons name="person-outline" size={20} color="#fff" />}
            onChangeText={setUsername}
            value={username}
            autoCapitalize="none"
            inputStyle={styles.input}
            placeholderTextColor="rgba(255,255,255,0.5)"
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder="Email"
            leftIcon={<Ionicons name="mail-outline" size={20} color="#fff" />}
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            inputStyle={styles.input}
            placeholderTextColor="rgba(255,255,255,0.5)"
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder="Password"
            leftIcon={
              <Ionicons name="lock-closed-outline" size={20} color="#fff" />
            }
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            }
            onChangeText={setPassword}
            value={password}
            secureTextEntry={!showPassword}
            inputStyle={styles.input}
            placeholderTextColor="rgba(255,255,255,0.5)"
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder="Confirm Password"
            leftIcon={
              <Ionicons name="lock-closed-outline" size={20} color="#fff" />
            }
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            }
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            secureTextEntry={!showConfirmPassword}
            inputStyle={styles.input}
            placeholderTextColor="rgba(255,255,255,0.5)"
            containerStyle={styles.inputContainer}
          />

          {loading ? (
            <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
          ) : (
            <>
              <Button
                title="Continue"
                onPress={handleContinue}
                buttonStyle={styles.signUpButton}
                titleStyle={styles.buttonText}
              />

              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
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
  },
  input: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  signUpButton: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signInText: {
    color: "rgba(255,255,255,0.7)",
  },
  signInLink: {
    color: Constants.purpleCOLOR,
    fontWeight: "bold",
  },
});
