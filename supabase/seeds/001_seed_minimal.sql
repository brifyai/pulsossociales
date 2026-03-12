-- ============================================================================
-- SEEDS MÍNIMOS: Datos iniciales para desarrollo
-- ============================================================================
-- Objetivo: Poblar tablas con datos de prueba basados en mocks existentes
-- Incluye: Territorio raíz (Chile), 4 regiones, 12 agentes con perfiles, rasgos, memorias y estados
-- ============================================================================

-- ============================================================================
-- 1. TERRITORIES - Territorio raíz (Chile) + 4 regiones representativas
-- ============================================================================

INSERT INTO territories (
    id, name, short_name, parent_id, level, macro_zone, capital,
    population, area_km2, map_x, map_y, map_radius,
    population_score, event_score, survey_score, result_score,
    iso_code, ine_code
) VALUES
-- Territorio raíz: Chile (país)
(
    'chile',
    'República de Chile',
    'Chile',
    NULL,
    'country',
    NULL,
    'Santiago',
    19678363,
    756102,
    42, 78, 8,
    100, 100, 100, 100,
    'CL',
    NULL
),
-- Región Metropolitana (la más poblada)
(
    'metropolitana',
    'Región Metropolitana de Santiago',
    'Metropolitana',
    'chile',
    'region',
    'centro',
    'Santiago',
    7307000,
    15403,
    42, 78, 6,
    100, 90, 85, 80,
    'CL-RM',
    '13'
),
-- Región de Valparaíso (segunda más poblada)
(
    'valparaiso',
    'Región de Valparaíso',
    'Valparaíso',
    'chile',
    'region',
    'centro',
    'Valparaíso',
    1971000,
    16396,
    38, 68, 5,
    75, 70, 65, 60,
    'CL-VS',
    '05'
),
-- Región del Biobío (tercera más poblada, zona sur)
(
    'biobio',
    'Región del Biobío',
    'Biobío',
    'chile',
    'region',
    'sur',
    'Concepción',
    1670000,
    23890,
    38, 115, 5,
    80, 75, 70, 65,
    'CL-BI',
    '08'
),
-- Región de La Araucanía (cuarta más poblada, zona sur)
(
    'araucania',
    'Región de La Araucanía',
    'Araucanía',
    'chile',
    'region',
    'sur',
    'Temuco',
    1012000,
    31842,
    35, 125, 5,
    70, 80, 65, 60,
    'CL-AR',
    '09'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SYNTHETIC_AGENTS - 12 agentes de prueba
-- ============================================================================

INSERT INTO synthetic_agents (
    id, public_id, status, region_id, commune, urban_rural, weight,
    character_sprite, version, generation_seed
) VALUES
-- Metropolitana (3 agentes)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'ag_001',
    'dormant',
    'metropolitana',
    'Santiago',
    'urban',
    1.2,
    'f1',
    1,
    'seed_maria_001'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'ag_002',
    'dormant',
    'metropolitana',
    'Providencia',
    'urban',
    0.8,
    'f4',
    1,
    'seed_carlos_002'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'ag_003',
    'dormant',
    'metropolitana',
    'La Florida',
    'urban',
    1.5,
    'f6',
    1,
    'seed_lucia_003'
),
-- Valparaíso (2 agentes)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'ag_004',
    'dormant',
    'valparaiso',
    'Valparaíso',
    'urban',
    1.3,
    'f3',
    1,
    'seed_diego_004'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'ag_005',
    'dormant',
    'valparaiso',
    'Viña del Mar',
    'urban',
    1.0,
    'f7',
    1,
    'seed_ana_005'
),
-- Biobío (3 agentes)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    'ag_006',
    'dormant',
    'biobio',
    'Concepción',
    'urban',
    1.1,
    'f2',
    1,
    'seed_roberto_006'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    'ag_007',
    'dormant',
    'biobio',
    'Los Ángeles',
    'rural',
    1.4,
    'f5',
    1,
    'seed_carmen_007'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    'ag_008',
    'dormant',
    'biobio',
    'Chillán',
    'semi_urban',
    1.3,
    'f8',
    1,
    'seed_pedro_008'
),
-- Agentes adicionales para completar 10
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
    'ag_009',
    'dormant',
    'metropolitana',
    'Las Condes',
    'urban',
    0.9,
    'f1',
    1,
    'seed_elena_009'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    'ag_010',
    'dormant',
    'valparaiso',
    'Quilpué',
    'urban',
    1.1,
    'f2',
    1,
    'seed_jose_010'
),
-- Araucanía (2 agentes)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'ag_011',
    'dormant',
    'araucania',
    'Temuco',
    'urban',
    1.0,
    'f3',
    1,
    'seed_luis_011'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'ag_012',
    'dormant',
    'araucania',
    'Villarrica',
    'semi_urban',
    1.2,
    'f4',
    1,
    'seed_marta_012'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. AGENT_PROFILES - Perfiles demográficos
-- ============================================================================

INSERT INTO agent_profiles (
    agent_id, name, sex, age, education_level, employment_status,
    income_decile, household_size, household_type, has_children,
    connectivity_type, digital_access_score, description
) VALUES
-- Agente 001: María González
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'María González',
    'female',
    34,
    'university',
    'employed',
    6,
    3,
    'couple',
    true,
    'fiber',
    85,
    'Profesional de marketing, madre de un niño, muy activa en redes sociales'
),
-- Agente 002: Carlos Rodríguez
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'Carlos Rodríguez',
    'male',
    52,
    'postgraduate',
    'employed',
    9,
    2,
    'couple',
    false,
    'fiber',
    75,
    'Ejecutivo de empresa, conservador, preocupado por la seguridad económica'
),
-- Agente 003: Lucía Fernández
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'Lucía Fernández',
    'female',
    67,
    'secondary',
    'retired',
    4,
    1,
    'single',
    false,
    'mobile',
    40,
    'Jubilada, vive sola, usa poco internet, muy interesada en temas de salud'
),
-- Agente 004: Diego Martínez
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'Diego Martínez',
    'male',
    28,
    'university',
    'unemployed',
    3,
    4,
    'extended',
    false,
    'mobile',
    70,
    'Recién graduado buscando trabajo, vive con familia extendida, muy activo políticamente'
),
-- Agente 005: Ana Silva
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'Ana Silva',
    'female',
    41,
    'university',
    'employed',
    7,
    3,
    'single_parent',
    true,
    'fiber',
    80,
    'Profesora universitaria, madre soltera, equilibrada, interesada en educación'
),
-- Agente 006: Roberto Soto
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    'Roberto Soto',
    'male',
    45,
    'technical',
    'employed',
    5,
    4,
    'couple',
    true,
    'cable',
    65,
    'Técnico industrial, padre de familia, pragmático, preocupado por economía regional'
),
-- Agente 007: Carmen López
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    'Carmen López',
    'female',
    56,
    'secondary',
    'inactive',
    3,
    5,
    'extended',
    true,
    'mobile',
    35,
    'Ama de casa rural, madre de tres, poco uso de tecnología, valores tradicionales'
),
-- Agente 008: Pedro Catrileo
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    'Pedro Catrileo',
    'male',
    38,
    'university',
    'employed',
    4,
    6,
    'extended',
    true,
    'dsl',
    55,
    'Trabajador social mapuche, defensor de derechos indígenas, muy comprometido'
),
-- Agente 009: Elena Rojas
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
    'Elena Rojas',
    'female',
    29,
    'university',
    'employed',
    6,
    2,
    'couple',
    false,
    'fiber',
    90,
    'Ingeniera de software, apasionada por la tecnología, preocupada por privacidad digital'
),
-- Agente 010: José Muñoz
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    'José Muñoz',
    'male',
    62,
    'secondary',
    'retired',
    2,
    1,
    'single',
    false,
    'mobile',
    30,
    'Ex obrero portuario jubilado, vive solo, poco contacto con tecnología, nostálgico'
),
-- Agente 011: Luis Contreras (Araucanía)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'Luis Contreras',
    'male',
    35,
    'university',
    'employed',
    5,
    4,
    'couple',
    true,
    'fiber',
    70,
    'Profesor de historia en Temuco, interesado en temas territoriales y derechos indígenas'
),
-- Agente 012: Marta Riquelme (Araucanía)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Marta Riquelme',
    'female',
    48,
    'secondary',
    'employed',
    4,
    3,
    'single_parent',
    true,
    'mobile',
    45,
    'Dueña de pequeño negocio en Villarrica, preocupada por el turismo y la seguridad regional'
)
ON CONFLICT (agent_id) DO NOTHING;

-- ============================================================================
-- 4. AGENT_TRAITS - Rasgos psicológicos
-- ============================================================================

INSERT INTO agent_traits (
    agent_id, institutional_trust, risk_aversion, digital_literacy, patience,
    civic_interest, social_desirability, openness_change, ideology_score,
    nationalism_score, consistency_score
) VALUES
-- Agente 001: María (progresista moderada, alta alfabetización digital)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    45, 60, 90, 70, 75, 65, 80, 55, 50, 85
),
-- Agente 002: Carlos (conservador, baja tolerancia al riesgo)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    70, 80, 60, 85, 60, 50, 40, 75, 70, 90
),
-- Agente 003: Lucía (moderada, tradicional)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    55, 75, 30, 60, 70, 70, 45, 45, 60, 80
),
-- Agente 004: Diego (muy progresista, desconfiado institucionalmente)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    25, 40, 85, 45, 90, 55, 95, 25, 40, 70
),
-- Agente 005: Ana (centrista, equilibrada)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    50, 55, 75, 80, 80, 60, 70, 50, 55, 85
),
-- Agente 006: Roberto (centro-derecha, pragmático)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    60, 70, 55, 75, 65, 55, 50, 60, 65, 80
),
-- Agente 007: Carmen (derecha, tradicional, rural)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    65, 80, 25, 70, 50, 75, 35, 70, 75, 85
),
-- Agente 008: Pedro (izquierda, activista, muy cívico)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    20, 50, 60, 65, 95, 50, 75, 30, 30, 90
),
-- Agente 009: Elena (progresista, alta alfabetización digital)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
    40, 50, 95, 75, 80, 55, 85, 45, 40, 80
),
-- Agente 010: José (derecha, tradicional, baja alfabetización digital)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    50, 85, 20, 60, 40, 65, 30, 65, 70, 75
),
-- Agente 011: Luis (centro-izquierda, interesado en justicia social)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    40, 55, 75, 70, 85, 60, 70, 35, 45, 80
),
-- Agente 012: Marta (centro, pragmática, preocupada por economía local)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    55, 70, 50, 65, 60, 70, 50, 55, 60, 75
)
ON CONFLICT (agent_id) DO NOTHING;

-- ============================================================================
-- 5. AGENT_MEMORIES - Memorias estructuradas
-- ============================================================================

INSERT INTO agent_memories (
    agent_id, memory_type, topic, content, stance, source, importance, confidence
) VALUES
-- Agente 001: María - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'summary',
    NULL,
    'María es una profesional urbana progresista que valora la educación y la tecnología. Es escéptica de las instituciones políticas tradicionales pero participativa en causas sociales.',
    NULL,
    'manual',
    90,
    85
),
-- Agente 001: María - Posición sobre educación
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'position',
    'educación pública',
    'Considera que la educación pública necesita más inversión y modernización',
    'a favor de más inversión',
    'survey',
    80,
    90
),
-- Agente 001: María - Posición sobre teletrabajo
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'position',
    'teletrabajo',
    'El teletrabajo ha mejorado su calidad de vida y productividad',
    'muy positivo',
    'conversation',
    75,
    85
),
-- Agente 002: Carlos - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'summary',
    NULL,
    'Carlos es un ejecutivo conservador que valora la estabilidad económica y las instituciones tradicionales. Es cauteloso con los cambios rápidos y prefiere soluciones probadas.',
    NULL,
    'manual',
    90,
    90
),
-- Agente 002: Carlos - Posición sobre reforma tributaria
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'position',
    'reforma tributaria',
    'Considera que aumentar impuestos afecta la inversión y el crecimiento',
    'en contra de aumentos',
    'survey',
    85,
    80
),
-- Agente 003: Lucía - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'summary',
    NULL,
    'Lucía es una jubilada preocupada principalmente por temas de salud y pensiones. Valora la tradición y la familia, pero es receptiva a propuestas que mejoren su calidad de vida.',
    NULL,
    'manual',
    85,
    80
),
-- Agente 003: Lucía - Posición sobre salud
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'position',
    'sistema de salud',
    'El sistema de salud público necesita mejoras urgentes en atención y tiempos de espera',
    'necesita mejoras urgentes',
    'survey',
    90,
    85
),
-- Agente 004: Diego - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'summary',
    NULL,
    'Diego es un joven graduado frustrado con la falta de oportunidades laborales. Es muy activo en redes sociales y participa en movimientos sociales. Desconfía fuertemente de las instituciones.',
    NULL,
    'manual',
    90,
    85
),
-- Agente 004: Diego - Posición sobre sistema político
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'position',
    'sistema político',
    'El sistema político chileno necesita cambios estructurales profundos',
    'necesita cambio radical',
    'conversation',
    85,
    80
),
-- Agente 005: Ana - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'summary',
    NULL,
    'Ana es una profesora equilibrada que busca el bienestar de sus hijos y estudiantes. Tiene opiniones moderadas pero bien fundamentadas. Valora la educación por encima de todo.',
    NULL,
    'manual',
    85,
    85
),
-- Agente 006: Roberto - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    'summary',
    NULL,
    'Roberto es un trabajador industrial pragmático que valora la estabilidad laboral. Está preocupado por el futuro de la industria regional y la educación de sus hijos.',
    NULL,
    'manual',
    80,
    80
),
-- Agente 007: Carmen - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    'summary',
    NULL,
    'Carmen es una ama de casa rural con valores tradicionales fuertes. Su familia es lo más importante. Tiene poco contacto con tecnología y prefiere la vida tranquila del campo.',
    NULL,
    'manual',
    85,
    85
),
-- Agente 008: Pedro - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    'summary',
    NULL,
    'Pedro es un activista mapuche comprometido con la causa indígena. Desconfía del estado chileno pero trabaja constructivamente por el reconocimiento de derechos.',
    NULL,
    'manual',
    90,
    90
),
-- Agente 009: Elena - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
    'summary',
    NULL,
    'Elena es una ingeniera de software apasionada por la tecnología y la innovación. Valora la privacidad digital y es crítica de la regulación excesiva.',
    NULL,
    'manual',
    85,
    80
),
-- Agente 010: José - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    'summary',
    NULL,
    'José es un jubilado de la industria portuaria que extraña los tiempos pasados. Vive aislado y tiene poco contacto con tecnología. Valora el trabajo duro y la honestidad.',
    NULL,
    'manual',
    80,
    75
),
-- Agente 011: Luis - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'summary',
    NULL,
    'Luis es un profesor de historia comprometido con la educación pública y los derechos de los pueblos originarios. Vive en Temuco y está muy informado sobre el conflicto territorial.',
    NULL,
    'manual',
    85,
    80
),
-- Agente 012: Marta - Resumen general
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'summary',
    NULL,
    'Marta es una emprendedora de Villarrica que depende del turismo. Está preocupada por la inseguridad y cómo afecta su negocio, pero también valora la naturaleza de la región.',
    NULL,
    'manual',
    80,
    75
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. AGENT_STATES - Estados dinámicos
-- ============================================================================

INSERT INTO agent_states (
    agent_id, fatigue, economic_stress, survey_saturation, mood,
    total_surveys_completed, total_surveys_abandoned, last_survey_at,
    last_activation_at, last_deactivation_at
) VALUES
-- Agente 001: María (baja fatiga, buen ánimo)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    20, 30, 1, 'positive',
    2, 0, '2024-03-10T10:00:00Z',
    '2024-03-15T08:00:00Z', NULL
),
-- Agente 002: Carlos (fatiga moderada, neutral)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    45, 25, 2, 'neutral',
    3, 0, '2024-03-14T15:00:00Z',
    '2024-03-14T09:00:00Z', NULL
),
-- Agente 003: Lucía (fatiga alta por edad)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    60, 65, 1, 'neutral',
    1, 0, '2024-03-12T11:00:00Z',
    '2024-03-12T08:00:00Z', NULL
),
-- Agente 004: Diego (estrés económico alto, estresado)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    35, 85, 3, 'stressed',
    4, 1, '2024-03-15T14:00:00Z',
    '2024-03-15T10:00:00Z', NULL
),
-- Agente 005: Ana (equilibrada, buen ánimo)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    40, 40, 1, 'positive',
    2, 0, '2024-03-13T16:00:00Z',
    '2024-03-13T09:00:00Z', NULL
),
-- Agente 006: Roberto (fatiga moderada)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    50, 55, 2, 'neutral',
    3, 0, '2024-03-14T12:00:00Z',
    '2024-03-14T08:00:00Z', NULL
),
-- Agente 007: Carmen (baja fatiga, buen ánimo rural)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    30, 50, 0, 'positive',
    0, 0, NULL,
    '2024-03-10T09:00:00Z', '2024-03-10T18:00:00Z'
),
-- Agente 008: Pedro (fatiga alta por activismo)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    55, 60, 4, 'stressed',
    5, 0, '2024-03-15T13:00:00Z',
    '2024-03-15T08:00:00Z', NULL
),
-- Agente 009: Elena (baja fatiga, muy buen ánimo)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
    25, 35, 1, 'positive',
    2, 0, '2024-03-14T17:00:00Z',
    '2024-03-14T09:00:00Z', NULL
),
-- Agente 010: José (fatiga alta, ánimo negativo)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    70, 75, 0, 'negative',
    0, 0, NULL,
    '2024-03-08T10:00:00Z', '2024-03-08T16:00:00Z'
),
-- Agente 011: Luis (fatiga moderada, ánimo neutral)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    40, 50, 2, 'neutral',
    3, 0, '2024-03-14T11:00:00Z',
    '2024-03-14T08:00:00Z', NULL
),
-- Agente 012: Marta (fatiga moderada, ánimo preocupado)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    45, 65, 1, 'stressed',
    2, 0, '2024-03-13T14:00:00Z',
    '2024-03-13T09:00:00Z', NULL
)
ON CONFLICT (agent_id) DO NOTHING;

-- ============================================================================
-- 7. RUNTIME_BINDINGS - Bindings vacíos (ningún agente activo inicialmente)
-- ============================================================================

-- Nota: Los bindings se crearán dinámicamente cuando se activen agentes
-- Por ahora, la tabla está vacía intencionalmente

-- Ejemplo de cómo se vería un binding activo (comentado):
-- INSERT INTO runtime_bindings (
--     agent_id, convex_agent_id, convex_player_id, convex_world_id,
--     region_id, status, activated_at, activation_reason
-- ) VALUES (
--     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
--     'ag_123_convex',
--     'pl_456_convex',
--     'world_001',
--     'metropolitana',
--     'active',
--     NOW(),
--     'manual'
-- );

-- ============================================================================
-- VERIFICACIÓN: Contar registros insertados
-- ============================================================================

SELECT 'territories' as table_name, COUNT(*) as count FROM territories
UNION ALL
SELECT 'synthetic_agents', COUNT(*) FROM synthetic_agents
UNION ALL
SELECT 'agent_profiles', COUNT(*) FROM agent_profiles
UNION ALL
SELECT 'agent_traits', COUNT(*) FROM agent_traits
UNION ALL
SELECT 'agent_memories', COUNT(*) FROM agent_memories
UNION ALL
SELECT 'agent_states', COUNT(*) FROM agent_states
UNION ALL
SELECT 'runtime_bindings', COUNT(*) FROM runtime_bindings;
