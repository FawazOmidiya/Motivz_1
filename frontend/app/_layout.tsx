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
  const splashHiddenRef = React.useRef<boolean>(false);

  // Determine which stack to show based on session and profile completion status
  const hasActiveSession = !!session?.user;
  const profileIsComplete = profile?.is_complete === true;
  const profileIsIncomplete = profile?.is_complete === false;

  // Hide splash screen when we're ready to show content (only once)
  React.useEffect(() => {
    // Hide splash when:
    // 1. No session (show unauthenticated stack), OR
    // 2. Has session AND profile is loaded (not null - show authenticated or profile completion)
    const shouldHideSplash =
      !hasActiveSession || (hasActiveSession && profile !== null);

    if (shouldHideSplash && !splashHiddenRef.current) {
      splashHiddenRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hasActiveSession, profile]);

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

  // Show loading while profile is being fetched - keep splash screen visible
  if (hasActiveSession && profile === null) {
    return null; // Keep splash screen visible
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
    // Don't hide splash screen here - let AppContent handle it when ready
    supabase.auth.getSession().then(() => {
      setIsLoading(false);
    });
  }, []);

  // Show loading screen while checking initial session - keep splash screen visible
  if (isLoading) {
    return null; // Keep splash screen visible
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
