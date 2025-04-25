import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Alert,
  FlatList,
  Image,
  Dimensions,
  TouchableHighlight,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Button, Text } from "@rneui/themed";
import { supabaseAuth } from "../utils/supabaseAuth";
import { useSession } from "@/components/SessionContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation";
import {
  fetchUserFavourites,
  fetchUserProfile,
  fetchUserFriends,
} from "../utils/supabaseService";
import FavouriteClub from "@/components/ClubFavourite";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import { Ionicons } from "@expo/vector-icons";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Profile"
>;

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [favourites, setFavourites] = useState<types.Club[]>([]);
  const [profile, setProfile] = useState<types.UserProfile | null>(null);
  const [friends, setFriends] = useState<types.UserProfile[]>([]);
  const session = useSession();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  useEffect(() => {
    if (session) {
      getProfile();
      getFavourites();
      getFriends();
    }
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const data = await fetchUserProfile(session.user.id);
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Profile Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function getFriends() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");
      const data = await fetchUserFriends(session.user.id);
      if (data) {
        setFriends(data);
        console.log("friends", data);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Friends Error", error.message);
      }
    }
  }
  // Pull user Favourites
  async function getFavourites() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");
      const data = await fetchUserFavourites(session.user.id);
      if (data) {
        // Map each row's club object into our Club type.
        const mappedFavourites = data.map((favourite: any) => {
          return favourite.club;
        });
        setFavourites(mappedFavourites);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Favourites Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await getProfile();
    await getFavourites();
    setRefreshing(false);
  }

  async function handleSignOut() {
    try {
      const { error } = await supabaseAuth.auth.signOut();
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Sign Out Error", error.message);
      }
    }
  }
  const ListHeaderComponent = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarInitial}>
                {profile?.first_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>{profile?.username}</Text>
        <View style={styles.profileButtonsContainer}>
          <View style={styles.nameAndButtonsRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.firstName}>{profile?.first_name}</Text>
              <Text style={styles.lastName}>{profile?.last_name}</Text>
            </View>
            <View style={styles.buttonsRow}>
              <Button
                icon={
                  <Ionicons
                    name="log-out-outline"
                    size={24}
                    color={Constants.whiteCOLOR}
                  />
                }
                onPress={handleSignOut}
                buttonStyle={styles.signOutButton}
                type="clear"
              />
              <Button
                icon={
                  <Ionicons
                    name="settings-outline"
                    size={24}
                    color={Constants.whiteCOLOR}
                  />
                }
                onPress={() => navigation.navigate("ProfileSettings")}
                buttonStyle={styles.editProfileButton}
                type="clear"
              />
              <Button
                icon={
                  <Ionicons
                    name="people-outline"
                    size={24}
                    color={Constants.whiteCOLOR}
                  />
                }
                onPress={() => navigation.navigate("FriendsList")}
                buttonStyle={styles.followersBtn}
                type="clear"
              />
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Favourites</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Favourites Section */}
      <FlatList
        data={favourites}
        keyExtractor={(item) => item?.id}
        renderItem={({ item }) => <FavouriteClub club={item} />}
        numColumns={2}
        columnWrapperStyle={styles.favouritesRow}
        contentContainerStyle={styles.favouritesList}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
  // Header styles
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Constants.backgroundCOLOR,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: Constants.greyCOLOR,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: "#ccc",
    marginBottom: 10,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  placeholderAvatar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 40,
    color: "#fff",
  },
  username: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
    color: "#fff",
  },
  signOutButton: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 8,
    height: 40,
    padding: 0,
  },
  signOutContainer: {
    marginTop: 10,
    width: 120,
  },
  editProfileButton: {
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 8,
    height: 40,
    padding: 0,
  },
  // Favourites styles

  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#fff",
    paddingHorizontal: 20,
  },
  favouritesList: {
    justifyContent: "space-between",
  },
  favouritesRow: {
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  favouriteItem: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    flex: 1,
    marginHorizontal: 5,
    width: 180,
  },
  favouriteImage: {
    width: 160,
    height: 120,
    resizeMode: "cover",
    borderRadius: 12,
    marginBottom: 5,
  },
  favouriteTitle: {
    fontSize: 14,
  },
  profileButtonsContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  nameAndButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameContainer: {
    flex: 1,
  },
  firstName: {
    color: Constants.whiteCOLOR,
    fontSize: 18,
    fontWeight: "600",
  },
  lastName: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    opacity: 0.8,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  followersBtn: {
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 8,
    height: 40,
    padding: 0,
  },
});
