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
import { SessionProvider } from "@/components/SessionContext";
import TutorialProvider from "./contexts/TutorialContext";
import TutorialWrapper from "./components/TutorialWrapper";
import TutorialTrigger from "./components/TutorialTrigger";
import { configureGoogleSignIn } from "./utils/googleAuth/googleSignInService";
import HomeScreen from "./screens/HomeScreen";
import ExploreScreen from "./screens/ExploreScreen";
import MapScreen from "./screens/MapScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import ClubDetail from "./screens/ClubDetail";
import EventDetail from "./screens/EventDetail";
import GuestlistForm from "./screens/GuestlistForm";
import UserProfileScreen from "./screens/UserProfileScreen";
import FriendsList from "./screens/FriendsList";
import ProfileSettings from "./screens/ProfileSettings";
import AuthNavigator from "./navigation/AuthNavigator";
import { supabase } from "./utils/supabaseService";
import { Session } from "@supabase/supabase-js";
import * as Constants from "@/constants/Constants";
import * as types from "@/app/utils/types";
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { checkUserProfileComplete } from "./utils/supabaseService";
import SignInScreen from "./screens/SignInScreen";
import * as SplashScreen from "expo-splash-screen";

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
      <HomeStack.Screen name="EventDetail" component={EventDetail} />
      <HomeStack.Screen name="GuestlistForm" component={GuestlistForm} />
      <HomeStack.Screen name="UserProfile" component={UserProfileScreen} />
    </HomeStack.Navigator>
  );
}

function ExploreStackScreen() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen name="ClubDetail" component={ClubDetail} />
      <ExploreStack.Screen name="EventDetail" component={EventDetail} />
      <ExploreStack.Screen name="GuestlistForm" component={GuestlistForm} />
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
      <MapStack.Screen name="EventDetail" component={EventDetail} />
      <MapStack.Screen name="GuestlistForm" component={GuestlistForm} />
      <MapStack.Screen name="UserProfile" component={UserProfileScreen} />
    </MapStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="ProfileSettings" component={ProfileSettings} />
      <ProfileStack.Screen name="UserProfile" component={UserProfileScreen} />
      <ProfileStack.Screen name="ClubDetail" component={ClubDetail} />
      <ProfileStack.Screen name="EventDetail" component={EventDetail} />
      <ProfileStack.Screen name="GuestlistForm" component={GuestlistForm} />
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
      {Platform.OS === "ios" && (
        <Tab.Screen name="Map" component={MapStackScreen} />
      )}
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [profileComplete, setProfileComplete] = React.useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const recentProfileUpdateRef = React.useRef<{
    userId: string;
    timestamp: number;
  } | null>(null);

  const checkProfileStatus = async (userId: string) => {
    // Skip query if we just received a realtime update for this user (within last 2 seconds)
    if (
      recentProfileUpdateRef.current &&
      recentProfileUpdateRef.current.userId === userId &&
      Date.now() - recentProfileUpdateRef.current.timestamp < 2000
    ) {
      return;
    }

    try {
      const profileCheck = await checkUserProfileComplete(userId);
      setProfileComplete(profileCheck.isComplete);
    } catch (error) {
      console.error("Error checking profile status:", error);
      setProfileComplete(false);
    } finally {
      // Hide splash screen once we've determined the session state
      setIsLoading(false);
      await SplashScreen.hideAsync();
    }
  };

  React.useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();

    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);
        if (session?.user) {
          await checkProfileStatus(session.user.id);
        } else {
          // No session, hide splash and show login
          setIsLoading(false);
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setIsLoading(false);
          await SplashScreen.hideAsync();
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);
      if (session?.user) {
        await checkProfileStatus(session.user.id);
      } else {
        setProfileComplete(null);
        // If we're still loading, this means auth state changed during initialization
        // The splash will be hidden by the initializeAuth function
      }
    });

    // Listen for profile updates to re-check profile completion status
    const profileChannel = supabase
      .channel("profile_completion_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: "is_complete=eq.true",
        },
        async (payload) => {
          if (!mounted) {
            return;
          }
          // Use the realtime payload directly instead of re-querying
          const currentSession = await supabase.auth.getSession();
          if (
            currentSession.data.session?.user?.id &&
            currentSession.data.session.user.id === payload.new.id
          ) {
            // Use the payload data directly - no need to re-query!
            const isComplete = !!payload.new.is_complete;

            // Mark that we just received a realtime update to skip redundant queries
            recentProfileUpdateRef.current = {
              userId: payload.new.id,
              timestamp: Date.now(),
            };

            setProfileComplete(isComplete);
            setIsLoading(false);
            await SplashScreen.hideAsync();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      profileChannel.unsubscribe();
    };
  }, []);

  // Using SafeAreaView from react-native-safe-area-context instead of react-native
  // This avoids ViewManagerDelegate errors on Android with RN 0.79+
  // See: https://docs.expo.dev/versions/latest/sdk/safe-area-context/

  // Show loading screen while checking session
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={Constants.backgroundCOLOR}
          />
          <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {session && session.user && profileComplete === true ? (
        <SessionProvider>
          <TutorialProvider>
            <TutorialWrapper>
              <TutorialTrigger>
                <SafeAreaView style={styles.safeArea}>
                  <StatusBar
                    barStyle="light-content"
                    backgroundColor={Constants.backgroundCOLOR}
                  />
                  <MainTabs />
                </SafeAreaView>
              </TutorialTrigger>
            </TutorialWrapper>
          </TutorialProvider>
        </SessionProvider>
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={Constants.backgroundCOLOR}
          />
          <AuthNavigator />
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
    paddingTop: StatusBar.currentHeight || 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
});
