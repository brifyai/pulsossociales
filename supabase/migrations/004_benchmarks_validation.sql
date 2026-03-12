-- ============================================================================
-- MIGRATION 004: Benchmarks and Validation System
-- ============================================================================
-- Purpose: Create tables for persistent benchmarks and historical validations
-- Tables: survey_benchmarks, benchmark_data_points, validation_runs, validation_results
-- ============================================================================

-- ============================================================================
-- 1. SURVEY_BENCHMARKS - Benchmark sources/waves
-- ============================================================================
CREATE TABLE IF NOT EXISTS survey_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Source information
    source VARCHAR(100) NOT NULL,           -- 'CEP', 'CADEM', 'Pulso Ciudadano', etc.
    source_wave VARCHAR(50),                -- 'Oct 2024', 'Wave 3', etc.
    source_url TEXT,                        -- Link to original publication
    
    -- Timing
    field_date_start DATE,                  -- When the fieldwork started
    field_date_end DATE,                    -- When the fieldwork ended
    publication_date DATE,                  -- When results were published
    
    -- Methodology
    sample_size INTEGER,
    margin_of_error NUMERIC(4,2),           -- e.g., 3.0 for ±3%
    confidence_level NUMERIC(4,2) DEFAULT 95.0, -- Usually 95%
    methodology TEXT,                       -- Brief description of methodology
    territory_scope TEXT DEFAULT 'national' CHECK (territory_scope IN ('national', 'regional', 'communal')),
    territory_id TEXT REFERENCES territories(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'deprecated')),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for survey_benchmarks
CREATE INDEX IF NOT EXISTS idx_benchmarks_source ON survey_benchmarks(source);
CREATE INDEX IF NOT EXISTS idx_benchmarks_status ON survey_benchmarks(status);
CREATE INDEX IF NOT EXISTS idx_benchmarks_territory ON survey_benchmarks(territory_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_dates ON survey_benchmarks(field_date_end DESC);

COMMENT ON TABLE survey_benchmarks IS 'Official benchmark sources for validation (CEP, CADEM, etc.)';
COMMENT ON COLUMN survey_benchmarks.source IS 'Organization that conducted the survey';
COMMENT ON COLUMN survey_benchmarks.source_wave IS 'Specific wave or edition identifier';
COMMENT ON COLUMN survey_benchmarks.margin_of_error IS 'Statistical margin of error in percentage points';

-- ============================================================================
-- 2. BENCHMARK_DATA_POINTS - Benchmark data per question
-- ============================================================================
CREATE TABLE IF NOT EXISTS benchmark_data_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    benchmark_id UUID NOT NULL REFERENCES survey_benchmarks(id) ON DELETE CASCADE,
    
    -- Question identification
    question_code VARCHAR(100) NOT NULL,
    question_text TEXT,
    question_category VARCHAR(100),         -- 'political', 'economic', 'social', etc.
    
    -- Answer type and options
    answer_type VARCHAR(50) CHECK (answer_type IN ('single_choice', 'multiple_choice', 'scale', 'text', 'number', 'boolean')),
    options_json JSONB,                     -- Available options: [{"value": "1", "label": "Muy de acuerdo"}, ...]
    
    -- The actual benchmark distribution
    -- Format depends on answer_type:
    -- - single_choice/multiple_choice: {"1": 45.2, "2": 30.5, "3": 24.3} (percentages)
    -- - scale: {"mean": 5.2, "std": 1.8, "distribution": {"1": 5, "2": 15, ...}}
    -- - boolean: {"true": 65.0, "false": 35.0}
    distribution_json JSONB NOT NULL,
    
    -- Sample size for this specific question (may differ from benchmark total due to filtering)
    sample_size INTEGER,
    
    -- Optional metadata
    metadata_json JSONB,                    -- Additional data: subgroups, trends, etc.
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one data point per benchmark + question
    UNIQUE(benchmark_id, question_code)
);

-- Indexes for benchmark_data_points
CREATE INDEX IF NOT EXISTS idx_data_points_benchmark ON benchmark_data_points(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_data_points_code ON benchmark_data_points(question_code);
CREATE INDEX IF NOT EXISTS idx_data_points_category ON benchmark_data_points(question_category);

COMMENT ON TABLE benchmark_data_points IS 'Individual question data points within a benchmark';
COMMENT ON COLUMN benchmark_data_points.distribution_json IS 'Benchmark distribution as percentages or statistics';
COMMENT ON COLUMN benchmark_data_points.metadata_json IS 'Optional additional data like subgroup breakdowns';

-- ============================================================================
-- 3. VALIDATION_RUNS - Executed validations
-- ============================================================================
CREATE TABLE IF NOT EXISTS validation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    survey_run_id UUID REFERENCES survey_runs(id) ON DELETE SET NULL,  -- Optional: link to actual run
    benchmark_id UUID NOT NULL REFERENCES survey_benchmarks(id) ON DELETE CASCADE,
    territory_id TEXT REFERENCES territories(id) ON DELETE SET NULL,
    
    -- Engine information
    engine_version VARCHAR(20) NOT NULL DEFAULT '2.0.0',
    engine_config_json JSONB,               -- Configuration used: {use_llm, use_rules, random_variation, ...}
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Overall metrics (aggregated from validation_results)
    average_similarity_score NUMERIC(5,4),  -- 0-1, higher is better
    average_mae NUMERIC(5,4),               -- Mean Absolute Error across all questions
    average_rmse NUMERIC(5,4),              -- Root Mean Square Error
    weighted_similarity_score NUMERIC(5,4), -- Weighted by question importance
    
    -- Question coverage
    total_questions INTEGER DEFAULT 0,
    matched_questions INTEGER DEFAULT 0,    -- Questions that could be compared
    
    -- Sample information
    synthetic_sample_size INTEGER,          -- Number of synthetic responses
    benchmark_sample_size INTEGER,          -- Original benchmark sample size
    
    -- Summary
    summary_json JSONB,                     -- High-level summary: best/worst questions, trends, etc.
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for validation_runs
CREATE INDEX IF NOT EXISTS idx_validation_runs_survey ON validation_runs(survey_id);
CREATE INDEX IF NOT EXISTS idx_validation_runs_benchmark ON validation_runs(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_validation_runs_status ON validation_runs(status);
CREATE INDEX IF NOT EXISTS idx_validation_runs_territory ON validation_runs(territory_id);
CREATE INDEX IF NOT EXISTS idx_validation_runs_dates ON validation_runs(created_at DESC);

COMMENT ON TABLE validation_runs IS 'Executed validation comparisons between synthetic and benchmark data';
COMMENT ON COLUMN validation_runs.average_similarity_score IS 'Overall similarity score (0-1) across all matched questions';
COMMENT ON COLUMN validation_runs.average_mae IS 'Mean Absolute Error in percentage points';
COMMENT ON COLUMN validation_runs.engine_config_json IS 'Engine configuration snapshot for reproducibility';

-- ============================================================================
-- 4. VALIDATION_RESULTS - Per-question validation details
-- ============================================================================
CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationship
    validation_run_id UUID NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,
    
    -- Question identification
    question_code VARCHAR(100) NOT NULL,
    question_text TEXT,
    question_category VARCHAR(100),
    
    -- Distributions being compared
    synthetic_distribution_json JSONB NOT NULL,  -- Our synthetic results: {"1": 42.5, "2": 31.2, ...}
    benchmark_distribution_json JSONB NOT NULL,  -- Benchmark data: {"1": 45.0, "2": 30.0, ...}
    
    -- Comparison metrics
    mae NUMERIC(5,4),                       -- Mean Absolute Error (average of absolute differences)
    rmse NUMERIC(5,4),                      -- Root Mean Square Error
    max_absolute_error NUMERIC(5,4),        -- Maximum difference for any option
    
    -- Similarity scores
    similarity_score NUMERIC(5,4),          -- Overall similarity (0-1)
    cosine_similarity NUMERIC(5,4),         -- Cosine similarity of distributions
    correlation_coefficient NUMERIC(5,4),   -- Pearson correlation
    
    -- Option-level analysis
    option_match_quality NUMERIC(5,4),      -- How well options align (0-1)
    best_matching_option VARCHAR(100),      -- Option with smallest difference
    worst_matching_option VARCHAR(100),     -- Option with largest difference
    
    -- Detailed comparison
    option_differences_json JSONB,          -- Per-option differences: {"1": -2.5, "2": 1.2, ...}
    
    -- Statistical tests (optional)
    chi_square_statistic NUMERIC(10,4),
    chi_square_p_value NUMERIC(10,6),
    
    -- Classification
    match_quality VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN similarity_score >= 0.90 THEN 'excellent'
            WHEN similarity_score >= 0.80 THEN 'good'
            WHEN similarity_score >= 0.70 THEN 'fair'
            WHEN similarity_score >= 0.60 THEN 'poor'
            ELSE 'critical'
        END
    ) STORED,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one result per validation run + question
    UNIQUE(validation_run_id, question_code)
);

-- Indexes for validation_results
CREATE INDEX IF NOT EXISTS idx_validation_results_run ON validation_results(validation_run_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_code ON validation_results(question_code);
CREATE INDEX IF NOT EXISTS idx_validation_results_category ON validation_results(question_category);
CREATE INDEX IF NOT EXISTS idx_validation_results_quality ON validation_results(match_quality);
CREATE INDEX IF NOT EXISTS idx_validation_results_similarity ON validation_results(similarity_score DESC);

COMMENT ON TABLE validation_results IS 'Detailed per-question validation results';
COMMENT ON COLUMN validation_results.synthetic_distribution_json IS 'Synthetic agent responses as percentages';
COMMENT ON COLUMN validation_results.benchmark_distribution_json IS 'Official benchmark distribution';
COMMENT ON COLUMN validation_results.similarity_score IS 'Overall similarity score (0-1, higher is better)';
COMMENT ON COLUMN validation_results.match_quality IS 'Categorical quality: excellent/good/fair/poor/critical';

-- ============================================================================
-- 5. VIEWS FOR CONVENIENT ACCESS
-- ============================================================================

-- View: Active benchmarks with data point count
CREATE OR REPLACE VIEW active_benchmarks AS
SELECT 
    sb.*,
    COUNT(bdp.id) as question_count,
    t.name as territory_name
FROM survey_benchmarks sb
LEFT JOIN benchmark_data_points bdp ON sb.id = bdp.benchmark_id
LEFT JOIN territories t ON sb.territory_id = t.id
WHERE sb.status = 'active'
GROUP BY sb.id, t.name;

-- View: Validation run summary with benchmark and survey info
CREATE OR REPLACE VIEW validation_run_summary AS
SELECT 
    vr.*,
    s.name as survey_name,
    sb.name as benchmark_name,
    sb.source as benchmark_source,
    sb.source_wave as benchmark_wave,
    t.name as territory_name,
    COUNT(vres.id) as results_count,
    COUNT(CASE WHEN vres.match_quality = 'excellent' THEN 1 END) as excellent_matches,
    COUNT(CASE WHEN vres.match_quality = 'good' THEN 1 END) as good_matches,
    COUNT(CASE WHEN vres.match_quality = 'fair' THEN 1 END) as fair_matches,
    COUNT(CASE WHEN vres.match_quality = 'poor' THEN 1 END) as poor_matches,
    COUNT(CASE WHEN vres.match_quality = 'critical' THEN 1 END) as critical_matches
FROM validation_runs vr
JOIN surveys s ON vr.survey_id = s.id
JOIN survey_benchmarks sb ON vr.benchmark_id = sb.id
LEFT JOIN territories t ON vr.territory_id = t.id
LEFT JOIN validation_results vres ON vr.id = vres.validation_run_id
GROUP BY vr.id, s.name, sb.name, sb.source, sb.source_wave, t.name;

-- View: Validation results with run context
CREATE OR REPLACE VIEW validation_result_details AS
SELECT 
    vres.*,
    vr.survey_id,
    vr.benchmark_id,
    vr.engine_version,
    vr.status as run_status,
    sb.name as benchmark_name,
    sb.source as benchmark_source
FROM validation_results vres
JOIN validation_runs vr ON vres.validation_run_id = vr.id
JOIN survey_benchmarks sb ON vr.benchmark_id = sb.id;

-- ============================================================================
-- 6. FUNCTIONS
-- ============================================================================

-- Function: Get benchmark data for a specific question
CREATE OR REPLACE FUNCTION get_benchmark_data(
    p_benchmark_id UUID,
    p_question_code VARCHAR
)
RETURNS TABLE (
    question_code VARCHAR,
    question_text TEXT,
    answer_type VARCHAR,
    distribution_json JSONB,
    sample_size INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bdp.question_code,
        bdp.question_text,
        bdp.answer_type,
        bdp.distribution_json,
        bdp.sample_size
    FROM benchmark_data_points bdp
    WHERE bdp.benchmark_id = p_benchmark_id
      AND bdp.question_code = p_question_code;
END;
$$ LANGUAGE plpgsql;

-- Function: Get validation history for a survey
CREATE OR REPLACE FUNCTION get_survey_validation_history(p_survey_id UUID)
RETURNS TABLE (
    validation_id UUID,
    benchmark_name VARCHAR,
    benchmark_source VARCHAR,
    status VARCHAR,
    average_similarity_score NUMERIC,
    average_mae NUMERIC,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vr.id,
        sb.name,
        sb.source,
        vr.status,
        vr.average_similarity_score,
        vr.average_mae,
        vr.created_at
    FROM validation_runs vr
    JOIN survey_benchmarks sb ON vr.benchmark_id = sb.id
    WHERE vr.survey_id = p_survey_id
    ORDER BY vr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate similarity score between two distributions
CREATE OR REPLACE FUNCTION calculate_distribution_similarity(
    dist1 JSONB,
    dist2 JSONB
)
RETURNS NUMERIC AS $$
DECLARE
    keys TEXT[];
    key TEXT;
    val1 NUMERIC;
    val2 NUMERIC;
    sum_abs_diff NUMERIC := 0;
    count INTEGER := 0;
BEGIN
    -- Get all unique keys from both distributions
    SELECT ARRAY_AGG(DISTINCT k) INTO keys
    FROM (
        SELECT jsonb_object_keys(dist1) as k
        UNION
        SELECT jsonb_object_keys(dist2) as k
    ) sub;
    
    IF keys IS NULL OR array_length(keys, 1) IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate mean absolute difference
    FOREACH key IN ARRAY keys
    LOOP
        val1 := COALESCE((dist1->>key)::NUMERIC, 0);
        val2 := COALESCE((dist2->>key)::NUMERIC, 0);
        sum_abs_diff := sum_abs_diff + ABS(val1 - val2);
        count := count + 1;
    END LOOP;
    
    -- Convert to similarity score (0-1, higher is better)
    -- Max possible MAE is 100 (if one is 100% and other is 0% for all options)
    RETURN GREATEST(0, 1 - (sum_abs_diff / 100));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Reuse the update_updated_at_column function from previous migrations
-- It should already exist, but create it if not
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_survey_benchmarks_updated_at ON survey_benchmarks;
CREATE TRIGGER update_survey_benchmarks_updated_at
    BEFORE UPDATE ON survey_benchmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_benchmark_data_points_updated_at ON benchmark_data_points;
CREATE TRIGGER update_benchmark_data_points_updated_at
    BEFORE UPDATE ON benchmark_data_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_validation_runs_updated_at ON validation_runs;
CREATE TRIGGER update_validation_runs_updated_at
    BEFORE UPDATE ON validation_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_validation_results_updated_at ON validation_results;
CREATE TRIGGER update_validation_results_updated_at
    BEFORE UPDATE ON validation_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE survey_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;

-- Policies: Allow read access to authenticated users
DROP POLICY IF EXISTS "Allow read survey_benchmarks" ON survey_benchmarks;
CREATE POLICY "Allow read survey_benchmarks" ON survey_benchmarks
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow read benchmark_data_points" ON benchmark_data_points;
CREATE POLICY "Allow read benchmark_data_points" ON benchmark_data_points
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow read validation_runs" ON validation_runs;
CREATE POLICY "Allow read validation_runs" ON validation_runs
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow read validation_results" ON validation_results;
CREATE POLICY "Allow read validation_results" ON validation_results
    FOR SELECT TO authenticated, anon USING (true);

-- Policies: Allow write access to authenticated users only
DROP POLICY IF EXISTS "Allow insert survey_benchmarks" ON survey_benchmarks;
CREATE POLICY "Allow insert survey_benchmarks" ON survey_benchmarks
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update survey_benchmarks" ON survey_benchmarks;
CREATE POLICY "Allow update survey_benchmarks" ON survey_benchmarks
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert benchmark_data_points" ON benchmark_data_points;
CREATE POLICY "Allow insert benchmark_data_points" ON benchmark_data_points
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert validation_runs" ON validation_runs;
CREATE POLICY "Allow insert validation_runs" ON validation_runs
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update validation_runs" ON validation_runs;
CREATE POLICY "Allow update validation_runs" ON validation_runs
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert validation_results" ON validation_results;
CREATE POLICY "Allow insert validation_results" ON validation_results
    FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_benchmark_data IS 'Retrieve benchmark data for a specific question';
COMMENT ON FUNCTION get_survey_validation_history IS 'Get validation history for a survey ordered by date';
COMMENT ON FUNCTION calculate_distribution_similarity IS 'Calculate similarity score (0-1) between two distributions';
