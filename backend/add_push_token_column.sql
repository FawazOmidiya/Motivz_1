-- Add push_token column to profiles table for storing Expo push tokens
-- This enables push notifications for friend requests

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for faster lookups when sending notifications
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN profiles.push_token IS 'Expo push token for sending push notifications to this user';