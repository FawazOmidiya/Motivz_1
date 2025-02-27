import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./screens/HomeScreen";
import { createStackNavigator } from "@react-navigation/stack";
import ExploreScreen from "./screens/ExploreScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ClubDetailScreen from "./screens/ClubDetail";
import MapScreen from "./screens/MapScreen"; // Add Map Screen
import { getToken } from "./utils/tokens"; // Import the token utility
import { SafeAreaView, StyleSheet, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // For tab icons
import AuthScreen from "./screens/AuthScreen";
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
  const [isAuthenticated, setIsAuthenticated] = useState<any>(false);

  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const token = await getToken();
  //     setIsAuthenticated(!!token);
  //   };
  //   checkAuth();
  // }, []);
  // if (!isAuthenticated) {
  //   return <AuthScreen />;
  // }

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
        <Tab.Screen name="Map" component={MapScreen} />
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
