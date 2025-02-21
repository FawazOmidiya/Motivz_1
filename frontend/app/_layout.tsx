import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./screens/HomeScreen";
import { createStackNavigator } from "@react-navigation/stack";
import ExploreScreen from "./screens/ExploreScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ClubDetailScreen from "./screens/ClubDetail";
import MapScreen from "./screens/MapScreen"; // Add Map Screen
import EventMap from "./screens/Map2";
import { SafeAreaView, StyleSheet, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // For tab icons

// Create Bottom Tab Navigator
const Tab = createBottomTabNavigator<RootTabParamList>();
// Define type-safe navigation routes
export type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
  Map: undefined; // ✅ Add Map Screen
  Map2: undefined; // Add Map Screen
};
const HomeStack = createStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="ClubDetail" component={ClubDetailScreen} />
    </HomeStack.Navigator>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
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
            } else if (route.name === "Map2") {
              iconName = "map-outline"; // Add Map Screen
            }

            return (
              <Ionicons name={iconName as any} size={size} color={color} />
            );
          },
          tabBarActiveTintColor: "#007AFF", // Active tab color
          tabBarInactiveTintColor: "gray", // Inactive tab color
          headerShown: false, // Hide default headers
        })}
      >
        <Tab.Screen name="Home" component={HomeStackNavigator} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        {/* <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Map2" component={EventMap} /> */}
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: StatusBar.currentHeight || 0,
  },
});
