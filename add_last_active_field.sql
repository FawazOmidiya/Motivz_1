-- Add last_active field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Create index for efficient querying by last_active
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);

-- Update existing profiles to have current timestamp as last_active
UPDATE profiles SET last_active = NOW() WHERE last_active IS NULL;
