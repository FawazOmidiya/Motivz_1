import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { storeToken } from "../utils/auth";
import { useNavigation } from "@react-navigation/native";
import { StackNavigation } from "../navigation/types"; // ✅ Import typed navigation

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigation>(); // ✅ Use correct navigation type

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = "http://192.168.2.90:8000"; // ✅ Replace with your local IP

      const response = await axios.post(
        "http://127.0.0.1:8000/auth_app/login/",
        {
          email,
          password,
        }
      );

      const { access_token, user } = response.data;
      await storeToken(access_token); // ✅ Store JWT token securely

      Alert.alert("Success", `Welcome, ${user.email}!`);
      navigation.navigate("Main"); // ✅ TypeScript will now recognize "Main"
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Invalid credentials or server issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Login
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
