import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";

export default function BackButton({ size = 24, color = "black" }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[styles.backButton]}
      onPress={() => navigation.goBack()}
    >
      <Icon name="arrow-left" type="font-awesome" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {},
});
