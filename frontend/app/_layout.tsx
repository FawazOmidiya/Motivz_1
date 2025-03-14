import React, { useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, StatusBar } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./screens/HomeScreen";
import ExploreScreen from "./screens/ExploreScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MapScreen from "./screens/MapScreen";
import ClubDetailScreen from "./screens/ClubDetail";
import AuthScreen from "./screens/AuthScreen";
import { supabaseAuth } from "./utils/supabaseAuth";
import { Session } from "@supabase/supabase-js";
import { Ionicons } from "@expo/vector-icons";
import { SessionProvider } from "../components/SessionContext";
import ProfileSettings from "./screens/ProfileSettings";
// Define your club type
export type Club = {
  id: string;
  Name: string;
  Image?: string;
  // any other fields...
};

// Define type-safe navigation routes for the root stack:
export type RootStackParamList = {
  Main: undefined;
  ClubDetail: { club: Club };
  ProfileSettings: undefined;
};

// Define the bottom tab param list:
export type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
  Map: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = "";
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Explore") iconName = "search-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          else if (route.name === "Map") iconName = "map-outline";
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root Stack Navigator: Contains the MainTabs and the ClubDetail screen.
function RootLayout() {
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
          <Stack.Navigator>
            {/* MainTabs is our bottom tab navigator */}
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            {/* ClubDetail is declared only once here */}
            <Stack.Screen
              name="ClubDetail"
              component={ClubDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProfileSettings"
              component={ProfileSettings}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
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

export default RootLayout;
