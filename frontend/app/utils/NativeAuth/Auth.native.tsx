import { Platform, Alert } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "../supabaseService";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import React, { useState, useRef } from "react";

interface NativeAuthProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function Auth({ onSuccess, onError }: NativeAuthProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

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
          // Prevent multiple simultaneous sign-ins
          if (isProcessingRef.current || isProcessing) {
            console.log(
              "Apple sign-in already in progress, ignoring duplicate request"
            );
            return;
          }

          isProcessingRef.current = true;
          setIsProcessing(true);

          try {
            console.log("=== Apple Sign In Started ===");
            console.log("Timestamp:", new Date().toISOString());

            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });

            // Sign in via Supabase Auth.
            if (credential.identityToken) {
              // Sign in to Supabase - always sign in, let _layout.tsx handle profile completion routing
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: "apple",
                token: credential.identityToken,
              });

              if (error) {
                console.error("Supabase sign in error:", error);
                throw error;
              }
              if (!data.user) {
                console.error("No user data returned from Supabase");
                throw new Error("Failed to authenticate with Apple");
              }

              // User is signed in - _layout.tsx will handle routing based on profile completion
              console.log("Apple Sign In successful");
              onSuccess?.(data);
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
          } finally {
            setIsProcessing(false);
            // Reset after a short delay to prevent rapid re-clicks
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 1000);
          }
        }}
      />
    );
  return <>{/* Implement Android Auth options. */}</>;
}
