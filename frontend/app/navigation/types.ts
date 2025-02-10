import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// ✅ Define the main stack navigator
export type RootStackParamList = {
  Login: undefined;
  Main: undefined; // ✅ This should match the "Main" screen name in _layout.tsx
};

// ✅ Define the bottom tab navigator
export type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
};

// ✅ Type for stack navigation prop
export type StackNavigation = StackNavigationProp<RootStackParamList>;

// ✅ Type for bottom tab navigation prop
export type TabNavigation = BottomTabNavigationProp<RootTabParamList>;
