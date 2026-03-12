-- ============================================================================
-- SEED 004: Benchmarks and Validation Sample Data
-- ============================================================================
-- Purpose: Provide sample benchmark data for testing and development
-- Includes: CEP Oct 2024 sample data with key political questions
-- ============================================================================

-- ============================================================================
-- 1. SAMPLE BENCHMARK: CEP Octubre 2024
-- ============================================================================

-- Insert the benchmark
INSERT INTO survey_benchmarks (
    id,
    name,
    description,
    source,
    source_wave,
    source_url,
    field_date_start,
    field_date_end,
    publication_date,
    sample_size,
    margin_of_error,
    confidence_level,
    methodology,
    territory_scope,
    territory_id,
    status,
    notes,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'CEP Octubre 2024 - Estudio Nacional de Opinión Pública',
    'Estudio de opinión pública nacional realizado por el Centro de Estudios Públicos en octubre de 2024. Incluye evaluación de gobierno, preferencias presidenciales y temas de actualidad.',
    'CEP',
    'Oct 2024',
    'https://www.cepchile.cl/estudio-nacional-de-opinion-publica-octubre-2024/',
    '2024-10-01',
    '2024-10-15',
    '2024-10-25',
    1460,
    2.6,
    95.0,
    'Encuesta telefónica asistida por computador (CATI) a nivel nacional. Muestra probabilística, estratificada, multietápica y bietápica.',
    'national',
    NULL, -- national scope, no specific territory
    'active',
    'Datos de ejemplo para desarrollo y testing. No usar para análisis real.',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- 2. BENCHMARK DATA POINTS: Key Questions
-- ============================================================================

-- Question 1: Evaluación del Gobierno
INSERT INTO benchmark_data_points (
    id,
    benchmark_id,
    question_code,
    question_text,
    question_category,
    answer_type,
    options_json,
    distribution_json,
    sample_size,
    metadata_json,
    notes,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'CEP_OCT_2024_Q1',
    'Independiente de su posición política, ¿cómo evalúa la gestión del gobierno del Presidente Gabriel Boric?',
    'political',
    'single_choice',
    '[
        {"value": "1", "label": "Muy bien"},
        {"value": "2", "label": "Bien"},
        {"value": "3", "label": "Ni bien ni mal / Regular"},
        {"value": "4", "label": "Mal"},
        {"value": "5", "label": "Muy mal"},
        {"value": "6", "label": "No sabe"},
        {"value": "7", "label": "No responde"}
    ]'::jsonb,
    '{
        "1": 3.0,
        "2": 15.0,
        "3": 18.0,
        "4": 28.0,
        "5": 35.0,
        "6": 1.0,
        "7": 0.0
    }'::jsonb,
    1460,
    '{
        "approval_rate": 18.0,
        "disapproval_rate": 63.0,
        "neutral_rate": 18.0,
        "trend_vs_previous": -2.0
    }'::jsonb,
    'Evaluación presidencial. Aprobación: 18%, Desaprobación: 63%',
    NOW()
)
ON CONFLICT (benchmark_id, question_code) DO UPDATE SET
    distribution_json = EXCLUDED.distribution_json,
    updated_at = NOW();

-- Question 2: Preferencia Presidencial (primera vuelta)
INSERT INTO benchmark_data_points (
    id,
    benchmark_id,
    question_code,
    question_text,
    question_category,
    answer_type,
    options_json,
    distribution_json,
    sample_size,
    metadata_json,
    notes,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'CEP_OCT_2024_Q2',
    'Si las elecciones presidenciales fueran hoy, ¿por quién votaría usted en primera vuelta?',
    'political',
    'single_choice',
    '[
        {"value": "1", "label": "José Antonio Kast"},
        {"value": "2", "label": "Sebastián Sichel"},
        {"value": "3", "label": "Evelyn Matthei"},
        {"value": "4", "label": "Rodrigo Delgado"},
        {"value": "5", "label": "Claudio Orrego"},
        {"value": "6", "label": "Michelle Bachelet"},
        {"value": "7", "label": "Carolina Tohá"},
        {"value": "8", "label": "Maya Fernández"},
        {"value": "9", "label": "Daniel Jadue"},
        {"value": "10", "label": "Franco Parisi"},
        {"value": "11", "label": "Otro"},
        {"value": "12", "label": "Ninguno/En blanco"},
        {"value": "13", "label": "No sabe"},
        {"value": "14", "label": "No responde"}
    ]'::jsonb,
    '{
        "1": 18.0,
        "2": 4.0,
        "3": 12.0,
        "4": 3.0,
        "5": 8.0,
        "6": 6.0,
        "7": 4.0,
        "8": 2.0,
        "9": 5.0,
        "10": 3.0,
        "11": 2.0,
        "12": 8.0,
        "13": 22.0,
        "14": 3.0
    }'::jsonb,
    1460,
    '{
        "top_candidate": "José Antonio Kast",
        "top_percentage": 18.0,
        "undecided": 22.0,
        "blank_null": 8.0
    }'::jsonb,
    'Intención de voto primera vuelta. Kast lidera con 18%, 22% indecisos',
    NOW()
)
ON CONFLICT (benchmark_id, question_code) DO UPDATE SET
    distribution_json = EXCLUDED.distribution_json,
    updated_at = NOW();

-- Question 3: Problemas del País (múltiple choice)
INSERT INTO benchmark_data_points (
    id,
    benchmark_id,
    question_code,
    question_text,
    question_category,
    answer_type,
    options_json,
    distribution_json,
    sample_size,
    metadata_json,
    notes,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'CEP_OCT_2024_Q3',
    '¿Cuáles son los principales problemas que afectan al país? (Máximo 3 respuestas)',
    'social',
    'multiple_choice',
    '[
        {"value": "1", "label": "Delincuencia / Inseguridad"},
        {"value": "2", "label": "Inflación / Costo de vida"},
        {"value": "3", "label": "Desempleo"},
        {"value": "4", "label": "Salud"},
        {"value": "5", "label": "Educación"},
        {"value": "6", "label": "Pensiones"},
        {"value": "7", "label": "Corrupción"},
        {"value": "8", "label": "Inmigración"},
        {"value": "9", "label": "Conflictos sociales"},
        {"value": "10", "label": "Medio ambiente"}
    ]'::jsonb,
    '{
        "1": 42.0,
        "2": 38.0,
        "3": 15.0,
        "4": 12.0,
        "5": 8.0,
        "6": 6.0,
        "7": 5.0,
        "8": 4.0,
        "9": 3.0,
        "10": 2.0
    }'::jsonb,
    1460,
    '{
        "top_problem": "Delincuencia / Inseguridad",
        "top_percentage": 42.0,
        "second_problem": "Inflación / Costo de vida",
        "second_percentage": 38.0
    }'::jsonb,
    'Problemas del país. Delincuencia (42%) e Inflación (38%) lideran',
    NOW()
)
ON CONFLICT (benchmark_id, question_code) DO UPDATE SET
    distribution_json = EXCLUDED.distribution_json,
    updated_at = NOW();

-- Question 4: Satisfacción con la Democracia
INSERT INTO benchmark_data_points (
    id,
    benchmark_id,
    question_code,
    question_text,
    question_category,
    answer_type,
    options_json,
    distribution_json,
    sample_size,
    metadata_json,
    notes,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000001',
    'CEP_OCT_2024_Q4',
    'En general, ¿está usted muy satisfecho, satisfecho, poco satisfecho o nada satisfecho con el funcionamiento de la democracia en Chile?',
    'political',
    'single_choice',
    '[
        {"value": "1", "label": "Muy satisfecho"},
        {"value": "2", "label": "Satisfecho"},
        {"value": "3", "label": "Poco satisfecho"},
        {"value": "4", "label": "Nada satisfecho"},
        {"value": "5", "label": "No sabe"},
        {"value": "6", "label": "No responde"}
    ]'::jsonb,
    '{
        "1": 2.0,
        "2": 18.0,
        "3": 35.0,
        "4": 43.0,
        "5": 2.0,
        "6": 0.0
    }'::jsonb,
    1460,
    '{
        "satisfied": 20.0,
        "dissatisfied": 78.0,
        "trend_vs_previous": -5.0
    }'::jsonb,
    'Satisfacción con democracia. 20% satisfechos, 78% insatisfechos',
    NOW()
)
ON CONFLICT (benchmark_id, question_code) DO UPDATE SET
    distribution_json = EXCLUDED.distribution_json,
    updated_at = NOW();

-- Question 5: Confianza en Instituciones (escala 1-7)
INSERT INTO benchmark_data_points (
    id,
    benchmark_id,
    question_code,
    question_text,
    question_category,
    answer_type,
    options_json,
    distribution_json,
    sample_size,
    metadata_json,
    notes,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000105',
    '00000000-0000-0000-0000-000000000001',
    'CEP_OCT_2024_Q5',
    '¿Cuánta confianza tiene usted en el Congreso Nacional? (1 = Ninguna, 7 = Mucha)',
    'political',
    'scale',
    '[
        {"value": "1", "label": "1 - Ninguna"},
        {"value": "2", "label": "2"},
        {"value": "3", "label": "3"},
        {"value": "4", "label": "4"},
        {"value": "5", "label": "5"},
        {"value": "6", "label": "6"},
        {"value": "7", "label": "7 - Mucha"}
    ]'::jsonb,
    '{
        "mean": 2.8,
        "std": 1.4,
        "distribution": {
            "1": 28.0,
            "2": 22.0,
            "3": 18.0,
            "4": 15.0,
            "5": 10.0,
            "6": 5.0,
            "7": 2.0
        }
    }'::jsonb,
    1460,
    '{
        "low_confidence": 68.0,
        "high_confidence": 17.0,
        "institution": "Congreso Nacional"
    }'::jsonb,
    'Confianza en Congreso. Media: 2.8/7, 68% baja confianza (1-3)',
    NOW()
)
ON CONFLICT (benchmark_id, question_code) DO UPDATE SET
    distribution_json = EXCLUDED.distribution_json,
    updated_at = NOW();

-- ============================================================================
-- 3. SAMPLE VALIDATION RUN (for testing)
-- ============================================================================

-- Note: This requires an existing survey. 
-- Uncomment and modify when you have a survey to link to:

/*
INSERT INTO validation_runs (
    id,
    survey_id,
    benchmark_id,
    territory_id,
    engine_version,
    engine_config_json,
    status,
    started_at,
    completed_at,
    average_similarity_score,
    average_mae,
    average_rmse,
    weighted_similarity_score,
    total_questions,
    matched_questions,
    synthetic_sample_size,
    benchmark_sample_size,
    summary_json,
    notes,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000201',
    'YOUR_SURVEY_ID_HERE',  -- Replace with actual survey ID
    '00000000-0000-0000-0000-000000000001',
    NULL,
    '2.0.0',
    '{
        "use_llm": true,
        "use_rules": true,
        "random_variation": 0.1,
        "temperature": 0.7
    }'::jsonb,
    'completed',
    NOW() - INTERVAL '1 hour',
    NOW(),
    0.82,
    4.5,
    5.8,
    0.85,
    5,
    5,
    1000,
    1460,
    '{
        "best_question": "CEP_OCT_2024_Q1",
        "best_similarity": 0.91,
        "worst_question": "CEP_OCT_2024_Q5",
        "worst_similarity": 0.68,
        "overall_assessment": "good"
    }'::jsonb,
    'Ejemplo de validación completada para testing',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Sample validation results
INSERT INTO validation_results (
    id,
    validation_run_id,
    question_code,
    question_text,
    question_category,
    synthetic_distribution_json,
    benchmark_distribution_json,
    mae,
    rmse,
    max_absolute_error,
    similarity_score,
    cosine_similarity,
    correlation_coefficient,
    option_match_quality,
    best_matching_option,
    worst_matching_option,
    option_differences_json,
    notes,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    'CEP_OCT_2024_Q1',
    'Evaluación del gobierno',
    'political',
    '{"1": 4.0, "2": 16.0, "3": 17.0, "4": 29.0, "5": 33.0, "6": 1.0, "7": 0.0}',
    '{"1": 3.0, "2": 15.0, "3": 18.0, "4": 28.0, "5": 35.0, "6": 1.0, "7": 0.0}',
    1.0,
    1.2,
    2.0,
    0.91,
    0.99,
    0.98,
    1.0,
    '4',
    '5',
    '{"1": 1.0, "2": 1.0, "3": -1.0, "4": 1.0, "5": -2.0, "6": 0.0, "7": 0.0}',
    'Excelente match en evaluación presidencial',
    NOW()
)
ON CONFLICT (validation_run_id, question_code) DO NOTHING;
*/

-- ============================================================================
-- 4. DOCUMENTATION
-- ============================================================================

-- Add comments about the seed data
COMMENT ON TABLE survey_benchmarks IS 
    'Official benchmark sources for validation. Sample data: CEP Oct 2024 included for testing.';

-- ============================================================================
-- END OF SEED
-- ============================================================================
