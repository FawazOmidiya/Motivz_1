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
import { storeToken } from "../utils/tokens"; // Utility to store tokens securely

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
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
      Alert.alert("Success", "You are now logged in!");
      navigation.replace("Home");
    } catch (error: any) {
      console.error("Sign-In Error:", error);
      Alert.alert("Error", error.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

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
        <Button title="Sign In" onPress={handleSignIn} />
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
