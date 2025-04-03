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
import ProfileSettings from "./screens/ProfileSettings";
import UserProfileScreen from "./screens/UserProfileScreen";
import { supabaseAuth } from "./utils/supabaseAuth";
import { Session } from "@supabase/supabase-js";
import { Ionicons } from "@expo/vector-icons";
import { SessionProvider } from "../components/SessionContext";
import * as Constants from "@/constants/Constants";
import GlobalStackNavigator from "@/components/GlobalStackNavigator";
import AuthNavigator from "./navigation/AuthNavigator";
import { NavigationContainer } from "@react-navigation/native";

import * as types from "@/app/utils/types";

const Tab = createBottomTabNavigator<types.RootTabParamList>();
const Stack = createStackNavigator<types.RootStackParamList>();

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
        tabBarActiveTintColor: Constants.tabCOLOR_ACTIVE,
        tabBarInactiveTintColor: Constants.tabCOLOR_INACTIVE,
        headerShown: false,
        tabBarStyle: {
          height: 55, // ↓ Custom height (default is ~80)
          paddingBottom: 0, // ↓ Lower the padding
          paddingTop: 5,
          backgroundColor: Constants.blackCOLOR,
        },
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
    <NavigationContainer>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
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
              <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </SessionProvider>
        ) : (
          <AuthNavigator />
        )}
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
    paddingTop: StatusBar.currentHeight || 0,
  },
});

export default RootLayout;
