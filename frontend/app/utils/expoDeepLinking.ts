import { Linking } from "react-native";
import { router } from "expo-router";

export interface DeepLinkData {
  type: "event" | "club" | "user" | "story";
  id: string;
  params?: Record<string, string>;
}

export function parseDeepLink(url: string): DeepLinkData | null {
  try {
    // Parse URLs like:
    // motivz://event/123
    // https://motivz.app/event/123
    // https://motivz.app/club/456
    // https://motivz.app/user/789
    // https://motivz.app/story/abc

    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);

    if (pathSegments.length < 2) {
      return null;
    }

    const [type, id] = pathSegments;

    if (!["event", "club", "user", "story"].includes(type)) {
      return null;
    }

    return {
      type: type as DeepLinkData["type"],
      id,
      params: Object.fromEntries(urlObj.searchParams.entries()),
    };
  } catch (error) {
    console.error("Error parsing deep link:", error);
    return null;
  }
}

export function handleDeepLink(url: string): boolean {
  const deepLinkData = parseDeepLink(url);

  if (!deepLinkData) {
    return false;
  }

  try {
    switch (deepLinkData.type) {
      case "event":
        // Use Expo Router to navigate to the event detail screen
        router.push({
          pathname: "/screens/EventDetail",
          params: { id: deepLinkData.id },
        });
        return true;

      case "club":
        router.push({
          pathname: "/screens/ClubDetail",
          params: { id: deepLinkData.id },
        });
        return true;

      case "user":
        router.push({
          pathname: "/screens/UserProfileScreen",
          params: { userId: deepLinkData.id },
        });
        return true;

      case "story":
        // For stories, we might want to open the story viewer
        // This would require additional context about which user's story
        console.log("Story deep link not yet implemented:", deepLinkData);
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error("Error handling deep link:", error);
    return false;
  }
}

export function setupDeepLinkListener() {
  const handleUrl = (url: string) => {
    console.log("Deep link received:", url);
    const handled = handleDeepLink(url);
    if (!handled) {
      console.warn("Deep link not handled:", url);
    }
  };

  // Handle initial URL (when app is opened via deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleUrl(url);
    }
  });

  // Handle subsequent URLs (when app is already running)
  const subscription = Linking.addEventListener("url", (event) => {
    handleUrl(event.url);
  });

  return subscription;
}

// Utility function to create deep link URLs
export function createDeepLink(
  type: DeepLinkData["type"],
  id: string,
  params?: Record<string, string>
): string {
  const baseUrl = "https://motivz.app";
  const url = new URL(`${baseUrl}/${type}/${id}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

// Utility function to create app scheme URLs (for when app is installed)
export function createAppSchemeLink(
  type: DeepLinkData["type"],
  id: string,
  params?: Record<string, string>
): string {
  const baseUrl = "motivz://";
  const url = new URL(`${baseUrl}${type}/${id}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}
