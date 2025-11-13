# Testing Deep Links

## Quick Test (No Website Needed) - Custom Scheme

The easiest way to test is using the custom URL scheme `motivz://`. This works immediately without any website setup.

### Method 1: iOS Simulator (Terminal)

```bash
# Test opening a club
xcrun simctl openurl booted "motivz://club/123"

# Test opening an event
xcrun simctl openurl booted "motivz://event/456"

# Test opening home tab
xcrun simctl openurl booted "motivz://home"
```

### Method 2: iOS Device (Safari)

1. Open Safari on your iPhone
2. Type in the address bar: `motivz://club/123`
3. Tap Go
4. The app should open to that club

### Method 3: iOS Device (Notes App)

1. Open Notes app
2. Type: `motivz://club/123`
3. Tap the link
4. The app should open

### Method 4: From Code (In Your App)

```typescript
import * as Linking from "expo-linking";

// Open a deep link programmatically
Linking.openURL("motivz://club/123");
```

## Universal Links (Requires Website)

For universal links (HTTPS), you need:

1. A live website at `https://42P3N5W766.motivz-frontend.expo.app`
2. The `.well-known/apple-app-site-association` file served correctly

### Testing Universal Links

Once your website is live, test with:

- `https://42P3N5W766.motivz-frontend.expo.app/club/123`
- `https://42P3N5W766.motivz-frontend.expo.app/event/456`

**Note:** Universal links only work when:

- The website is live and accessible
- The `apple-app-site-association` file is served with `Content-Type: application/json`
- The file is accessible at `https://your-domain/.well-known/apple-app-site-association`
- You've built a new app with the associated domains configured

## Available Deep Link Routes

### Tabs

- `motivz://home`
- `motivz://explore`
- `motivz://map` (iOS only)
- `motivz://profile`

### Detail Pages

- `motivz://club/[id]` - e.g., `motivz://club/123`
- `motivz://event/[id]` - e.g., `motivz://event/456`
- `motivz://user/[id]` - e.g., `motivz://user/789`

### Other Routes

- `motivz://guestlist/[id]`
- `motivz://friends`
- `motivz://profile/edit`
- `motivz://profile/settings`
- `motivz://auth/sign-in`
- `motivz://auth/sign-up`

## Troubleshooting

### Deep link doesn't open the app

1. Make sure the app is installed
2. For custom scheme (`motivz://`), it should work immediately
3. For universal links, you need a new build with the associated domains

### App opens but wrong screen

- Check that the route exists in your file structure
- Verify the ID is valid
- Check console logs for routing errors

### Universal links not working

- Verify the website is live
- Check that `apple-app-site-association` file is accessible
- Make sure you've rebuilt the app after adding associated domains
- Universal links require a production build (not dev client)
