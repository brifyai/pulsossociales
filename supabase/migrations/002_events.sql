-- ============================================================================
-- Migration: 002_events.sql
-- Description: Event system tables for agent context
-- ============================================================================

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Stores real-world events that can affect agent opinions and behaviors
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    title TEXT NOT NULL,
    summary TEXT,
    
    -- Categorization
    category TEXT NOT NULL CHECK (category IN (
        'political',      -- Elections, legislation, scandals
        'economic',       -- Inflation, unemployment, markets
        'social',         -- Protests, movements, cultural shifts
        'environmental',  -- Natural disasters, climate events
        'security',       -- Crime, terrorism, public safety
        'health',         -- Pandemics, healthcare policy
        'international',  -- Foreign affairs, diplomacy
        'other'           -- Uncategorized
    )),
    
    -- Territorial scope
    territory_scope TEXT NOT NULL CHECK (territory_scope IN (
        'national',       -- Affects entire country
        'regional',       -- Affects specific region
        'communal',       -- Affects specific commune
        'local'           -- Very localized event
    )),
    territory_id TEXT REFERENCES territories(id) ON DELETE SET NULL,
    
    -- Event characteristics
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    source TEXT,          -- News source, official statement, etc.
    source_url TEXT,      -- Link to original source
    
    -- Timing
    event_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_territory ON events(territory_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_scope ON events(territory_scope);

-- ============================================================================
-- AGENT EVENT EXPOSURES TABLE
-- ============================================================================
-- Links agents to events with exposure details
CREATE TABLE IF NOT EXISTS agent_event_exposures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    agent_id UUID NOT NULL REFERENCES synthetic_agents(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Exposure characteristics
    exposure_probability NUMERIC(5,2) NOT NULL CHECK (exposure_probability >= 0 AND exposure_probability <= 100),
    exposure_level NUMERIC(5,2) NOT NULL CHECK (exposure_level >= 0 AND exposure_level <= 100),
    interpreted_stance TEXT NOT NULL CHECK (interpreted_stance IN ('positive', 'negative', 'neutral', 'mixed')),
    mood_impact INTEGER CHECK (mood_impact >= -50 AND mood_impact <= 50),
    
    -- Timing
    exposed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one exposure per agent-event pair
    UNIQUE(agent_id, event_id)
);

-- Indexes for agent_event_exposures
CREATE INDEX IF NOT EXISTS idx_exposures_agent ON agent_event_exposures(agent_id);
CREATE INDEX IF NOT EXISTS idx_exposures_event ON agent_event_exposures(event_id);
CREATE INDEX IF NOT EXISTS idx_exposures_stance ON agent_event_exposures(interpreted_stance);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Event summaries with exposure counts
CREATE OR REPLACE VIEW event_summaries AS
SELECT 
    e.id,
    e.title,
    e.summary,
    e.category,
    e.territory_scope,
    e.territory_id,
    t.name as territory_name,
    e.intensity,
    e.source,
    e.event_date,
    e.created_at,
    COUNT(aee.id) as exposure_count,
    COUNT(CASE WHEN aee.interpreted_stance = 'positive' THEN 1 END) as positive_stances,
    COUNT(CASE WHEN aee.interpreted_stance = 'negative' THEN 1 END) as negative_stances,
    COUNT(CASE WHEN aee.interpreted_stance = 'neutral' THEN 1 END) as neutral_stances
FROM events e
LEFT JOIN territories t ON e.territory_id = t.id
LEFT JOIN agent_event_exposures aee ON e.id = aee.event_id
GROUP BY e.id, e.title, e.summary, e.category, e.territory_scope, 
         e.territory_id, t.name, e.intensity, e.source, e.event_date, e.created_at;

-- View: Full event exposures with event details
CREATE OR REPLACE VIEW full_event_exposures AS
SELECT 
    aee.id as exposure_id,
    aee.agent_id,
    aee.exposure_probability,
    aee.exposure_level,
    aee.interpreted_stance,
    aee.mood_impact,
    aee.exposed_at,
    e.id as event_id,
    e.title as event_title,
    e.summary as event_summary,
    e.category as event_category,
    e.territory_scope,
    e.territory_id,
    t.name as territory_name,
    e.intensity as event_intensity,
    e.source as event_source,
    e.event_date
FROM agent_event_exposures aee
JOIN events e ON aee.event_id = e.id
LEFT JOIN territories t ON e.territory_id = t.id;

-- View: Events by territory for map layer
CREATE OR REPLACE VIEW territory_events AS
SELECT 
    e.*,
    t.name as territory_name,
    t.short_name as territory_short_name,
    COUNT(aee.id) as total_exposures,
    AVG(aee.exposure_level) as avg_exposure_level
FROM events e
JOIN territories t ON e.territory_id = t.id
LEFT JOIN agent_event_exposures aee ON e.id = aee.event_id
WHERE e.territory_scope IN ('regional', 'communal', 'local')
GROUP BY e.id, t.name, t.short_name;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get events for a specific agent
CREATE OR REPLACE FUNCTION get_agent_events(agent_uuid UUID)
RETURNS TABLE (
    event_id UUID,
    title TEXT,
    summary TEXT,
    category TEXT,
    intensity INTEGER,
    interpreted_stance TEXT,
    exposure_level NUMERIC,
    mood_impact INTEGER,
    exposed_at TIMESTAMPTZ,
    event_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as event_id,
        e.title,
        e.summary,
        e.category,
        e.intensity,
        aee.interpreted_stance,
        aee.exposure_level,
        aee.mood_impact,
        aee.exposed_at,
        e.event_date
    FROM events e
    JOIN agent_event_exposures aee ON e.id = aee.event_id
    WHERE aee.agent_id = agent_uuid
    ORDER BY aee.exposed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get recent events by territory
CREATE OR REPLACE FUNCTION get_territory_recent_events(territory_uuid TEXT, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    event_id UUID,
    title TEXT,
    summary TEXT,
    category TEXT,
    intensity INTEGER,
    event_date DATE,
    exposure_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as event_id,
        e.title,
        e.summary,
        e.category,
        e.intensity,
        e.event_date,
        COUNT(aee.id) as exposure_count
    FROM events e
    LEFT JOIN agent_event_exposures aee ON e.id = aee.event_id
    WHERE e.territory_id = territory_uuid
      AND e.event_date >= CURRENT_DATE - days_back
    GROUP BY e.id, e.title, e.summary, e.category, e.intensity, e.event_date
    ORDER BY e.event_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on events
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on agent_event_exposures
ALTER TABLE agent_event_exposures ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to events for authenticated users
DROP POLICY IF EXISTS "Allow read access to events" ON events;
CREATE POLICY "Allow read access to events" ON events
    FOR SELECT TO authenticated, anon
    USING (true);

-- Policy: Allow read access to exposures for authenticated users
DROP POLICY IF EXISTS "Allow read access to exposures" ON agent_event_exposures;
CREATE POLICY "Allow read access to exposures" ON agent_event_exposures
    FOR SELECT TO authenticated, anon
    USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE events IS 'Real-world events that can affect agent opinions and behaviors';
COMMENT ON TABLE agent_event_exposures IS 'Links agents to events with exposure and interpretation details';
COMMENT ON COLUMN events.intensity IS 'Event impact intensity from 1 (minor) to 10 (major)';
COMMENT ON COLUMN agent_event_exposures.exposure_probability IS 'Probability (0-100) that agent was exposed to this event';
COMMENT ON COLUMN agent_event_exposures.exposure_level IS 'Actual exposure level (0-100) experienced by agent';
COMMENT ON COLUMN agent_event_exposures.interpreted_stance IS 'How the agent interpreted the event';
