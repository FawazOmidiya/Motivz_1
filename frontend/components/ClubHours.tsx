// ClubHours.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { isClubOpenDynamic } from "@/app/utils/supabaseService"; // Adjust the import path as needed
import { RegularOpeningHours } from "@/app/utils/types"; // Adjust the import path as needed

interface ClubHoursProps {
  hours: RegularOpeningHours;
}

const ClubHours: React.FC<ClubHoursProps> = ({ hours }) => {
  const openStatus = isClubOpenDynamic(hours) ? "Open Now" : "Closed";

  return (
    <View style={styles.container}>
      {openStatus === "Open Now" ? (
        <Text style={styles.openStatus}>{openStatus}</Text>
      ) : (
        <Text style={styles.closedStatus}>{openStatus}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 5,
  },
  openStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00C851", // Green if open; adjust as needed.
  },
  closedStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF0000", // Green if open; adjust as needed.
  },
});

export default ClubHours;
