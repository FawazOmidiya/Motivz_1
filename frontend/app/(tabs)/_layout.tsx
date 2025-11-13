// Tab navigator layout for expo-router
// This wraps the existing React Navigation tab structure
import { Tabs, Redirect } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Constants from "@/constants/Constants";
import { useSession } from "@/components/SessionContext";

export default function TabsLayout() {
  const session = useSession();

  // If no session, show loading to prevent blank screen during redirect
  // The parent _layout.tsx will handle showing the auth stack
  if (!session) {
    return null; // Let parent handle redirect
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Constants.tabCOLOR_ACTIVE,
        tabBarInactiveTintColor: Constants.tabCOLOR_INACTIVE,
        tabBarStyle: {
          height: 55,
          paddingBottom: 0,
          paddingTop: 5,
          backgroundColor: Constants.blackCOLOR,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      {Platform.OS === "ios" && (
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
