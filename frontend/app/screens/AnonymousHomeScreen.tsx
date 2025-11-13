import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  supabase,
  isClubOpenDynamic,
  getTimeUntilOpen,
} from "../utils/supabaseService";
import { Club } from "../utils/Club";
import * as Constants from "@/constants/Constants";

export default function AnonymousHomeScreen() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from("Clubs")
        .select("*")
        .order("Name");

      if (error) {
        console.error("Error fetching test clubs:", error);
        return;
      }

      const clubObjects = data.map((clubData: any) => new Club(clubData));
      setClubs(clubObjects);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClubs();
    setRefreshing(false);
  };

  const handleSignUp = () => {
    Alert.alert(
      "Create Account",
      "Would you like to create an account to access all features?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Up", onPress: () => router.push("/auth/sign-up") },
      ]
    );
  };

  const renderClub = ({ item }: { item: Club }) => (
    <View style={styles.clubCard}>
      <View style={styles.clubHeader}>
        <View style={styles.clubInfo}>
          <Text style={styles.clubName}>{item.name}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.clubStatus}>
        {(() => {
          const isOpen = item.hours ? isClubOpenDynamic(item.hours) : false;
          const timeUntilOpen = item.hours
            ? getTimeUntilOpen(item.hours)
            : null;

          let statusText = "Closed Today";
          let statusColor = "#F44336"; // Red for closed

          if (isOpen) {
            statusText = "Open";
            statusColor = "#4CAF50"; // Green for open
          } else if (timeUntilOpen) {
            statusText = timeUntilOpen.formatted;
            statusColor = "#FFA500"; // Orange for opening soon
          }

          return (
            <>
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={styles.statusText}>{statusText}</Text>
              {isOpen && (
                <Text style={styles.hoursText}>
                  • {item.getCurrentDayHours()}
                </Text>
              )}
            </>
          );
        })()}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}> Clubs</Text>
        <TouchableOpacity onPress={handleSignUp} style={styles.signUpButton}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clubs}
        renderItem={renderClub}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No clubs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Constants.backgroundCOLOR,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  signUpButton: {
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signUpText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    padding: 20,
  },
  clubCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  clubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  clubAddress: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFD700",
    marginLeft: 4,
  },
  clubStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  hoursText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
});
