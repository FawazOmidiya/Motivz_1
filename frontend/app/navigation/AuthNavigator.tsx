import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ProfileCompletionScreen from "../screens/ProfileCompletionScreen";
import AnonymousHomeScreen from "../screens/AnonymousHomeScreen";
import AnonymousExploreScreen from "../screens/AnonymousExploreScreen";
import AnonymousProfileScreen from "../screens/AnonymousProfileScreen";
import AnonymousUserProfileScreen from "../screens/AnonymousUserProfileScreen";
import AnonymousTabs from "./AnonymousTabs";

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileCompletion"
        component={ProfileCompletionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AnonymousHome"
        component={AnonymousTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AnonymousUserProfile"
        component={AnonymousUserProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
