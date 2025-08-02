-- Create club_auth table for secure club authentication
CREATE TABLE IF NOT EXISTS club_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id TEXT UNIQUE NOT NULL REFERENCES "Clubs"(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_club_auth_club_id ON club_auth(club_id);
CREATE INDEX IF NOT EXISTS idx_club_auth_email ON club_auth(email);

-- Enable Row Level Security
ALTER TABLE club_auth ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Club auth is viewable by authenticated users" ON club_auth
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Club auth is insertable by authenticated users" ON club_auth
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Club auth is updatable by authenticated users" ON club_auth
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_club_auth_updated_at 
    BEFORE UPDATE ON club_auth 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 