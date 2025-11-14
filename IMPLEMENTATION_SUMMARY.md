# iMessage Rich Sharing + iOS Universal Links - Implementation Summary

## ✅ Completed Implementation

All required files have been created and configured for end-to-end iMessage rich sharing and iOS Universal Links.

## 📁 Files Created/Modified

### Next.js (Web)

1. **`web/src/app/e/[slug]/page.tsx`** - Dynamic route with server-side rendering and Open Graph tags
2. **`web/public/.well-known/apple-app-site-association`** - AASA file for Universal Links
3. **`web/public/apple-app-site-association`** - AASA file (root path)
4. **`web/next.config.ts`** - Added headers for AASA file (Content-Type: application/json)

### Expo (Mobile)

1. **`frontend/app/e/[slug].tsx`** - Expo Router handler for Universal Links
2. **`frontend/app/utils/shareService.ts`** - Share utility using react-native-share
3. **`frontend/app/_layout.tsx`** - Added route for `/e/[slug]`
4. **`frontend/app.json`** - Updated `associatedDomains` to include MOTIVZ_DOMAIN
5. **`frontend/app/utils/types.ts`** - Added `slug?: string` to Event interface

### Documentation

1. **`UNIVERSAL_LINKS_SETUP.md`** - Complete setup and testing guide

## 🔧 Required Actions

### 1. Install Dependencies

```bash
cd frontend
npm install react-native-share
```

### 2. Replace Placeholders

**AASA Files** (`web/public/.well-known/apple-app-site-association` and `web/public/apple-app-site-association`):

- Replace `APPLE_TEAM_ID` with your Apple Team ID (e.g., `ABCDE12345`)
- Replace `IOS_BUNDLE_ID` with your bundle identifier (e.g., `com.motivz.app`)

**Next.js** (`web/src/app/e/[slug]/page.tsx`):

- Replace `MOTIVZ_DOMAIN` with your actual domain (e.g., `motivz.app`)
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

**Expo Config** (`frontend/app.json`):

- Replace `MOTIVZ_DOMAIN` in `associatedDomains` with your actual domain

**Share Service** (`frontend/app/utils/shareService.ts`):

- Replace `MOTIVZ_DOMAIN` with your actual domain
- Add `EXPO_PUBLIC_MOTIVZ_DOMAIN` to `.env` file

### 3. Database Schema

Add `slug` column to `events` table:

```sql
ALTER TABLE events ADD COLUMN slug TEXT UNIQUE;
CREATE INDEX idx_events_slug ON events(slug);
```

Generate slugs for existing events:

```sql
UPDATE events
SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;
```

### 4. Environment Variables

**Next.js** (`.env.local`):

```
NEXT_PUBLIC_MOTIVZ_DOMAIN=motivz.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Expo** (`.env`):

```
EXPO_PUBLIC_MOTIVZ_DOMAIN=motivz.app
```

### 5. Rebuild iOS App

After updating `app.json`:

```bash
cd frontend
npx expo prebuild
eas build --platform ios
```

## 🎯 Usage

### Share an Event

In your React Native components:

```typescript
import { shareEvent } from "../utils/shareService";

// When sharing an event
await shareEvent({
  slug: event.slug || event.id, // Fallback to id if slug not available
  title: event.title,
  caption: event.caption,
});
```

### Update EventDetail Share Function (Optional)

You can update `EventDetail.tsx` to use the new share service:

```typescript
import { shareEvent } from "../utils/shareService";

const handleShare = async () => {
  if (!displayEvent) return;

  // Use slug if available, fallback to id
  const slug = displayEvent.slug || displayEvent.id;

  await shareEvent({
    slug,
    title: displayEvent.title,
    caption: displayEvent.caption,
  });
};
```

## 🧪 Testing

See `UNIVERSAL_LINKS_SETUP.md` for detailed testing instructions.

### Quick Test

1. Create an event with a slug in your database
2. Share using `shareEvent()` function
3. Send to yourself in iMessage
4. Verify rich preview appears (may take 10-30 seconds)
5. Tap the link - should open app if installed, or web page if not

## 📝 Notes

- **OG Image**: Recommended size is 1200×630 pixels. Ensure images are absolute URLs.
- **iMessage Cache**: iMessage caches previews. Use `?v=timestamp` when testing changes.
- **Universal Links**: Only work on physical iOS devices, not simulators.
- **AASA File**: Must be accessible at both `/.well-known/apple-app-site-association` and `/apple-app-site-association` with `Content-Type: application/json`.

## 🚀 Next Steps

1. Replace all placeholders with actual values
2. Install `react-native-share`
3. Add `slug` column to database
4. Generate slugs for existing events
5. Deploy Next.js app
6. Rebuild iOS app with EAS
7. Test end-to-end flow

## 📚 Additional Resources

- [Apple Universal Links Documentation](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Open Graph Protocol](https://ogp.me/)
- [react-native-share Documentation](https://github.com/react-native-share/react-native-share)
