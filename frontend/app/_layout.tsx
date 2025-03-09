import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./screens/HomeScreen";
import { createStackNavigator } from "@react-navigation/stack";
import ExploreScreen from "./screens/ExploreScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ClubDetailScreen from "./screens/ClubDetail";
import MapScreen from "./screens/MapScreen"; // Add Map Screen
import { supabaseAuth } from "./utils/supabaseAuth";
import { getToken } from "./utils/tokens"; // Import the token utility
import { SafeAreaView, StyleSheet, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // For tab icons
import AuthScreen from "./screens/AuthScreen";
import { Session } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { SessionProvider } from "../components/SessionContext";
// Create Bottom Tab Navigator
const Tab = createBottomTabNavigator<RootTabParamList>();
// Define type-safe navigation routes
export type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
  Map: undefined; // ✅ Add Map Screen
};
export type Club = {
  id: string;
  Name: string;
  Image?: string;
  // Add other fields as needed
};

export type RootStackParamList = {
  ClubDetail: { club: Club };
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
  Map: undefined;
  // Define other routes here...
};
const HomeStack = createStackNavigator<RootStackParamList>();
const MapStack = createStackNavigator<RootStackParamList>();
const ProfileStack = createStackNavigator<RootStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ClubDetail" component={ClubDetailScreen} />
    </HomeStack.Navigator>
  );
}

function MapStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="Map" component={MapScreen} />
      <MapStack.Screen name="ClubDetail" component={ClubDetailScreen} />
    </HomeStack.Navigator>
  );
}
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="ClubDetail" component={ClubDetailScreen} />
    </ProfileStack.Navigator>
  );
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {session && session.user ? (
        <SessionProvider>
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
            <Tab.Screen name="Map" component={MapStackNavigator} />
            <Tab.Screen name="Profile" component={ProfileStackNavigator} />
          </Tab.Navigator>
        </SessionProvider>
      ) : (
        <AuthScreen />
      )}
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
