import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";
import { useSession } from "@/components/SessionContext";
import { useState, useEffect } from "react";
import { fetchUserFriends, fetchSingleClub } from "../utils/supabaseService";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BackButton from "@/components/BackButton";
import { RootStackParamList } from "../navigation/Navigation";

type FriendsListNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FriendsList"
>;

export default function FriendsList() {
  const [friends, setFriends] = useState<types.UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<{ [key: string]: types.Club }>({});
  const session = useSession();
  const navigation = useNavigation<FriendsListNavigationProp>();

  useEffect(() => {
    if (session) {
      getFriends();
    }
  }, [session]);

  async function getFriends() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");
      const data = await fetchUserFriends(session.user.id);
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
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton color={Constants.whiteCOLOR} />
        <Text style={styles.title}>Friends</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No friends yet</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
        />
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
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
