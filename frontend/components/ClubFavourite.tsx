import React from "react";
import {
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Text } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";
import type { Club } from "../app/utils/types";

type FavouriteClubProps = {
  club: Club;
};

const FavouriteClub: React.FC<FavouriteClubProps> = ({ club }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate("ClubDetail", { club });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.favouriteItem}>
        <Image source={{ uri: club.Image }} style={styles.favouriteImage} />
        <Text style={styles.favouriteTitle}>{club.Name}</Text>
      </View>
    </TouchableOpacity>
  );
};

const screenWidth = Dimensions.get("window").width;
const imageSize = (screenWidth - 60) / 2;

const styles = StyleSheet.create({
  favouriteItem: {
    backgroundColor: "#212f66",
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
    color: "#fff",
  },
});

export default FavouriteClub;
