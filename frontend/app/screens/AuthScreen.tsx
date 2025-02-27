import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import auth0 from "../utils/auth";
import { storeToken } from "../utils/tokens";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RootTabParamList } from "../_layout"; // Import your navigation type

type AuthScreenNavigationProp = BottomTabNavigationProp<
  RootTabParamList,
  "Home"
>;

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<AuthScreenNavigationProp>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await auth0.auth.passwordRealm({
        username: email,
        password,
        realm: "Username-Password-Authentication",
      });

      await storeToken(response.accessToken);
      Alert.alert("Success", "Logged in successfully!");
      navigation.navigate("Home");
    } catch (error: any) {
      console.error("Login Error:", error);
      Alert.alert("Error", error.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await auth0.auth.createUser({
        email,
        password,
        connection: "Username-Password-Authentication",
      });

      Alert.alert("Success", "Account created! Please log in.");
    } catch (error: any) {
      console.error("Sign-Up Error:", error);
      Alert.alert("Error", error.message || "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth0 Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <>
          <Button title="Login" onPress={handleLogin} />
          <Button title="Sign Up" onPress={handleSignUp} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: { borderBottomWidth: 1, marginBottom: 10, padding: 8 },
});
