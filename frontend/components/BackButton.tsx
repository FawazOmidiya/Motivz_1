import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

export default function BackButton({ size = 24, color = "black" }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[styles.backButton]}
      onPress={() => navigation.goBack()}
    >
      <IconButton
        icon="arrow-left"
        size={size}
        iconColor={color}
        onPress={() => navigation.goBack()}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {},
});
