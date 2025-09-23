import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Constants from "../../constants/Constants";
import * as types from "../utils/types";
import { supabase } from "../utils/supabaseService";

type GuestlistFormNavigationProp = NativeStackNavigationProp<
  {
    EventDetail: { event: types.Event };
    GuestlistForm: { event: types.Event };
  },
  "GuestlistForm"
>;

type GuestlistFormRouteProp = {
  event: types.Event;
};

export default function GuestlistFormScreen() {
  const navigation = useNavigation<GuestlistFormNavigationProp>();
  const route = useRoute();
  const { event } = route.params as GuestlistFormRouteProp;

  const [groupName, setGroupName] = useState("");
  const [menCount, setMenCount] = useState("");
  const [womenCount, setWomenCount] = useState("");
  const [wantsTable, setWantsTable] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    if (!menCount || !womenCount) {
      Alert.alert("Error", "Please enter the number of men and women");
      return;
    }

    const men = parseInt(menCount);
    const women = parseInt(womenCount);

    if (isNaN(men) || isNaN(women) || men < 0 || women < 0) {
      Alert.alert("Error", "Please enter valid numbers for men and women");
      return;
    }

    if (men + women === 0) {
      Alert.alert("Error", "Please enter at least one person in your group");
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          "Error",
          "You must be logged in to submit a guestlist request"
        );
        return;
      }

      // Submit to database
      const { data, error } = await supabase
        .from("guestlist_requests")
        .insert({
          event_id: event.id,
          club_id: event.club_id,
          user_id: user.id,
          group_name: groupName.trim(),
          men_count: men,
          women_count: women,
          total_count: men + women,
          wants_table: wantsTable,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Error submitting guestlist request:", error);
        Alert.alert(
          "Error",
          "Failed to submit guestlist request. Please try again."
        );
        return;
      }

      Alert.alert(
        "Success!",
        `Your guestlist request for ${groupName} (${
          men + women
        } people) has been submitted. You'll receive a confirmation soon.`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting guestlist request:", error);
      Alert.alert(
        "Error",
        "Failed to submit guestlist request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const totalCount = (parseInt(menCount) || 0) + (parseInt(womenCount) || 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guestlist Request</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Event Info */}
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDate}>
          {new Date(event.start_date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Group Details</Text>

        {/* Group Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Group Name *</Text>
          <TextInput
            style={styles.textInput}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Enter your group name"
            placeholderTextColor="rgba(255,255,255,0.4)"
            maxLength={50}
          />
        </View>

        {/* People Count */}
        <View style={styles.peopleCountContainer}>
          <Text style={styles.inputLabel}>Number of People *</Text>
          <View style={styles.countRow}>
            <View style={styles.countInputContainer}>
              <Text style={styles.countLabel}>Men</Text>
              <TextInput
                style={styles.countInput}
                value={menCount}
                onChangeText={setMenCount}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.countInputContainer}>
              <Text style={styles.countLabel}>Women</Text>
              <TextInput
                style={styles.countInput}
                value={womenCount}
                onChangeText={setWomenCount}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
          {totalCount > 0 && (
            <Text style={styles.totalCount}>Total: {totalCount} people</Text>
          )}
        </View>

        {/* Table/Booth Option */}
        <View style={styles.tableContainer}>
          <TouchableOpacity
            style={styles.tableOption}
            onPress={() => setWantsTable(!wantsTable)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View
                style={[styles.checkbox, wantsTable && styles.checkboxChecked]}
              >
                {wantsTable && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <View style={styles.tableTextContainer}>
                <Text style={styles.tableTitle}>Table/Booth Request</Text>
                <Text style={styles.tableDescription}>
                  Request a table or booth for your group (additional charges
                  may apply)
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!groupName.trim() ||
              !menCount ||
              !womenCount ||
              totalCount === 0) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !groupName.trim() ||
            !menCount ||
            !womenCount ||
            totalCount === 0 ||
            loading
          }
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Submitting..." : "Submit Guestlist Request"}
          </Text>
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Your guestlist request will be reviewed and you'll receive a
          confirmation within 24 hours.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  eventInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  eventTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  eventDate: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  peopleCountContainer: {
    marginBottom: 24,
  },
  countRow: {
    flexDirection: "row",
    gap: 16,
  },
  countInputContainer: {
    flex: 1,
  },
  countLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  countInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  totalCount: {
    color: Constants.purpleCOLOR,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  tableContainer: {
    marginBottom: 32,
  },
  tableOption: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Constants.purpleCOLOR,
    borderColor: Constants.purpleCOLOR,
  },
  tableTextContainer: {
    flex: 1,
  },
  tableTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  tableDescription: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
