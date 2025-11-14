// Root index route - minimal redirect, _layout.tsx handles all routing logic
import { Redirect } from "expo-router";
import { View, StyleSheet } from "react-native";
import * as Constants from "@/constants/Constants";

export default function Index() {
  // Simply redirect to sign-in - _layout.tsx will handle showing the correct stack
  // based on session and profile completion status
  // Return a minimal view to avoid blank screen
  return (
    <View style={styles.container}>
      <Redirect href="/auth/sign-in" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
});
