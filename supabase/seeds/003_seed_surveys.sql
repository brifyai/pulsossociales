-- ============================================================================
-- SEED 003: Survey Data
-- ============================================================================
-- Purpose: Create sample surveys for testing the survey engine
-- Includes: Political opinion survey with Likert scale questions
-- ============================================================================

-- ============================================================================
-- SURVEY: Political Opinion Barometer 2024
-- ============================================================================
DO $$
DECLARE
    survey_id UUID;
    q1_id UUID;
    q2_id UUID;
    q3_id UUID;
    q4_id UUID;
    q5_id UUID;
BEGIN
    -- Create survey
    INSERT INTO surveys (id, name, description, status, category, version)
    VALUES (
        gen_random_uuid(),
        'Barómetro Político Chile 2024',
        'Encuesta de opinión pública sobre temas políticos y sociales actuales',
        'active',
        'political',
        1
    )
    RETURNING id INTO survey_id;

    -- Question 1: Approval of current government
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json, scale_config, 
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'GOV_APPROVAL',
        '¿Cómo evalúa la gestión del gobierno actual?',
        'scale',
        NULL,
        '{"min": 1, "max": 7, "step": 1, "labels": {"1": "Muy mala", "2": "Mala", "3": "Algo mala", "4": "Regular", "5": "Algo buena", "6": "Buena", "7": "Muy buena"}}'::jsonb,
        1,
        'political',
        1.0
    )
    RETURNING id INTO q1_id;

    -- Question 2: Economic situation
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json, scale_config,
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'ECON_SITUATION',
        '¿Cómo describiría la situación económica actual del país?',
        'scale',
        NULL,
        '{"min": 1, "max": 5, "step": 1, "labels": {"1": "Muy mala", "2": "Mala", "3": "Regular", "4": "Buena", "5": "Muy buena"}}'::jsonb,
        2,
        'economic',
        1.0
    )
    RETURNING id INTO q2_id;

    -- Question 3: Trust in institutions
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json,
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'INSTITUTION_TRUST',
        '¿En cuál de estas instituciones confía más?',
        'single_choice',
        '[
            {"value": "congress", "label": "Congreso Nacional"},
            {"value": "judiciary", "label": "Poder Judicial"},
            {"value": "presidency", "label": "Presidencia"},
            {"value": "media", "label": "Medios de comunicación"},
            {"value": "none", "label": "Ninguna"}
        ]'::jsonb,
        3,
        'political',
        0.8
    )
    RETURNING id INTO q3_id;

    -- Question 4: Priority issues
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json,
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'PRIORITY_ISSUE',
        '¿Cuál debería ser la prioridad principal del gobierno?',
        'single_choice',
        '[
            {"value": "security", "label": "Seguridad ciudadana"},
            {"value": "economy", "label": "Crecimiento económico"},
            {"value": "health", "label": "Salud pública"},
            {"value": "education", "label": "Educación"},
            {"value": "pensions", "label": "Reforma previsional"},
            {"value": "environment", "label": "Medio ambiente"}
        ]'::jsonb,
        4,
        'social',
        1.0
    )
    RETURNING id INTO q4_id;

    -- Question 5: Political self-identification
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json,
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'POLITICAL_ID',
        '¿Cómo se identifica políticamente?',
        'single_choice',
        '[
            {"value": "left", "label": "Izquierda"},
            {"value": "center_left", "label": "Centro-izquierda"},
            {"value": "center", "label": "Centro"},
            {"value": "center_right", "label": "Centro-derecha"},
            {"value": "right", "label": "Derecha"},
            {"value": "none", "label": "Ninguno / Independiente"}
        ]'::jsonb,
        5,
        'political',
        0.9
    )
    RETURNING id INTO q5_id;

    -- Store survey_id for reference (optional, for debugging)
    RAISE NOTICE 'Created survey: % with questions: %, %, %, %, %', 
        survey_id, q1_id, q2_id, q3_id, q4_id, q5_id;

END $$;

-- ============================================================================
-- SURVEY: Social Values Survey
-- ============================================================================
DO $$
DECLARE
    survey_id UUID;
BEGIN
    INSERT INTO surveys (id, name, description, status, category, version)
    VALUES (
        gen_random_uuid(),
        'Valores Sociales 2024',
        'Encuesta sobre valores, actitudes y percepciones sociales',
        'active',
        'social',
        1
    )
    RETURNING id INTO survey_id;

    -- Question 1: Traditional vs Progressive
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json, scale_config,
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'VALUES_TRAD_PROG',
        'En una escala de tradicional a progresista, ¿dónde se ubica?',
        'scale',
        NULL,
        '{"min": 1, "max": 7, "step": 1, "labels": {"1": "Muy tradicional", "2": "Tradicional", "3": "Algo tradicional", "4": "Neutral", "5": "Algo progresista", "6": "Progresista", "7": "Muy progresista"}}'::jsonb,
        1,
        'social',
        1.0
    );

    -- Question 2: Individual vs Collective
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json, scale_config,
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'VALUES_IND_COL',
        '¿Prioriza más el bienestar individual o el colectivo?',
        'scale',
        NULL,
        '{"min": 1, "max": 5, "step": 1, "labels": {"1": "Totalmente individual", "2": "Más individual", "3": "Equilibrado", "4": "Más colectivo", "5": "Totalmente colectivo"}}'::jsonb,
        2,
        'social',
        0.9
    );

    -- Question 3: Change vs Stability
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json,
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'VALUES_CHANGE',
        '¿Prefiere mantener las tradiciones o adoptar cambios?',
        'single_choice',
        '[
            {"value": "maintain", "label": "Mantener tradiciones establecidas"},
            {"value": "gradual", "label": "Cambios graduales y cautelosos"},
            {"value": "balanced", "label": "Equilibrio entre tradición y cambio"},
            {"value": "reform", "label": "Reformas significativas"},
            {"value": "radical", "label": "Cambios radicales necesarios"}
        ]'::jsonb,
        3,
        'social',
        0.8
    );

    RAISE NOTICE 'Created social values survey: %', survey_id;

END $$;

-- ============================================================================
-- SURVEY: Economic Perception
-- ============================================================================
DO $$
DECLARE
    survey_id UUID;
BEGIN
    INSERT INTO surveys (id, name, description, status, category, version)
    VALUES (
        gen_random_uuid(),
        'Percepción Económica 2024',
        'Encuesta sobre percepción económica personal y nacional',
        'draft',
        'economic',
        1
    )
    RETURNING id INTO survey_id;

    -- Question 1: Personal economic situation
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json,
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'ECON_PERSONAL',
        '¿Cómo describiría su situación económica personal actual?',
        'single_choice',
        '[
            {"value": "very_bad", "label": "Muy mala"},
            {"value": "bad", "label": "Mala"},
            {"value": "regular", "label": "Regular"},
            {"value": "good", "label": "Buena"},
            {"value": "very_good", "label": "Muy buena"}
        ]'::jsonb,
        1,
        'economic',
        1.0
    );

    -- Question 2: Future expectations
    INSERT INTO survey_questions (
        id, survey_id, code, text, answer_type, options_json,
        order_index, category, weight
    ) VALUES (
        gen_random_uuid(),
        survey_id,
        'ECON_FUTURE',
        'En los próximos 12 meses, espera que su situación económica...',
        'single_choice',
        '[
            {"value": "much_worse", "label": "Empeore mucho"},
            {"value": "worse", "label": "Empeore"},
            {"value": "same", "label": "Se mantenga igual"},
            {"value": "better", "label": "Mejore"},
            {"value": "much_better", "label": "Mejore mucho"}
        ]'::jsonb,
        2,
        'economic',
        1.0
    );

    RAISE NOTICE 'Created economic perception survey: %', survey_id;

END $$;
