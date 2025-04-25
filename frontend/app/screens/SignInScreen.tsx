import React, { useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { supabaseAuth } from "../utils/supabaseAuth";
import { Button, Input, Text } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabaseAuth.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) Alert.alert("Sign In Failed", error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text h3 style={styles.title}>
        Motivz
      </Text>

      <Input
        label="Email"
        leftIcon={{ type: "font-awesome", name: "envelope" }}
        onChangeText={setEmail}
        value={email}
        placeholder="email@address.com"
        autoCapitalize="none"
      />

      <Input
        label="Password"
        leftIcon={{ type: "font-awesome", name: "lock" }}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        placeholder="Password"
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Button title="Sign In" onPress={signInWithEmail} />
          <Button
            title="Create an account here!"
            type="clear"
            onPress={() => navigation.navigate("SignUp")}
          />
        </>
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
