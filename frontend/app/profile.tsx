import { View, Text } from "react-native";

export default function ProfileScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>Profile</Text>
      <Text style={{ fontSize: 16, color: "#666", marginTop: 10 }}>
        User settings will go here.
      </Text>
    </View>
  );
}
