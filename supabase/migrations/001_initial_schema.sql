-- Whenly Database Schema
-- Run this in your Supabase SQL Editor or via CLI

-- events: core event information
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    host_name TEXT NOT NULL,
    host_token TEXT NOT NULL,
    date_mode TEXT NOT NULL DEFAULT 'range' CHECK (date_mode IN ('range', 'specific')),
    date_range_start DATE,
    date_range_end DATE,
    time_range_start TIME,
    time_range_end TIME,
    timezone TEXT DEFAULT 'UTC',
    finalized_start TIMESTAMPTZ,
    finalized_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- event_dates: for 'specific' date mode (selected individual dates)
CREATE TABLE event_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    UNIQUE(event_id, date)
);

-- participants: people responding to an event
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, name)
);

-- availability: time ranges each participant is available
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    slot_start TIMESTAMPTZ NOT NULL,
    slot_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_id, slot_start)
);

-- indexes for performance
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_event_dates_event ON event_dates(event_id);
CREATE INDEX idx_participants_event ON participants(event_id);
CREATE INDEX idx_participants_token ON participants(token);
CREATE INDEX idx_availability_event ON availability(event_id);
CREATE INDEX idx_availability_participant ON availability(participant_id);

-- enable row level security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- events: public read/write (no auth)
CREATE POLICY "Events are publicly readable" ON events FOR SELECT USING (true);
CREATE POLICY "Events insertable by anyone" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Events updatable by anyone" ON events FOR UPDATE USING (true);

-- event_dates: public read/write
CREATE POLICY "Event dates are publicly readable" ON event_dates FOR SELECT USING (true);
CREATE POLICY "Event dates insertable by anyone" ON event_dates FOR INSERT WITH CHECK (true);
CREATE POLICY "Event dates deletable by anyone" ON event_dates FOR DELETE USING (true);

-- participants: public read/write
CREATE POLICY "Participants are publicly readable" ON participants FOR SELECT USING (true);
CREATE POLICY "Participants insertable by anyone" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants updatable by anyone" ON participants FOR UPDATE USING (true);
CREATE POLICY "Participants deletable by anyone" ON participants FOR DELETE USING (true);

-- availability: public read/write
CREATE POLICY "Availability is publicly readable" ON availability FOR SELECT USING (true);
CREATE POLICY "Availability insertable by anyone" ON availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Availability updatable by anyone" ON availability FOR UPDATE USING (true);
CREATE POLICY "Availability deletable by anyone" ON availability FOR DELETE USING (true);

-- function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- trigger for events updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE availability;
