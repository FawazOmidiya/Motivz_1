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
import { fetchUserFavourites } from "../utils/supabaseService";

type Club = {
  club_id: string;
  Name: string;
  Image?: string;
  // other fields as needed
};

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [favourites, setFavourites] = useState<Club[]>([]);
  const session = useSession();
  const navigation = useNavigation();

  useEffect(() => {
    if (session) {
      getProfile();
      getFavourites();
    }
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");
      const { data, error, status } = await supabaseAuth
        .from("profiles")
        .select(`username, website, avatar_url`)
        .eq("id", session.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }
      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Profile Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

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

  const renderFavourite = ({
    item,
  }: {
    item: { club_id: string; Name: string; Image?: string };
  }) => (
    <TouchableHighlight
      onPress={() => navigation.navigate("ClubDetail", { club: item })}
      activeOpacity={0.7}
    >
      <View style={styles.favouriteItem}>
        <Image source={{ uri: item?.Image }} style={styles.favouriteImage} />
        <Text style={styles.favouriteTitle}>{item?.Name}</Text>
      </View>
    </TouchableHighlight>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarInitial}>
                {session?.user?.email?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>{username || session?.user.email}</Text>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          buttonStyle={styles.signOutButton}
          containerStyle={styles.signOutContainer}
        />
        <Button
          title="Edit Profile"
          onPress={() => navigation.navigate("ProfileSettings")}
          containerStyle={styles.signOutContainer}
        />
      </View>

      {/* Favourites Section */}
      <View style={styles.favouritesContainer}>
        <Text style={styles.sectionTitle}>Favourites</Text>
        <FlatList
          data={favourites}
          keyExtractor={(item) => item?.club_id}
          renderItem={renderFavourite}
          numColumns={2}
          columnWrapperStyle={styles.favouritesRow}
          contentContainerStyle={styles.favouritesList}
        />
      </View>
    </ScrollView>
  );
}

const screenWidth = Dimensions.get("window").width;
const imageSize = (screenWidth - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Header styles
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
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
  },
  signOutButton: {
    backgroundColor: "#ff4d4d",
    borderRadius: 8,
  },
  signOutContainer: {
    marginTop: 10,
    width: 120,
  },
  // Favourites styles
  favouritesContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  favouritesList: {
    justifyContent: "space-between",
  },
  favouritesRow: {
    justifyContent: "space-between",
    marginBottom: 10,
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
});
