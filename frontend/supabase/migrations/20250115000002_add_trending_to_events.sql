-- Add trending field to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS trending BOOLEAN DEFAULT FALSE;

-- Create index for better performance when filtering trending events
CREATE INDEX IF NOT EXISTS idx_events_trending ON events(trending) WHERE trending = TRUE;

-- Add comment to explain the field
COMMENT ON COLUMN events.trending IS 'Marks events as trending to prioritize them in user feeds';
