import React, { useState } from "react";
import { Alert } from "react-native";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { supabase } from "../utils/supabaseService";
import { signInWithGoogleAndGetTokens } from "../utils/googleSignInService";

interface GoogleSignInButtonProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    console.log("Google sign-in button pressed");
    setLoading(true);
    try {
      // Use the service to handle Google Sign-In
      const { response, tokens } = await signInWithGoogleAndGetTokens();

      if (tokens.idToken) {
        // Sign in to Supabase with the ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: tokens.idToken,
        });

        console.log("Supabase sign-in response:", { data, error });

        if (error) {
          throw error;
        }

        if (data) {
          console.log("Google sign-in successful:", data);
          Alert.alert("Success", "Successfully signed in with Google!");
          onSuccess?.(data);
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
