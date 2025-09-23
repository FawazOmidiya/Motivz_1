-- Create event_analytics table for tracking user interactions with events
CREATE TABLE IF NOT EXISTS event_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    click_type VARCHAR(50) NOT NULL CHECK (click_type IN ('view', 'share', 'ticket_purchase', 'guestlist_request')),
    source_screen VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_id ON event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_user_id ON event_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_click_type ON event_analytics(click_type);
CREATE INDEX IF NOT EXISTS idx_event_analytics_timestamp ON event_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_timestamp ON event_analytics(event_id, timestamp);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_type ON event_analytics(event_id, click_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own analytics data
CREATE POLICY "Users can insert their own analytics" ON event_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own analytics data
CREATE POLICY "Users can view their own analytics" ON event_analytics
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Club owners can view analytics for their events
CREATE POLICY "Club owners can view their event analytics" ON event_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events e 
            JOIN clubs c ON e.club_id = c.id 
            WHERE e.id = event_analytics.event_id 
            AND c.owner_id = auth.uid()
        )
    );

-- Policy: Admins can view all analytics
CREATE POLICY "Admins can view all analytics" ON event_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );