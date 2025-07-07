# Anonymous Club Review System Setup

## Database Changes Made

You've already updated your `club_reviews` table to allow `user_id` to be nullable. This is perfect for anonymous reviews!

## How It Works

1. **Anonymous Reviews**: When `user_id` is `null`, the review is considered anonymous
2. **App Reviews**: When `user_id` has a value, the review is from an authenticated user
3. **Display Logic**: Your app can check if `user_id` is null to show "Anonymous User" instead of a username

## Testing the System

1. **Start the development server**:

   ```bash
   cd web-review
   npm run dev
   ```

2. **Open your browser** to `http://localhost:3000`

3. **Test the flow**:
   - Search for a club
   - Confirm the club selection
   - Submit a review with rating, genres, crowd level, and optional text
   - The review will be saved with `user_id = null`

## Database Verification

You can verify anonymous reviews are being created by checking your Supabase database:

```sql
-- Check for anonymous reviews
SELECT * FROM club_reviews WHERE user_id IS NULL;

-- Check for authenticated reviews
SELECT * FROM club_reviews WHERE user_id IS NOT NULL;
```

## Integration with Your App

In your main app, you can now handle both types of reviews:

```typescript
// When displaying reviews
const displayName = review.user_id ? user.username : "Anonymous User";
const displayAvatar = review.user_id ? user.avatar_url : null;
```

## Environment Variables

Make sure you have your Supabase credentials in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

The app is ready to deploy to Vercel, Netlify, or any other hosting platform. Just make sure to:

1. Set the environment variables in your hosting platform
2. Deploy the code
3. Share the URL with users

## Features

✅ **Mobile-optimized UI** - Perfect for phone users  
✅ **Anonymous reviews** - No login required  
✅ **Club search** - Find clubs by name  
✅ **Rating system** - 1-5 stars with descriptions  
✅ **Music genres** - 18 different genres  
✅ **Crowd levels** - Empty to Packed  
✅ **Review text** - Optional written feedback  
✅ **Multi-step flow** - Guided user experience

The system is now ready to collect anonymous reviews from users without requiring them to install your app!
