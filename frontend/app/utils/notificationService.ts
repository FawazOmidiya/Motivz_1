import { useState, useEffect, useRef } from "react";
import { Platform, Alert } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Test local notification
export async function testLocalNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Local Test",
      body: "This is a local notification test",
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

// Function to send push notification using Supabase Edge Function
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) {
  console.log("Attempting to send notification with token:", expoPushToken);

  if (!expoPushToken || expoPushToken.includes("error")) {
    console.error("Invalid push token:", expoPushToken);
    Alert.alert(
      "Error",
      "Push token not available. Please check console for details."
    );
    return;
  }

  try {
    // Note: This function is deprecated in favor of sendNotificationToUser
    // which uses the Edge Function. This is kept for backward compatibility.
    console.warn(
      "sendPushNotification is deprecated. Use sendNotificationToUser instead."
    );

    // For now, we'll still use the direct Expo API for this specific function
    // but recommend using sendNotificationToUser for new implementations
    const message = {
      to: expoPushToken,
      sound: "default",
      title: title,
      body: body,
      data: data || {},
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Notification sent successfully:", result);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

// Error handler for registration
function handleRegistrationError(errorMessage: string) {
  Alert.alert("Registration Error", errorMessage);
  throw new Error(errorMessage);
}

// Main function to register for push notifications (one-time only)
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    // If user has already declined, don't ask again
    if (existingStatus === "denied") {
      console.log(
        "User has previously declined notifications, not asking again"
      );
      return null;
    }

    // If already granted, proceed to get token
    if (existingStatus === "granted") {
      console.log("Notifications already granted, getting token");
    } else {
      // Only ask for permission if not previously decided
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("User declined notification permission");
        return null;
      }
    }

    // Get project ID from config
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error("Project ID not found in app configuration");
      return null;
    }

    try {
      // Generate push token with projectId
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
          development: __DEV__,
        })
      ).data;

      return pushTokenString;
    } catch (e: unknown) {
      console.error("Error generating push token:", e);
      return null;
    }
  } else {
    console.log("Must use physical device for push notifications");
    return null;
  }
}

// Hook to manage notifications (one-time permission request)
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );

  useEffect(() => {
    // Only request permission once at app startup
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
          console.log("Push token obtained:", token);
        } else {
          console.log("No push token available");
        }
      })
      .catch((error: any) => {
        console.error("Error getting push token:", error);
        setExpoPushToken("");
      });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    sendNotification: (title: string, body: string, data?: any) =>
      sendPushNotification(expoPushToken, title, body, data),
  };
}

// Function to silently register for notifications (for settings toggle)
export async function registerForPushNotificationsSilently(): Promise<
  string | null
> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    // If already granted, get the token
    if (existingStatus === "granted") {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.error("Project ID not found in app configuration");
        return null;
      }

      try {
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
            development: __DEV__,
          })
        ).data;
        return pushTokenString;
      } catch (e: unknown) {
        console.error("Error generating push token:", e);
        return null;
      }
    } else {
      console.log(
        "Notification permission not granted, cannot register silently"
      );
      return null;
    }
  } else {
    console.log("Must use physical device for push notifications");
    return null;
  }
}

// Hook for app-wide notification management (one-time setup)
export function useAppNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);

  useEffect(() => {
    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}
