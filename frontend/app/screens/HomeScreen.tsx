import {
  View,
  Text,
  FlatList,
  Button,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect } from "react";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation"; // Import the types
import { fetchClubs } from "../utils/supabaseService";
type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type Club = {
  club_id: number;
  Name: string;
  latitude: number;
  longitude: number;
  Rating: number;
  Image: string;
  Tags: string[]; // Example: ["Live Music", "Cocktails", "Dance"]
};

export default function HomeScreen() {
  const [clubs, setClubs] = useState<Club[]>([]); // ✅ Store clubs from Supabase
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClubs = async () => {
      const clubData = await fetchClubs();
      setClubs(clubData);
      setLoading(false);
    };
    loadClubs();
  }, []);
  const navigation = useNavigation(); // ✅ Use correct navigation type

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Nearby Clubs</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <FlatList
            data={clubs}
            keyExtractor={(item) => item.club_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ClubDetail", { club: item })
                }
              >
                <View style={styles.clubCard}>
                  <Image
                    source={{ uri: item.Image }}
                    style={styles.clubImage}
                  />
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubName}>{item.Name}</Text>
                    <Text style={styles.clubDetails}>
                      ⭐ {item.Rating} | {item.Tags?.join(", ")}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: StatusBar.currentHeight || 0,
  },
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  clubCard: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 10,
  },
  clubImage: { width: 60, height: 60, borderRadius: 10, marginRight: 10 },
  clubInfo: { justifyContent: "center" },
  clubName: { fontSize: 18, fontWeight: "bold" },
  clubDetails: { fontSize: 14, color: "gray" },
});
