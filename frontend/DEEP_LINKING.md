# Deep Linking with Expo Router

Your app now supports iOS deep links using expo-router! Here's how it works:

## URL Schemes

Your app supports the following URL schemes:

### Custom Scheme (motivz://)

- `motivz://home` - Navigate to home tab
- `motivz://explore` - Navigate to explore tab
- `motivz://map` - Navigate to map tab
- `motivz://profile` - Navigate to profile tab
- `motivz://club/123` - Open club detail with ID 123
- `motivz://event/456` - Open event detail with ID 456
- `motivz://user/789` - Open user profile with ID 789
- `motivz://guestlist/101` - Open guestlist form for event ID 101
- `motivz://friends` - Open friends list
- `motivz://profile/edit` - Open edit profile
- `motivz://profile/settings` - Open profile settings
- `motivz://auth/sign-in` - Open sign in screen
- `motivz://auth/sign-up` - Open sign up screen

### Universal Links (HTTPS)

- `https://fomidiya-frontend.expo.app/home`
- `https://fomidiya-frontend.expo.app/club/123`
- `https://fomidiya-frontend.expo.app/event/456`
- etc.

## Testing Deep Links

### iOS Simulator

```bash
# Open a specific route
xcrun simctl openurl booted "motivz://club/123"

# Or use the iOS simulator's URL scheme handler
```

### iOS Device

1. Open Safari on your device
2. Type `motivz://club/123` in the address bar
3. The app should open to that route

### From Terminal (iOS Simulator)

```bash
xcrun simctl openurl booted "motivz://event/456"
```

## Using Deep Links in Code

### Navigate programmatically

```typescript
import { useRouter } from "expo-router";

const router = useRouter();

// Navigate to a route
router.push("/club/123");
router.push("/event/456");
router.push("/profile/edit");
```

### Generate shareable links

```typescript
import * as Linking from "expo-linking";

// Generate a deep link
const deepLink = Linking.createURL("/club/123");
// Returns: "motivz://club/123"

// Generate a universal link
const universalLink = `https://fomidiya-frontend.expo.app/club/123`;
```

## Current Route Structure

- `/(tabs)/home` - Home tab
- `/(tabs)/explore` - Explore tab
- `/(tabs)/map` - Map tab (iOS only)
- `/(tabs)/profile` - Profile tab
- `/club/[id]` - Club detail
- `/event/[id]` - Event detail
- `/user/[id]` - User profile
- `/guestlist/[id]` - Guestlist form
- `/friends` - Friends list
- `/profile/edit` - Edit profile
- `/profile/settings` - Profile settings
- `/auth/sign-in` - Sign in
- `/auth/sign-up` - Sign up

## Notes

- Deep links work automatically with expo-router
- The app will handle both custom scheme (`motivz://`) and universal links (HTTPS)
- Universal links require proper server configuration for the `.well-known/apple-app-site-association` file
- The existing React Navigation structure is preserved and works alongside expo-router
