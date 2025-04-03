// GlobalStackNavigator.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ClubDetailScreen from "@/app/screens/ClubDetail";
import ProfileSettings from "@/app/screens/ProfileSettings";
import UserProfileScreen from "@/app/screens/UserProfileScreen";
import type { GlobalStackParamList } from "@/app/utils/types";

const GlobalStack = createStackNavigator<GlobalStackParamList>();

export default function GlobalStackNavigator() {
  return (
    <GlobalStack.Navigator screenOptions={{ headerShown: false }}>
      <GlobalStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <GlobalStack.Screen name="ProfileSettings" component={ProfileSettings} />
      <GlobalStack.Screen name="UserProfile" component={UserProfileScreen} />
    </GlobalStack.Navigator>
  );
}
