import "../app/polyfills";
import { encode as btoa, decode as atob } from "base-64";

if (typeof global.btoa === "undefined") global.btoa = btoa;
if (typeof global.atob === "undefined") global.atob = atob;
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SessionProvider } from "@/components/SessionContext";
import { PaperProvider } from "react-native-paper";
import { configureGoogleSignIn } from "./utils/googleSignInService";
import HomeScreen from "./screens/HomeScreen";
import ExploreScreen from "./screens/ExploreScreen";
import MapScreen from "./screens/MapScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ClubDetail from "./screens/ClubDetail";
import UserProfileScreen from "./screens/UserProfileScreen";
import FriendsList from "./screens/FriendsList";
import AuthScreen from "./screens/AuthScreen";
import SignInScreen from "./screens/SignInScreen";
import SignUpScreen from "./screens/SignUpScreen";
import ProfileCompletionScreen from "./screens/ProfileCompletionScreen";
import ProfileSettings from "./screens/ProfileSettings";
import AuthNavigator from "./navigation/AuthNavigator";
import { supabaseAuth } from "./utils/supabaseAuth";
import { Session } from "@supabase/supabase-js";
import * as Constants from "@/constants/Constants";
import * as types from "@/app/utils/types";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import { checkUserProfileComplete } from "./utils/supabaseService";

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
      <HomeStack.Screen name="ClubDetail" component={ClubDetail} />
      <HomeStack.Screen name="UserProfile" component={UserProfileScreen} />
    </HomeStack.Navigator>
  );
}

function ExploreStackScreen() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen name="ClubDetail" component={ClubDetail} />
      <ExploreStack.Screen name="UserProfile" component={UserProfileScreen} />
      <ExploreStack.Screen name="FriendsList" component={FriendsList} />
    </ExploreStack.Navigator>
  );
}

function MapStackScreen() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="MapMain" component={MapScreen} />
      <MapStack.Screen name="ClubDetail" component={ClubDetail} />
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
      <ProfileStack.Screen name="ClubDetail" component={ClubDetail} />
      <ProfileStack.Screen name="FriendsList" component={FriendsList} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({
        route,
      }: {
        route: RouteProp<types.RootTabParamList, keyof types.RootTabParamList>;
      }) => ({
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
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
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
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
  const [profileComplete, setProfileComplete] = React.useState<boolean | null>(
    null
  );

  const checkProfileStatus = async (userId: string) => {
    try {
      const profileCheck = await checkUserProfileComplete(userId);
      setProfileComplete(profileCheck.isComplete);
    } catch (error) {
      setProfileComplete(false);
    }
  };

  React.useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();

    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkProfileStatus(session.user.id);
      }
    });

    supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkProfileStatus(session.user.id);
      } else {
        setProfileComplete(null);
      }
    });
  }, []);

  return (
    <>
      {session && session.user && profileComplete === true ? (
        <SessionProvider>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <MainTabs />
          </SafeAreaView>
        </SessionProvider>
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <AuthNavigator />
        </SafeAreaView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
    paddingTop: StatusBar.currentHeight || 0,
  },
});
