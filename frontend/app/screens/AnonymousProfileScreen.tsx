import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Constants from "@/constants/Constants";

export default function AnonymousProfileScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personalize Your Motivz!</Text>
      <Text style={styles.subtitle}>
        Make an account to unlock profile features, track your reviews, and
        connect with friends.
      </Text>
      <TouchableOpacity
        style={styles.signUpButton}
        onPress={() => router.push("/auth/sign-up")}
      >
        <Text style={styles.signUpText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Constants.backgroundCOLOR,
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 32,
    textAlign: "center",
  },
  signUpButton: {
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
  },
  signUpText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
});
