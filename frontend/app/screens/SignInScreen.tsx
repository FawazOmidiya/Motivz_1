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
import { supabaseAuth } from "../utils/supabaseAuth";
import { Button, Input, Text } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Constants from "@/constants/Constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation";

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
      const { error } = await supabaseAuth.auth.signInWithPassword({
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={styles.headerGradient}
      />
      <View style={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text h2 style={styles.title}>
            Motivz
          </Text>
          <Text style={styles.subtitle}>Your Nightlife Companion</Text>
        </View>

        <View style={styles.formContainer}>
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

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
          ) : (
            <>
              <Button
                title="Sign In"
                onPress={signInWithEmail}
                buttonStyle={styles.signInButton}
                titleStyle={styles.buttonText}
              />

              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Constants.purpleCOLOR,
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signUpText: {
    color: "rgba(255,255,255,0.7)",
  },
  signUpLink: {
    color: Constants.purpleCOLOR,
    fontWeight: "bold",
  },
});
