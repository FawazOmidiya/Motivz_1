import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import AnonymousHomeScreen from "../screens/AnonymousHomeScreen";
import AnonymousExploreScreen from "../screens/AnonymousExploreScreen";
import AnonymousProfileScreen from "../screens/AnonymousProfileScreen";
import * as Constants from "@/constants/Constants";

const Tab = createBottomTabNavigator();

export default function AnonymousTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<any, keyof any> }) => ({
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName = "";
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Explore") iconName = "search-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: Constants.tabCOLOR_ACTIVE,
        tabBarInactiveTintColor: Constants.tabCOLOR_INACTIVE,
        headerShown: false,
        tabBarStyle: {
          height: 55,
          paddingBottom: 0,
          paddingTop: 5,
          backgroundColor: Constants.blackCOLOR,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      })}
    >
      <Tab.Screen name="Home" component={AnonymousHomeScreen} />
      <Tab.Screen name="Explore" component={AnonymousExploreScreen} />
      <Tab.Screen name="Profile" component={AnonymousProfileScreen} />
    </Tab.Navigator>
  );
}
