import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import ExploreScreen from "./screens/ExploreScreen";
import MapScreen from "./screens/MapScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ClubDetailScreen from "./screens/ClubDetail";
import ProfileSettings from "./screens/ProfileSettings";
import UserProfileScreen from "./screens/UserProfileScreen";
import AuthNavigator from "./navigation/AuthNavigator";
import { supabaseAuth } from "./utils/supabaseAuth";
import { Session } from "@supabase/supabase-js";
import { SessionProvider } from "../components/SessionContext";
import * as Constants from "@/constants/Constants";
import * as types from "@/app/utils/types";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";

// Create a Bottom Tab Navigator
const Tab = createBottomTabNavigator<types.RootTabParamList>();

// Create individual Stack Navigators for each tab.
const HomeStack = createStackNavigator();
const ExploreStack = createStackNavigator();
const MapStack = createStackNavigator();
const ProfileStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <HomeStack.Screen name="UserProfile" component={UserProfileScreen} />
    </HomeStack.Navigator>
  );
}

function ExploreStackScreen() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <ExploreStack.Screen name="UserProfile" component={UserProfileScreen} />
    </ExploreStack.Navigator>
  );
}

function MapStackScreen() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="MapMain" component={MapScreen} />
      <MapStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <MapStack.Screen name="UserProfile" component={UserProfileScreen} />
    </MapStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="ProfileSettings" component={ProfileSettings} />
      <ProfileStack.Screen name="UserProfile" component={UserProfileScreen} />
      <ProfileStack.Screen name="ClubDetail" component={ClubDetailScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = "";
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Explore") iconName = "search-outline";
          else if (route.name === "Map") iconName = "map-outline";
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
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Explore" component={ExploreStackScreen} />
      <Tab.Screen name="Map" component={MapStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

export default function RootLayout() {
  const [session, setSession] = React.useState<Session | null>(null);

  React.useEffect(() => {
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <NavigationContainer>
      {session && session.user ? (
        <SessionProvider>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <MainTabs />
          </SafeAreaView>
        </SessionProvider>
      ) : (
        <AuthNavigator />
      )}
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
