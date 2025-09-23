import { Platform, Alert } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "../supabaseService";
import { checkUserProfileComplete } from "../supabaseService";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

interface NativeAuthProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function Auth({ onSuccess, onError }: NativeAuthProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (Platform.OS === "ios")
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={
          AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
        }
        cornerRadius={5}
        style={{
          width: "100%",
          height: 64,
          alignSelf: "center",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={async () => {
          try {
            console.log("=== Apple Sign In Started ===");
            console.log("Timestamp:", new Date().toISOString());

            // Check current session before starting
            const { data: currentSession } = await supabase.auth.getSession();
            console.log(
              "Current session before Apple Sign In:",
              currentSession?.session?.user?.id || "No session"
            );
            console.log(
              "Current session user email:",
              currentSession?.session?.user?.email
            );
            console.log(
              "Current session user providers:",
              currentSession?.session?.user?.app_metadata?.providers
            );

            // If there's an anonymous session, sign out first
            if (
              currentSession?.session?.user &&
              !currentSession.session.user.email
            ) {
              console.log("Found anonymous session, signing out first...");
              await supabase.auth.signOut();
            }

            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });

            // Sign in via Supabase Auth.
            if (credential.identityToken) {
              console.log("Apple credential received:", {
                hasIdentityToken: !!credential.identityToken,
                hasEmail: !!credential.email,
                hasFullName: !!credential.fullName,
                email: credential.email,
                fullName: credential.fullName,
                user: credential.user, // This is the Apple user ID
              });

              console.log("Attempting Supabase sign in...");
              console.log("Using Apple user ID:", credential.user);
              console.log("Using Apple email:", credential.email);

              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: "apple",
                token: credential.identityToken,
              });

              console.log(
                "Supabase response:",
                JSON.stringify({ error, user: data?.user }, null, 2)
              );

              if (error) {
                console.error("Supabase sign in error:", error);
                throw error;
              }
              if (!data.user) {
                console.error("No user data returned from Supabase");
                throw new Error("Failed to authenticate with Apple");
              }

              const userId = data.user.id;
              console.log("New user ID from Supabase:", userId);
              console.log("User email:", data.user.email);
              console.log("User providers:", data.user.app_metadata?.providers);
              console.log("User created at:", data.user.created_at);
              console.log("User last sign in:", data.user.last_sign_in_at);

              // Check if user profile is complete
              const profileCheck = await checkUserProfileComplete(userId);
              console.log("Profile check result:", profileCheck);

              if (profileCheck.isComplete) {
                // Profile is complete, user is already signed in
                console.log("Apple Sign In successful - profile complete");
                onSuccess?.(data);
              } else {
                // Profile is incomplete, navigate to profile completion
                const firstName = credential.fullName?.givenName || "";
                const lastName = credential.fullName?.familyName || "";
                const email = credential.email || "";

                const navigationParams = {
                  signUpInfo: {
                    username: "",
                    email: email,
                    password: "",
                  },
                  appleUserData: {
                    firstName,
                    lastName,
                    email: email,
                  },
                };
                console.log(
                  "Navigating to ProfileCompletion with params:",
                  navigationParams
                );
                navigation.navigate("ProfileCompletion", navigationParams);
              }
            } else {
              throw new Error("No identityToken received from Apple");
            }
          } catch (e: any) {
            console.error("Apple Sign In error:", e);
            if (e.code === "ERR_REQUEST_CANCELED") {
              console.log("User canceled Apple Sign In");
            } else {
              Alert.alert("Error", e.message || "Apple Sign In failed");
              onError?.(e);
            }
          }
        }}
      />
    );
  return <>{/* Implement Android Auth options. */}</>;
}
