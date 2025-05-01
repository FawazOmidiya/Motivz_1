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
  TouchableOpacity,
  Modal,
  StatusBar,
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
  fetchSingleClub,
} from "../utils/supabaseService";
import FavouriteClub from "@/components/ClubFavourite";
import * as types from "@/app/utils/types";
import * as Constants from "@/constants/Constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Profile"
>;

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favourites, setFavourites] = useState<types.Club[]>([]);
  const [profile, setProfile] = useState<types.UserProfile | null>(null);
  const [activeClub, setActiveClub] = useState<types.Club | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const session = useSession();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

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

      const data = await fetchUserProfile(session.user.id);
      if (data) {
        setProfile(data);
        if (data.active_club_id) {
          const club = await fetchSingleClub(data.active_club_id);
          setActiveClub(club);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Profile Error", error.message);
      }
    } finally {
      setLoading(false);
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
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={styles.headerGradient}
      />
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.avatarInitial}>
                  {profile?.first_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>{profile?.username}</Text>
        <View style={styles.profileButtonsContainer}>
          <View style={styles.nameAndButtonsRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.firstName}>{profile?.first_name}</Text>
              <Text style={styles.lastName}>{profile?.last_name}</Text>
            </View>
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("FriendsList")}
              >
                <Ionicons
                  name="people-outline"
                  size={24}
                  color={Constants.whiteCOLOR}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("ProfileSettings")}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={Constants.whiteCOLOR}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSignOut}
              >
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  color={Constants.whiteCOLOR}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {activeClub && (
          <TouchableOpacity
            style={styles.activeClubContainer}
            onPress={() =>
              navigation.navigate("ClubDetail", { club: activeClub })
            }
          >
            <View style={styles.activeClubContent}>
              <Image
                source={{ uri: activeClub.Image }}
                style={styles.activeClubImage}
              />
              <View style={styles.activeClubInfo}>
                <Text style={styles.activeClubTitle}>Currently at</Text>
                <Text style={styles.activeClubName}>{activeClub.Name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.sectionTitle}>Favourites</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        onRequestClose={() => setIsImageModalVisible(false)}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.modalPlaceholder}>
                <Text style={styles.modalPlaceholderText}>
                  {profile?.first_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Constants.backgroundCOLOR,
    alignItems: "center",
    zIndex: 2,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: Constants.greyCOLOR,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Constants.purpleCOLOR,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 48,
    color: Constants.whiteCOLOR,
    fontWeight: "600",
  },
  username: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: Constants.whiteCOLOR,
  },
  profileButtonsContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 16,
  },
  nameAndButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
  },
  nameContainer: {
    flex: 1,
  },
  firstName: {
    color: Constants.whiteCOLOR,
    fontSize: 20,
    fontWeight: "600",
  },
  lastName: {
    color: Constants.whiteCOLOR,
    fontSize: 18,
    opacity: 0.8,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: Constants.whiteCOLOR,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  favouritesList: {
    paddingBottom: 20,
  },
  favouritesRow: {
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  favouriteItem: {
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 8,
    width: "45%",
  },
  favouriteImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    borderRadius: 12,
    marginBottom: 8,
  },
  favouriteTitle: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    fontWeight: "600",
  },
  activeClubContainer: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  activeClubContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeClubImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  activeClubInfo: {
    flex: 1,
  },
  activeClubTitle: {
    color: Constants.whiteCOLOR,
    opacity: 0.7,
    fontSize: 14,
    marginBottom: 4,
  },
  activeClubName: {
    color: Constants.whiteCOLOR,
    fontSize: 18,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "90%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  modalPlaceholderText: {
    fontSize: 80,
    color: Constants.whiteCOLOR,
  },
});
