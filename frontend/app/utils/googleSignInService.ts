// Google Sign-In Service
// Handles all Google authentication logic

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// Configure Google Sign-In
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      "973030992974-a00q54c5i2vor0i2ggdtovtcaklgnbb2.apps.googleusercontent.com",
    iosClientId:
      "973030992974-a00q54c5i2vor0i2ggdtovtcaklgnbb2.apps.googleusercontent.com",
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    profileImageSize: 120,
  });
}

// Check if user is already signed in with Google
export async function isSignedInWithGoogle() {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return !!currentUser;
  } catch (error) {
    console.error("Error checking Google sign-in status:", error);
    return false;
  }
}

// Sign out from Google
export async function signOutFromGoogle() {
  try {
    await GoogleSignin.signOut();
    console.log("Signed out from Google");
  } catch (error) {
    console.error("Error signing out from Google", error);
  }
}

// Get current Google user
export async function getCurrentGoogleUser() {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser;
  } catch (error) {
    console.error("Error getting current Google user:", error);
    return null;
  }
}

// Check if device has Google Play Services
export async function hasGooglePlayServices() {
  try {
    await GoogleSignin.hasPlayServices();
    return true;
  } catch (error) {
    console.error("Google Play Services not available:", error);
    return false;
  }
}

// Get Google tokens
export async function getGoogleTokens() {
  try {
    const tokens = await GoogleSignin.getTokens();
    return tokens;
  } catch (error) {
    console.error("Error getting Google tokens:", error);
    throw error;
  }
}

// Sign in with Google and get tokens
export async function signInWithGoogleAndGetTokens() {
  try {
    // Check if Play Services are available (Android only)
    await GoogleSignin.hasPlayServices();

    // Clear any cached sign-in to ensure fresh authentication
    await GoogleSignin.signOut();

    // Sign in with Google
    const response = await GoogleSignin.signIn();
    console.log("Google Sign-In response:", response);

    // Check if the response indicates a cancelled sign-in
    if (!response || !response.data) {
      throw new Error("Sign-in was cancelled or failed");
    }

    // Get the ID token
    const tokens = await GoogleSignin.getTokens();
    console.log("Google tokens:", tokens);

    return { response, tokens };
  } catch (error: any) {
    console.error("Google Sign-In error:", error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error("Sign-in was cancelled by user");
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error("Sign-in is already in progress");
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services not available");
    } else {
      throw new Error(error.message || "Google Sign-In failed");
    }
  }
}
