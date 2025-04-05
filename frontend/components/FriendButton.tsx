import React, { useState, useEffect } from "react";
import { View, Button, Alert, ActivityIndicator } from "react-native";
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  unfriend,
  fetchUserProfile,
  fetchFriendshipStatus, // Import the helper function we just built
} from "@/app/utils/supabaseService";
import { useSession } from "@/components/SessionContext";
import * as types from "@/app/utils/types";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

const FriendButton: React.FC<{ targetUserId: string }> = ({ targetUserId }) => {
  const session = useSession();
  const [profile, setProfile] = useState<types.UserProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
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
      console.log("Friendship status:", status);
      setFriendStatus(status);
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
      Alert.alert("Error", error.message);
    } else {
      setFriendStatus("friends");
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
    }
  };

  const renderButton = () => {
    if (loading) return <ActivityIndicator size="small" />;
    switch (friendStatus) {
      case "none":
        return <Button title="Send Friend Request" onPress={handleSend} />;
      case "pending_sent":
        return <Button title="Cancel Request" onPress={handleCancel} />;
      case "pending_received":
        return (
          <>
            <Button title="Accept Request" onPress={handleAccept} />
            <Button title="Decline Request" onPress={handleCancel} />
          </>
        );
      case "friends":
        return <Button title="Unfriend" onPress={handleUnfriend} />;
      default:
        return null;
    }
  };

  return <View>{renderButton()}</View>;
};

export default FriendButton;
