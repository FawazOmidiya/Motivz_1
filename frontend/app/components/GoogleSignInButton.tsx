import React, { useState } from "react";
import { Alert } from "react-native";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { supabaseAuth } from "../utils/supabaseAuth";
import { signInWithGoogleAndGetTokens } from "../utils/googleSignInService";
import { checkUserProfileComplete } from "../utils/supabaseService";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../utils/types";

interface GoogleSignInButtonProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleGoogleSignIn = async () => {
    console.log("Google sign-in button pressed");
    setLoading(true);
    try {
      // Use the service to handle Google Sign-In
      const { response, tokens } = await signInWithGoogleAndGetTokens();

      if (tokens.idToken) {
        // First, sign in to Supabase to get the user ID
        const { data, error } = await supabaseAuth.auth.signInWithIdToken({
          provider: "google",
          token: tokens.idToken,
        });

        if (error) throw error;
        if (!data.user) throw new Error("Failed to authenticate with Google");

        const userId = data.user.id;

        // Check if user profile is complete
        const profileCheck = await checkUserProfileComplete(userId);

        if (profileCheck.isComplete) {
          // Profile is complete, user is already signed in
          onSuccess?.(data);
        } else {
          // Profile is incomplete, navigate to profile completion
          const googleUser = response as any;
          const firstName = googleUser?.data?.user?.givenName || "";
          const lastName = googleUser?.data?.user?.familyName || "";
          const email = googleUser?.data?.user?.email || "";

          const navigationParams = {
            signUpInfo: {
              username: "",
              email: email,
              password: "",
            },
            googleUserData: {
              firstName,
              lastName,
              email: email,
            },
            // No need to pass tokens since user is already signed in
          };
          navigation.navigate("ProfileCompletion", navigationParams);
        }
      } else {
        throw new Error("No ID token received from Google Sign-In");
      }
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      Alert.alert("Error", error.message || "Google Sign-In failed");
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Light}
      onPress={handleGoogleSignIn}
      disabled={loading}
      style={{ marginBottom: 24, alignSelf: "center" }}
    />
  );
}
