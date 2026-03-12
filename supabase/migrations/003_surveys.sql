-- ============================================================================
-- MIGRATION 003: Survey System Tables
-- ============================================================================
-- Purpose: Create tables for synthetic survey system
-- Tables: surveys, survey_questions, survey_runs, survey_responses
-- ============================================================================

-- ============================================================================
-- SURVEYS
-- ============================================================================
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    category VARCHAR(100),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE surveys IS 'Survey definitions and metadata';
COMMENT ON COLUMN surveys.status IS 'draft, active, paused, completed, archived';

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_category ON surveys(category);

-- ============================================================================
-- SURVEY QUESTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    answer_type VARCHAR(50) NOT NULL CHECK (answer_type IN ('single_choice', 'multiple_choice', 'scale', 'text', 'number', 'boolean')),
    options_json JSONB, -- For choice questions: [{"value": "1", "label": "Muy de acuerdo"}, ...]
    scale_config JSONB, -- For scale questions: {"min": 1, "max": 7, "step": 1, "labels": {"1": "Muy en desacuerdo", "7": "Muy de acuerdo"}}
    validation_rules JSONB, -- {"required": true, "min_length": 1, "max_length": 500}
    order_index INTEGER DEFAULT 0,
    category VARCHAR(100), -- e.g., 'political', 'economic', 'social'
    weight DECIMAL(3,2) DEFAULT 1.0, -- For scoring/aggregation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(survey_id, code)
);

COMMENT ON TABLE survey_questions IS 'Individual questions within surveys';
COMMENT ON COLUMN survey_questions.answer_type IS 'single_choice, multiple_choice, scale, text, number, boolean';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order ON survey_questions(survey_id, order_index);

-- ============================================================================
-- SURVEY RUNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS survey_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    territory_id UUID REFERENCES territories(id) ON DELETE SET NULL,
    name VARCHAR(255),
    description TEXT,
    sample_size INTEGER NOT NULL DEFAULT 100,
    run_type VARCHAR(50) DEFAULT 'synthetic' CHECK (run_type IN ('synthetic', 'real', 'hybrid')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    config_json JSONB, -- Engine configuration: {"use_llm": false, "rule_based": true, "temperature": 0.7}
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE survey_runs IS 'Execution instances of surveys';
COMMENT ON COLUMN survey_runs.run_type IS 'synthetic: AI agents, real: humans, hybrid: both';
COMMENT ON COLUMN survey_runs.status IS 'pending, running, completed, failed, cancelled';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_runs_survey ON survey_runs(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_runs_territory ON survey_runs(territory_id);
CREATE INDEX IF NOT EXISTS idx_survey_runs_status ON survey_runs(status);

-- ============================================================================
-- SURVEY RESPONSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES survey_runs(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES synthetic_agents(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    answer_raw TEXT, -- Original answer text
    answer_structured_json JSONB, -- Structured answer: {"value": "3", "label": "Neutral", "confidence": 0.8}
    response_time_ms INTEGER, -- Time taken to answer
    metadata_json JSONB, -- Engine metadata: {"method": "rule_based", "factors": [...]}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(run_id, agent_id, question_id)
);

COMMENT ON TABLE survey_responses IS 'Individual responses from agents to survey questions';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_run ON survey_responses(run_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_agent ON survey_responses(agent_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question ON survey_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created ON survey_responses(created_at);

-- ============================================================================
-- VIEWS FOR CONVENIENT ACCESS
-- ============================================================================

-- View: Active surveys with question count
CREATE OR REPLACE VIEW active_surveys AS
SELECT 
    s.*,
    COUNT(sq.id) as question_count
FROM surveys s
LEFT JOIN survey_questions sq ON s.id = sq.survey_id
WHERE s.status = 'active'
GROUP BY s.id;

-- View: Survey run summary
CREATE OR NULL VIEW survey_run_summary AS
SELECT 
    sr.*,
    s.name as survey_name,
    t.name as territory_name,
    COUNT(DISTINCT sr2.agent_id) as response_count,
    COUNT(DISTINCT sr2.question_id) as questions_answered
FROM survey_runs sr
JOIN surveys s ON sr.survey_id = s.id
LEFT JOIN territories t ON sr.territory_id = t.id
LEFT JOIN survey_responses sr2 ON sr.id = sr2.run_id
GROUP BY sr.id, s.name, t.name;

-- View: Survey results aggregated
CREATE OR REPLACE VIEW survey_results AS
SELECT 
    sr.run_id,
    sr.question_id,
    sq.code as question_code,
    sq.text as question_text,
    sq.answer_type,
    COUNT(*) as response_count,
    -- For scale/number questions
    AVG(CASE 
        WHEN sr.answer_structured_json->>'value' ~ '^[0-9]+\.?[0-9]*$' 
        THEN (sr.answer_structured_json->>'value')::numeric 
        ELSE NULL 
    END) as avg_numeric,
    -- For choice questions
    MODE() WITHIN GROUP (ORDER BY sr.answer_structured_json->>'value') as mode_value
FROM survey_responses sr
JOIN survey_questions sq ON sr.question_id = sq.id
GROUP BY sr.run_id, sr.question_id, sq.code, sq.text, sq.answer_type;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get survey with questions
CREATE OR REPLACE FUNCTION get_survey_with_questions(survey_uuid UUID)
RETURNS TABLE (
    survey_id UUID,
    survey_name VARCHAR,
    survey_description TEXT,
    survey_status VARCHAR,
    question_id UUID,
    question_code VARCHAR,
    question_text TEXT,
    answer_type VARCHAR,
    options_json JSONB,
    order_index INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.status,
        sq.id,
        sq.code,
        sq.text,
        sq.answer_type,
        sq.options_json,
        sq.order_index
    FROM surveys s
    JOIN survey_questions sq ON s.id = sq.survey_id
    WHERE s.id = survey_uuid
    ORDER BY sq.order_index;
END;
$$ LANGUAGE plpgsql;

-- Function: Get agent responses for a run
CREATE OR REPLACE FUNCTION get_run_responses(run_uuid UUID)
RETURNS TABLE (
    response_id UUID,
    agent_id UUID,
    agent_name VARCHAR,
    question_id UUID,
    question_code VARCHAR,
    answer_raw TEXT,
    answer_value TEXT,
    answer_label TEXT,
    confidence DECIMAL,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.id,
        sr.agent_id,
        sa.name,
        sr.question_id,
        sq.code,
        sr.answer_raw,
        sr.answer_structured_json->>'value',
        sr.answer_structured_json->>'label',
        (sr.answer_structured_json->>'confidence')::decimal,
        sr.created_at
    FROM survey_responses sr
    JOIN survey_questions sq ON sr.question_id = sq.id
    JOIN synthetic_agents sa ON sr.agent_id = sa.id
    WHERE sr.run_id = run_uuid
    ORDER BY sr.created_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_surveys_updated_at
    BEFORE UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_questions_updated_at
    BEFORE UPDATE ON survey_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policies for surveys (read-only for anon, full for authenticated)
CREATE POLICY "Allow read surveys" ON surveys
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert surveys" ON surveys
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update surveys" ON surveys
    FOR UPDATE TO authenticated USING (true);

-- Policies for survey questions
CREATE POLICY "Allow read survey questions" ON survey_questions
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert survey questions" ON survey_questions
    FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for survey runs
CREATE POLICY "Allow read survey runs" ON survey_runs
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert survey runs" ON survey_runs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update survey runs" ON survey_runs
    FOR UPDATE TO authenticated USING (true);

-- Policies for survey responses
CREATE POLICY "Allow read survey responses" ON survey_responses
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert survey responses" ON survey_responses
    FOR INSERT TO authenticated WITH CHECK (true);
