// Web-specific stub for MapScreen
// react-native-maps doesn't work on web, so we provide a placeholder
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Constants from "@/constants/Constants";

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map view is not available on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Constants.backgroundCOLOR,
  },
  text: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
  },
});
