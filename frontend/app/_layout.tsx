import "../app/polyfills";
import { encode as btoa, decode as atob } from "base-64";

if (typeof global.btoa === "undefined") global.btoa = btoa;
if (typeof global.atob === "undefined") global.atob = atob;
import React from "react";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SessionProvider,
  useProfile,
  useSession,
} from "@/components/SessionContext";
import TutorialProvider from "./contexts/TutorialContext";
import TutorialWrapper from "./components/TutorialWrapper";
import TutorialTrigger from "./components/TutorialTrigger";
import { configureGoogleSignIn } from "./utils/googleAuth/googleSignInService";
import { supabase } from "./utils/supabaseService";
import * as Constants from "@/constants/Constants";
import { StatusBar, StyleSheet, View, ActivityIndicator } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Inner component that uses SessionProvider
function AppContent() {
  const session = useSession();
  const profile = useProfile();
  const router = useRouter();
  const prevSessionRef = React.useRef<boolean>(false);

  // Handle sign out redirect
  React.useEffect(() => {
    if (session?.user) {
      prevSessionRef.current = true;
    } else {
      // Only navigate if we had a session before (user just signed out)
      // Don't navigate on initial load when session is null
      if (prevSessionRef.current) {
        prevSessionRef.current = false;
        router.replace("/auth/sign-in");
      }
    }
  }, [session?.user?.id, router]);

  // Determine which stack to show based on session and profile completion status
  const hasActiveSession = !!session?.user;
  const profileIsComplete = profile?.is_complete === true;
  const profileIsIncomplete = profile?.is_complete === false;

  // Show loading while profile is being fetched (prevents any stack from showing)
  if (hasActiveSession && profile === null) {
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

  // Show profile completion stack if profile is incomplete
  // This prevents the authenticated stack from rendering and avoids nested navigation
  if (hasActiveSession && profileIsIncomplete) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Constants.backgroundCOLOR}
        />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="auth/profile-completion"
            options={{ headerShown: false }}
          />
        </Stack>
      </SafeAreaView>
    );
  }

  // Show authenticated stack only if profile is complete
  if (hasActiveSession && profileIsComplete) {
    return (
      <TutorialProvider>
        <TutorialWrapper>
          <TutorialTrigger>
            <SafeAreaView style={styles.safeArea}>
              <StatusBar
                barStyle="light-content"
                backgroundColor={Constants.backgroundCOLOR}
              />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="club/[id]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="event/[id]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="e/[slug]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="user/[id]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="guestlist/[id]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="friends" options={{ headerShown: false }} />
                <Stack.Screen
                  name="profile/edit"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/settings"
                  options={{ headerShown: false }}
                />
              </Stack>
            </SafeAreaView>
          </TutorialTrigger>
        </TutorialWrapper>
      </TutorialProvider>
    );
  }

  // Show unauthenticated stack
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Constants.backgroundCOLOR}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();

    // Get initial session to determine if we should show loading
    // SessionProvider will handle all subsequent session management
    supabase.auth.getSession().then(() => {
      setIsLoading(false);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  // Show loading screen while checking initial session
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Constants.backgroundCOLOR}
        />
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
