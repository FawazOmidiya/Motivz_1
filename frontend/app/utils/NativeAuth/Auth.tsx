import { StyleSheet, View, Text } from "react-native";

export function Auth() {
  return (
    <View style={styles.container}>
      <Text>Apple Auth</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
