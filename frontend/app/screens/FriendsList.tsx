import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  ScrollView,
} from "react-native";
import { useSession } from "@/components/SessionContext";
import { useState, useEffect } from "react";
import {
  fetchUserFriends,
  fetchSingleClub,
  fetchPendingFriendRequests,
  acceptFriendRequest,
  cancelFriendRequest,
} from "../utils/supabaseService";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BackButton from "@/components/BackButton";
import { RootStackParamList } from "../navigation/Navigation";

type FriendsListNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FriendsList"
>;

type FriendsListRouteProp = {
  params: { userId: string };
};

export default function FriendsList() {
  const [friends, setFriends] = useState<types.UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<types.UserProfile[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<{ [key: string]: types.Club }>({});
  const session = useSession();
  const navigation = useNavigation<FriendsListNavigationProp>();
  const route = useRoute() as FriendsListRouteProp;
  const userId = route.params?.userId || session?.user?.id;

  useEffect(() => {
    if (userId) {
      getFriends(userId);
      getPendingRequests(userId);
    }
  }, [userId]);

  async function getFriends(uid: string) {
    try {
      const data = await fetchUserFriends(uid);
      if (data) {
        setFriends(data);
        // Fetch club data for friends with active clubs
        const clubPromises = data
          .filter((friend) => friend.active_club_id)
          .map(async (friend) => {
            const club = await fetchSingleClub(friend.active_club_id!);
            return { [friend.active_club_id!]: club };
          });
        const clubResults = await Promise.all(clubPromises);
        const clubsMap = Object.assign({}, ...clubResults);
        setClubs(clubsMap);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  }

  async function getPendingRequests(uid: string) {
    try {
      const data = await fetchPendingFriendRequests(uid);
      if (data) {
        setPendingRequests(data);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAcceptRequest = async (requesterId: string) => {
    if (!session?.user?.id) return;
    try {
      const { error } = await acceptFriendRequest(session.user.id, requesterId);
      if (error) {
        console.error("Error accepting friend request:", error);
      } else {
        setPendingRequests((prev) => {
          return prev.filter((req) => req.id !== requesterId);
        });
        await getFriends(userId!);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    if (!session?.user?.id) return;
    try {
      const { error } = await cancelFriendRequest(requesterId, session.user.id);
      if (error) {
        console.error("Error declining friend request:", error);
      } else {
        // Remove from pending requests
        setPendingRequests((prev) =>
          prev.filter((req) => req.id !== requesterId)
        );
      }
    } catch (error) {
      console.error("Error declining friend request:", error);
    }
  };

  const renderFriendRequest = ({ item }: { item: types.UserProfile }) => (
    <View style={styles.friendRequestItem}>
      <TouchableOpacity
        style={styles.friendRequestInfo}
        onPress={() => navigation.navigate("UserProfile", { user: item })}
      >
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <Image
              source={require("@/assets/images/default-avatar.png")}
              style={styles.avatar}
            />
          )}
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.name}>
            {item.first_name} {item.last_name}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(item.id)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = ({ item }: { item: types.UserProfile }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => navigation.navigate("UserProfile", { user: item })}
    >
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <Image
            source={require("@/assets/images/default-avatar.png")}
            style={styles.avatar}
          />
        )}
      </View>
      <View style={styles.friendInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.name}>
            {item.first_name} {item.last_name}
          </Text>
        </View>
        {item.active_club_id && clubs[item.active_club_id] && (
          <TouchableOpacity
            style={styles.activeClubContainer}
            onPress={() => {
              const club = clubs[item.active_club_id!];
              if (club) {
                navigation.navigate("ClubDetail", { club });
              }
            }}
          >
            <Image
              source={{ uri: clubs[item.active_club_id!].Image }}
              style={styles.clubImage}
            />
            <Text style={styles.clubName}>
              {clubs[item.active_club_id!].Name}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>({count})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton color={Constants.whiteCOLOR} />
        <Text style={styles.title}>Friends</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Friend Requests Section */}
          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              {renderSectionHeader("Friend Requests", pendingRequests.length)}
              <FlatList
                data={pendingRequests}
                renderItem={renderFriendRequest}
                keyExtractor={(item) => `request-${item.id}`}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Friends Section */}
          <View style={styles.section}>
            {renderSectionHeader("Friends", friends.length)}
            {friends.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No friends yet</Text>
              </View>
            ) : (
              <FlatList
                data={friends}
                renderItem={renderFriend}
                keyExtractor={(item) => `friend-${item.id}`}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Constants.backgroundCOLOR,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Constants.whiteCOLOR,
    marginTop: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
  },
  sectionCount: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    opacity: 0.7,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    opacity: 0.7,
  },
  friendRequestItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 8,
    marginBottom: 8,
  },
  friendRequestInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  requestButtons: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  declineButton: {
    backgroundColor: "#F44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  declineButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 8,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#ccc",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  friendInfo: {
    marginLeft: 12,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nameContainer: {
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  name: {
    fontSize: 14,
    color: Constants.whiteCOLOR,
    opacity: 0.8,
  },
  activeClubContainer: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: Constants.greyCOLOR,
    padding: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  clubImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  clubName: {
    color: Constants.whiteCOLOR,
    fontSize: 12,
    fontWeight: "500",
  },
});
