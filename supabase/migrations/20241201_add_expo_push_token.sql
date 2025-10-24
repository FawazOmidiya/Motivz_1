-- Add push_token field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.push_token IS 'Expo push token for sending notifications';