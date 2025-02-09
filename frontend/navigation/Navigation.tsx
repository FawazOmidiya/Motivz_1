import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../app/screens/HomeScreen";
import ExploreScreen from "../app/screens/ExploreScreen";
import ProfileScreen from "../app/screens/ProfileScreen";

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
};
