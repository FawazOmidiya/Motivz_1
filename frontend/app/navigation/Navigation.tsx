import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../screens/HomeScreen";
import ExploreScreen from "../screens/ExploreScreen";
import ProfileScreen from "../screens/ProfileScreen";
import * as types from "@/app/utils/types";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const Stack = createStackNavigator<RootStackParamList>();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export type RootStackParamList = {
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
  FriendsList: undefined;
  UserProfile: { user: types.UserProfile };
  ClubDetail: { club: types.Club };
  ProfileSettings: undefined;
  // Anonymous screens
  AnonymousHome: undefined;
  AnonymousExplore: undefined;
  AnonymousProfile: undefined;
  AnonymousUserProfile: { user: types.UserProfile };
  SignIn: undefined;
  SignUp: undefined;
  ProfileCompletion: undefined;
};
