import { Linking } from "react-native";

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

export function setupSimpleDeepLinkListener() {
  const handleUrl = (url: string) => {
    console.log("Deep link received:", url);
    const deepLinkData = parseDeepLink(url);

    if (!deepLinkData) {
      console.warn("Deep link not handled:", url);
      return;
    }

    // Store the deep link data for when the app is ready
    // This will be handled by the screens themselves
    console.log("Deep link data:", deepLinkData);

    // For now, just log the deep link
    // In a real implementation, you might want to store this in a context
    // or use a different approach to handle navigation
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
  const baseUrl = "https://fomidiya-frontend.expo.app";
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
  const baseUrl = "fomidiya://";
  const url = new URL(`${baseUrl}${type}/${id}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}
