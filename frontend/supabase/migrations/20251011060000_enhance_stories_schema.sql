-- Enhance stories table with visibility and location features
ALTER TABLE stories ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'friends' CHECK (visibility IN ('public', 'friends'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS club_id TEXT REFERENCES "Clubs"(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stories_visibility ON stories(visibility);
CREATE INDEX IF NOT EXISTS idx_stories_club_id ON stories(club_id);
CREATE INDEX IF NOT EXISTS idx_stories_event_id ON stories(event_id);
CREATE INDEX IF NOT EXISTS idx_stories_visibility_club ON stories(visibility, club_id);
CREATE INDEX IF NOT EXISTS idx_stories_visibility_event ON stories(visibility, event_id);

-- Update RLS policies for enhanced stories
DROP POLICY IF EXISTS "Users can view their own stories" ON stories;
DROP POLICY IF EXISTS "Users can view friends' stories" ON stories;

-- Policy: Users can view their own stories
CREATE POLICY "Users can view their own stories" ON stories
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can view public stories
CREATE POLICY "Users can view public stories" ON stories
    FOR SELECT USING (visibility = 'public');

-- Policy: Users can view friends' stories (requires friendship check)
CREATE POLICY "Users can view friends' stories" ON stories
    FOR SELECT USING (
        visibility = 'friends' AND 
        (
            auth.uid() = user_id OR
            EXISTS (
                SELECT 1 FROM friendships 
                WHERE (requester_id = auth.uid() AND receiver_id = stories.user_id)
                OR (receiver_id = auth.uid() AND requester_id = stories.user_id)
            )
        )
    );

-- Policy: Users can view public stories at clubs they're at
CREATE POLICY "Users can view public club stories" ON stories
    FOR SELECT USING (
        visibility = 'public' AND 
        club_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND active_club_id = stories.club_id
        )
    );
