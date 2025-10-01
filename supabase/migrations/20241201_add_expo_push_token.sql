-- Add expo_push_token field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_expo_push_token ON profiles(expo_push_token) WHERE expo_push_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.expo_push_token IS 'Expo push token for sending notifications';