import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  unfriend,
  fetchUserProfile,
  fetchFriendshipStatus,
  supabase,
} from "@/app/utils/supabaseService";
import { useSession } from "@/components/SessionContext";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";

type FriendStatus = "none" | "pending" | "friends";

export default function FriendButton({
  targetUserId,
}: {
  targetUserId: string;
}) {
  const session = useSession();
  const [profile, setProfile] = useState<types.UserProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [isRequester, setIsRequester] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch the current user's profile on mount or when session changes.
  useEffect(() => {
    if (session) {
      getProfile();
      checkFriendshipStatus(session.user.id, targetUserId);
    }
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");
      const data = await fetchUserProfile(session.user.id);
      if (data) {
        setProfile(data);
        // After fetching the profile, check friendship status with targetUserId.
        checkFriendshipStatus(data.id, targetUserId);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Profile Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function checkFriendshipStatus(
    currentUserId: string,
    targetUserId: string
  ) {
    try {
      const status: FriendStatus = await fetchFriendshipStatus(
        currentUserId,
        targetUserId
      );
      setFriendStatus(status);

      // If status is pending, check who is the requester
      if (status === "pending") {
        const { data } = await supabase
          .from("friendships")
          .select("requester_id")
          .or(
            `requester_id.eq.${currentUserId},requester_id.eq.${targetUserId}`
          )
          .or(`receiver_id.eq.${currentUserId},receiver_id.eq.${targetUserId}`)
          .eq("status", "pending")
          .single();

        setIsRequester(data?.requester_id === currentUserId);
      }
    } catch (error) {
      console.error("Error checking friendship status:", error);
    }
  }

  const handleSend = async () => {
    if (!profile) return;
    setLoading(true);
    const { error } = await sendFriendRequest(profile.id, targetUserId);
    setLoading(false);
    if (error) {
    } else {
      setFriendStatus("pending");
      setIsRequester(true);
    }
  };

  const handleCancel = async () => {
    if (!profile) return;
    setLoading(true);
    const { error } = await cancelFriendRequest(profile.id, targetUserId);
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setFriendStatus("none");
      setIsRequester(false);
    }
  };

  const handleAccept = async () => {
    if (!profile) return;
    setLoading(true);
    const { error } = await acceptFriendRequest(profile.id, targetUserId);
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setFriendStatus("friends");
      setIsRequester(false);
    }
  };

  const handleUnfriend = async () => {
    if (!profile) return;
    setLoading(true);
    const { error } = await unfriend(profile.id, targetUserId);
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setFriendStatus("none");
      setIsRequester(false);
    }
  };

  const renderButton = () => {
    if (loading) {
      return (
        <View style={styles.buttonContainer}>
          <ActivityIndicator size="small" color={Constants.whiteCOLOR} />
        </View>
      );
    }

    switch (friendStatus) {
      case "none":
        return (
          <TouchableOpacity style={styles.primaryButton} onPress={handleSend}>
            <Text style={styles.primaryButtonText}>Send Friend Request</Text>
          </TouchableOpacity>
        );
      case "pending":
        if (isRequester) {
          // Current user sent the request
          return (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCancel}
            >
              <Text style={styles.secondaryButtonText}>Request Sent</Text>
            </TouchableOpacity>
          );
        } else {
          // Current user received the request
          return (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleAccept}
              >
                <Text style={styles.primaryButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleCancel}
              >
                <Text style={styles.dangerButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          );
        }
      case "friends":
        return (
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleUnfriend}
          >
            <Text style={styles.dangerButtonText}>Unfriend</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderButton()}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  buttonContainer: {
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  secondaryButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "500",
  },
  dangerButton: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  dangerButtonText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "600",
  },
});
