# iMessage Rich Sharing + iOS Universal Links Setup

Complete implementation guide for iMessage rich previews and iOS Universal Links for Motivz events.

## Overview

This implementation enables:

- **iMessage Rich Previews**: Large image + title/caption when sharing event links
- **iOS Universal Links**: Tapping links opens the app directly (if installed)
- **Web Fallback**: Clean landing page for users without the app

## Architecture

1. **Next.js Route** (`/e/[slug]`): Server-rendered page with Open Graph tags
2. **Apple App Site Association (AASA)**: Configures Universal Links
3. **Expo Router**: Handles deep links in the mobile app
4. **Share Service**: React Native utility for sharing events

## Setup Instructions

### 1. Replace Placeholders

**In `web/src/app/e/[slug]/page.tsx`:**

- Replace `MOTIVZ_DOMAIN` with your actual domain (e.g., `motivz.app`)
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

**In `web/public/.well-known/apple-app-site-association` and `web/public/apple-app-site-association`:**

- Replace `APPLE_TEAM_ID` with your Apple Team ID (e.g., `ABCDE12345`)
- Replace `IOS_BUNDLE_ID` with your bundle identifier (e.g., `com.motivz.app`)

**In `frontend/app.json`:**

- Replace `MOTIVZ_DOMAIN` in `associatedDomains` with your actual domain

**In `frontend/app/utils/shareService.ts`:**

- Replace `MOTIVZ_DOMAIN` with your actual domain
- Add `EXPO_PUBLIC_MOTIVZ_DOMAIN` to your `.env` file

### 2. Database Schema

Ensure your `events` table has a `slug` column (unique, text):

```sql
ALTER TABLE events ADD COLUMN slug TEXT UNIQUE;
CREATE INDEX idx_events_slug ON events(slug);
```

If you don't have slugs yet, you can generate them from titles and IDs (ensures uniqueness):

```sql
UPDATE events
SET slug = id || '-' || LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;
```

This creates slugs like `abc123-friday-night-vibes`, ensuring uniqueness even when events have the same name.

### 3. Deploy AASA File

The AASA file must be:

- Accessible at `https://MOTIVZ_DOMAIN/.well-known/apple-app-site-association`
- Accessible at `https://MOTIVZ_DOMAIN/apple-app-site-association`
- Served with `Content-Type: application/json` (configured in `next.config.ts`)
- No redirects (must return 200)
- Valid JSON (no `.json` extension)

### 4. iOS Build Requirements

After updating `app.json`:

1. Run `npx expo prebuild` to regenerate native files
2. Build with EAS: `eas build --platform ios`
3. The `associatedDomains` entitlement will be added automatically

### 5. Using the Share Function

In your React Native components:

```typescript
import { shareEvent } from "../utils/shareService";

// When sharing an event
await shareEvent({
  slug: event.slug,
  title: event.title,
  caption: event.caption,
});
```

## Testing

### iMessage Rich Preview

1. **Generate a test event** with a slug in your database
2. **Share the link** using the `shareEvent` function
3. **Send to yourself** in iMessage
4. **Wait for preview** (may take 10-30 seconds)
5. **Verify**:
   - Large image displays
   - Title and caption show
   - Tapping opens app (if installed) or web page

**Note**: iMessage caches previews. To test changes:

- Append `?v=timestamp` to the URL
- Clear iMessage cache (Settings > Messages > Reset)
- Wait 24 hours for cache to expire

### Universal Links

1. **Test on device** (not simulator):

   - Open Safari
   - Navigate to `https://MOTIVZ_DOMAIN/e/test-slug`
   - Tap the link
   - Should open app directly

2. **Verify AASA file**:

   ```bash
   curl https://MOTIVZ_DOMAIN/.well-known/apple-app-site-association
   ```

   Should return JSON with `Content-Type: application/json`

3. **Check Apple's validator**:
   - https://search.developer.apple.com/appsearch-validation-tool/
   - Enter your domain
   - Verify AASA file is valid

### Web Fallback

1. **Open in browser** (without app installed):
   - Navigate to `https://MOTIVZ_DOMAIN/e/test-slug`
   - Should show clean landing page
   - "Open in Motivz" button should link to `motivz://e/test-slug`

## Open Graph Image Best Practices

- **Size**: 1200×630 pixels (1.91:1 aspect ratio)
- **Format**: JPG or PNG
- **File Size**: < 1MB recommended
- **URL**: Must be absolute (starts with `http://` or `https://`)
- **Content-Type**: Must be served with correct MIME type

**Recommendation**: Generate OG images server-side when events are created:

- Use a serverless function (Vercel, Netlify, etc.)
- Overlay event title/caption on poster image
- Store optimized version in Supabase Storage
- Reference in `image_url` field

## Troubleshooting

### iMessage Preview Not Showing

1. **Check OG tags**: View page source, verify all tags present
2. **Image URL**: Must be absolute, publicly accessible
3. **Cache**: iMessage caches aggressively, wait or use `?v=timestamp`
4. **Size**: Image must be large enough (1200×630 recommended)

### Universal Links Not Opening App

1. **AASA file**: Verify accessible, correct Content-Type, valid JSON
2. **Associated Domains**: Check `app.json` has correct domain
3. **Build**: Must rebuild app after changing `associatedDomains`
4. **Testing**: Universal Links only work on physical devices
5. **Long-press**: On iOS, long-press link to see "Open in Motivz" option

### Web Page Not Loading

1. **Database**: Verify event exists with matching slug
2. **Supabase**: Check environment variables are set
3. **404**: Ensure Next.js route is deployed correctly

## Android App Links (Optional Bonus)

To add Android support:

1. **Create `web/public/.well-known/assetlinks.json`**:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.motivz.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

2. **Update `frontend/app.json`**:

```json
"android": {
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": [
        {
          "scheme": "https",
          "host": "MOTIVZ_DOMAIN",
          "pathPrefix": "/e"
        }
      ],
      "category": ["BROWSABLE", "DEFAULT"]
    }
  ]
}
```

3. **Get SHA256 fingerprint**:

```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

## Files Created/Modified

- `web/src/app/e/[slug]/page.tsx` - Next.js route with OG tags
- `web/public/.well-known/apple-app-site-association` - AASA file
- `web/public/apple-app-site-association` - AASA file (root)
- `web/next.config.ts` - Headers for AASA file
- `frontend/app.json` - Associated domains configuration
- `frontend/app/e/[slug].tsx` - Expo Router deep link handler
- `frontend/app/utils/shareService.ts` - Share utility
- `frontend/app/_layout.tsx` - Added route for `/e/[slug]`

## Environment Variables

**Next.js (`.env.local`):**

```
NEXT_PUBLIC_MOTIVZ_DOMAIN=motivz.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Expo (`.env`):**

```
EXPO_PUBLIC_MOTIVZ_DOMAIN=motivz.app
```

## Next Steps

1. Replace all placeholders with actual values
2. Add `slug` column to events table
3. Generate slugs for existing events
4. Deploy Next.js app
5. Rebuild iOS app with EAS
6. Test end-to-end flow
