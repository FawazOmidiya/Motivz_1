import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./screens/HomeScreen";
import ExploreScreen from "./screens/ExploreScreen";
import ProfileScreen from "./screens/ProfileScreen";
// import MapScreen from "./screens/MapScreen"; // Add Map Screen
import { Ionicons } from "@expo/vector-icons"; // For tab icons

// Create Bottom Tab Navigator
const Tab = createBottomTabNavigator<RootTabParamList>();
// Define type-safe navigation routes
export type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
  Map: undefined; // ✅ Add Map Screen
};

export default function RootLayout() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home-outline";
          } else if (route.name === "Explore") {
            iconName = "search-outline";
          } else if (route.name === "Profile") {
            iconName = "person-outline";
          } else if (route.name === "Map") {
            iconName = "map-outline"; // ✅ Add Map Screen
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF", // Active tab color
        tabBarInactiveTintColor: "gray", // Inactive tab color
        headerShown: false, // Hide default headers
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {/* <Tab.Screen name="Map" component={MapScreen} /> */}
    </Tab.Navigator>
  );
}
