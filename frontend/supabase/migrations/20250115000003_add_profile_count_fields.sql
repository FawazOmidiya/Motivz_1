-- Add count fields to profiles table for accurate stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friends_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clubs_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS events_count INTEGER DEFAULT 0;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_friends_count ON profiles(friends_count);
CREATE INDEX IF NOT EXISTS idx_profiles_clubs_count ON profiles(clubs_count);
CREATE INDEX IF NOT EXISTS idx_profiles_events_count ON profiles(events_count);

-- Update existing profiles with current counts
-- Friends count
UPDATE profiles 
SET friends_count = (
  SELECT COUNT(*) 
  FROM friendships 
  WHERE (user1_id = profiles.id OR user2_id = profiles.id) 
  AND status = 'accepted'
);

-- Clubs count (favourite clubs)
UPDATE profiles 
SET clubs_count = (
  SELECT COUNT(*) 
  FROM user_favourites 
  WHERE user_id = profiles.id 
  AND favourite_type = 'club'
);

-- Events count (saved events)
UPDATE profiles 
SET events_count = (
  SELECT COALESCE(JSONB_ARRAY_LENGTH(saved_events), 0)
  FROM profiles p2 
  WHERE p2.id = profiles.id 
  AND saved_events IS NOT NULL
);

-- Create RPC functions to update counts
CREATE OR REPLACE FUNCTION update_friends_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET friends_count = (
    SELECT COUNT(*) 
    FROM friendships 
    WHERE (user1_id = user_id OR user2_id = user_id) 
    AND status = 'accepted'
  )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_clubs_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET clubs_count = (
    SELECT COUNT(*) 
    FROM user_favourites 
    WHERE user_id = user_id 
    AND favourite_type = 'club'
  )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_events_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET events_count = (
    SELECT COALESCE(JSONB_ARRAY_LENGTH(saved_events), 0)
    FROM profiles p2 
    WHERE p2.id = user_id 
    AND saved_events IS NOT NULL
  )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
