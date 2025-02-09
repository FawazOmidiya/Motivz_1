import { View, Text } from "react-native";

export default function ExploreScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>Explore Clubs</Text>
      <Text style={{ fontSize: 16, color: "#666", marginTop: 10 }}>
        This is where club listings will go.
      </Text>
    </View>
  );
}
