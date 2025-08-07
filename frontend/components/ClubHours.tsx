// ClubHours.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  isClubOpenDynamic,
  getTimeUntilOpen,
} from "@/app/utils/supabaseService"; // Adjust the import path as needed
import { RegularOpeningHours } from "@/app/utils/types"; // Adjust the import path as needed

interface ClubHoursProps {
  hours: RegularOpeningHours;
}

const ClubHours: React.FC<ClubHoursProps> = ({ hours }) => {
  const isOpen = isClubOpenDynamic(hours);
  const timeUntilOpen = getTimeUntilOpen(hours);

  let statusText = "Closed Today";
  let statusStyle = styles.closedStatus;

  if (isOpen) {
    statusText = "Open Now";
    statusStyle = styles.openStatus;
  } else if (timeUntilOpen) {
    statusText = timeUntilOpen.formatted;
    statusStyle = styles.openingSoonStatus;
  }

  return (
    <View style={styles.container}>
      <Text style={statusStyle}>{statusText}</Text>
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
    color: "#00C851", // Green if open
  },
  closedStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF0000", // Red if closed
  },
  openingSoonStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFA500", // Orange for opening soon
  },
});

export default ClubHours;
