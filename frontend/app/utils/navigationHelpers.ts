import { useSegments, usePathname } from "expo-router";

/**
 * Helper hook to get the current tab context and construct relative paths
 * Returns functions to navigate within the current tab's stack
 */
export function useTabNavigation() {
  // Hooks must be called at the top level
  const segments = useSegments();
  const pathname = usePathname();

  // Determine which tab we're currently in
  const getCurrentTab = () => {
    try {
      // Try to find tab from segments first
      if (segments && segments.length > 0) {
        const tabsIndex = segments.findIndex((seg) => seg === "(tabs)");
        if (tabsIndex >= 0 && tabsIndex < segments.length - 1) {
          return segments[tabsIndex + 1]; // Returns 'home', 'explore', 'map', or 'profile'
        }

        // If we're in a nested route, find the tab from segments
        for (const seg of segments) {
          if (["home", "explore", "map", "profile"].includes(seg)) {
            return seg;
          }
        }
      }

      // Fallback: try to extract from pathname
      if (pathname) {
        const match = pathname.match(/\/(tabs)\/(home|explore|map|profile)/);
        if (match && match[2]) {
          return match[2];
        }
      }
    } catch (error) {
      console.warn("Error determining current tab:", error);
    }

    return "home"; // Default fallback
  };

  const currentTab = getCurrentTab();

  return {
    currentTab,
    // Helper functions to construct paths within the current tab
    clubPath: (id: string, club?: any) => {
      const params = club ? { club: JSON.stringify(club) } : {};
      return {
        pathname: `/(tabs)/${currentTab}/club/${id}` as any,
        params,
      };
    },
    eventPath: (id: string, event?: any) => {
      const params = event ? { event: JSON.stringify(event) } : {};
      return {
        pathname: `/(tabs)/${currentTab}/event/${id}` as any,
        params,
      };
    },
    userPath: (id: string) => {
      return `/(tabs)/${currentTab}/user/${id}` as any;
    },
    guestlistPath: (id: string, event?: any) => {
      const params = event ? { event: JSON.stringify(event) } : {};
      return {
        pathname: `/(tabs)/${currentTab}/guestlist/${id}` as any,
        params,
      };
    },
    friendsPath: () => {
      return `/(tabs)/${currentTab}/friends` as any;
    },
  };
}
