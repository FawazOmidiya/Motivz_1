import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import TutorialScreen from "../screens/tutorial/TutorialScreen";

const Stack = createStackNavigator();

export default function TutorialNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe gestures
      }}
    >
      <Stack.Screen name="Tutorial" component={TutorialScreen} />
    </Stack.Navigator>
  );
}
