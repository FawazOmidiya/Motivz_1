import React, { useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { supabaseAuth } from "../utils/supabaseAuth";
import { Button, Input, Text } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";
import BackButton from "@/components/BackButton";
import { supabase } from "../utils/supabaseService";

export default function SignUpScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  async function checkUsernameExists(username: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();
    return data !== null;
  }

  async function signUpWithEmail() {
    setLoading(true);
    if (!username || !email || !password) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      setLoading(false);
      return;
    }

    const usernameTaken = await checkUsernameExists(username);
    if (usernameTaken) {
      Alert.alert("Username Taken", "Please choose another username.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseAuth.auth.signUp({ email, password });
    if (error) {
      Alert.alert("Sign Up Failed", error.message);
    }
    console.log("HERES THE NEW USER: " + data);
    if (data?.user) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: username,
        })
        .eq("id", data.user.id);
      if (profileError) {
        Alert.alert(
          "Profile Error",
          "Account created, but profile update failed."
        );
        console.log(profileError);
      } else {
        Alert.alert("Success! Account created successfully.");
      }
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text h3 style={styles.title}>
        Create an Account
      </Text>
      <Input
        label="Username"
        onChangeText={setUsername}
        value={username}
        placeholder="johndoe"
        autoCapitalize="none"
      />
      <Input
        label="Email"
        onChangeText={setEmail}
        value={email}
        placeholder="email@address.com"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        placeholder="Password"
        autoCapitalize="none"
      />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Sign Up" onPress={signUpWithEmail} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
});
