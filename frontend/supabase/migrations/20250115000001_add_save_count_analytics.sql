-- Add save_count field to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;

-- Create function to increment save_count
CREATE OR REPLACE FUNCTION increment_save_count(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE events 
  SET save_count = save_count + 1 
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement save_count
CREATE OR REPLACE FUNCTION decrement_save_count(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE events 
  SET save_count = GREATEST(save_count - 1, 0) 
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;
