-- ============================================================================
-- MIGRACIÓN INICIAL: Backend Estructural Supabase
-- ============================================================================
-- Objetivo: Crear tablas mínimas para soportar frontend en modo read-only
-- Tablas: territories, synthetic_agents, agent_profiles, agent_traits,
--         agent_memories, agent_states, runtime_bindings
-- NO incluye: events, surveys, benchmarks, calibration (fase posterior)
-- ============================================================================

-- ============================================================================
-- EXTENSIONES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. TERRITORIES - Jerarquía territorial de Chile
-- ============================================================================

CREATE TABLE territories (
    -- Identificación
    id TEXT PRIMARY KEY,                    -- 'metropolitana', 'valparaiso'
    name TEXT NOT NULL,                     -- 'Región Metropolitana de Santiago'
    short_name TEXT NOT NULL,               -- 'Metropolitana'

    -- Jerarquía
    parent_id TEXT REFERENCES territories(id), -- NULL para país, regiones para comunas
    level TEXT NOT NULL CHECK (level IN ('country', 'region', 'province', 'commune')),

    -- Geografía
    macro_zone TEXT CHECK (macro_zone IN ('norte_grande', 'norte_chico', 'centro', 'sur', 'austral')),
    capital TEXT,

    -- Datos censales (referencia)
    population INTEGER,
    area_km2 INTEGER,

    -- Visualización (porcentajes 0-100 para mapa SVG)
    map_x NUMERIC(5,2),                     -- Posición X en mapa
    map_y NUMERIC(5,2),                     -- Posición Y en mapa
    map_radius NUMERIC(5,2),                -- Tamaño del marcador

    -- Scores para UI (0-100)
    population_score INTEGER CHECK (population_score >= 0 AND population_score <= 100),
    event_score INTEGER CHECK (event_score >= 0 AND event_score <= 100),
    survey_score INTEGER CHECK (survey_score >= 0 AND survey_score <= 100),
    result_score INTEGER CHECK (result_score >= 0 AND result_score <= 100),

    -- Códigos externos
    iso_code TEXT,                          -- 'CL-RM'
    ine_code TEXT,                          -- Código INE

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para territories
CREATE INDEX idx_territories_level ON territories(level);
CREATE INDEX idx_territories_parent ON territories(parent_id);
CREATE INDEX idx_territories_macro_zone ON territories(macro_zone);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_territories_updated_at
    BEFORE UPDATE ON territories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. SYNTHETIC_AGENTS - Registro maestro de agentes sintéticos
-- ============================================================================

CREATE TABLE synthetic_agents (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,         -- ID expuesto en APIs (prefijo 'ag_')

    -- Estado de vida
    status TEXT NOT NULL DEFAULT 'dormant'
        CHECK (status IN ('dormant', 'activating', 'active', 'deactivating', 'archived')),

    -- Territorio
    region_id TEXT NOT NULL REFERENCES territories(id),
    commune TEXT NOT NULL,                  -- Nombre de comuna (no foreign key para flexibilidad)

    -- Clasificación
    urban_rural TEXT CHECK (urban_rural IN ('urban', 'rural', 'semi_urban')),

    -- Peso muestral
    weight NUMERIC(10,4) NOT NULL DEFAULT 1.0, -- Factor de expansión para representatividad

    -- Visualización
    character_sprite TEXT,                  -- Referencia a spritesheet (ej: 'f1', 'f2')

    -- Control de versiones
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadatos de generación
    generation_seed TEXT,                   -- Semilla usada para generar el agente
    generation_batch_id UUID                -- Para trackear lotes de generación
);

-- Índices para synthetic_agents
CREATE INDEX idx_agents_region ON synthetic_agents(region_id);
CREATE INDEX idx_agents_status ON synthetic_agents(status);
CREATE INDEX idx_agents_commune ON synthetic_agents(commune);
CREATE INDEX idx_agents_urban_rural ON synthetic_agents(urban_rural);

-- Trigger para updated_at
CREATE TRIGGER update_synthetic_agents_updated_at
    BEFORE UPDATE ON synthetic_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. AGENT_PROFILES - Características demográficas y socioeconómicas
-- ============================================================================

CREATE TABLE agent_profiles (
    -- Identificación
    agent_id UUID PRIMARY KEY REFERENCES synthetic_agents(id) ON DELETE CASCADE,

    -- Demografía básica
    name TEXT NOT NULL,
    sex TEXT CHECK (sex IN ('male', 'female', 'other')),
    age INTEGER CHECK (age >= 18 AND age <= 100),

    -- Educación
    education_level TEXT CHECK (education_level IN ('none', 'primary', 'secondary', 'technical', 'university', 'postgraduate')),

    -- Empleo
    employment_status TEXT CHECK (employment_status IN ('employed', 'unemployed', 'inactive', 'retired', 'student')),

    -- Hogar
    household_size INTEGER CHECK (household_size >= 1 AND household_size <= 15),
    household_type TEXT CHECK (household_type IN ('single', 'couple', 'single_parent', 'extended', 'other')),
    has_children BOOLEAN DEFAULT FALSE,

    -- Ingresos (decil 1-10)
    income_decile INTEGER CHECK (income_decile >= 1 AND income_decile <= 10),

    -- Conectividad
    connectivity_type TEXT CHECK (connectivity_type IN ('fiber', 'cable', 'dsl', 'mobile', 'satellite', 'none')),
    digital_access_score INTEGER CHECK (digital_access_score >= 0 AND digital_access_score <= 100),

    -- Descripción
    description TEXT,                       -- Descripción generada para UI

    -- Versionado
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para estratificación
CREATE INDEX idx_profiles_age ON agent_profiles(age);
CREATE INDEX idx_profiles_sex ON agent_profiles(sex);
CREATE INDEX idx_profiles_education ON agent_profiles(education_level);
CREATE INDEX idx_profiles_income ON agent_profiles(income_decile);
CREATE INDEX idx_profiles_employment ON agent_profiles(employment_status);

-- Trigger para updated_at
CREATE TRIGGER update_agent_profiles_updated_at
    BEFORE UPDATE ON agent_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. AGENT_TRAITS - Rasgos psicológicos y comportamentales
-- ============================================================================

CREATE TABLE agent_traits (
    -- Identificación
    agent_id UUID PRIMARY KEY REFERENCES synthetic_agents(id) ON DELETE CASCADE,

    -- Rasgos psicológicos (0-100)
    institutional_trust INTEGER CHECK (institutional_trust >= 0 AND institutional_trust <= 100),
    risk_aversion INTEGER CHECK (risk_aversion >= 0 AND risk_aversion <= 100),
    digital_literacy INTEGER CHECK (digital_literacy >= 0 AND digital_literacy <= 100),
    patience INTEGER CHECK (patience >= 0 AND patience <= 100),
    civic_interest INTEGER CHECK (civic_interest >= 0 AND civic_interest <= 100),
    social_desirability INTEGER CHECK (social_desirability >= 0 AND social_desirability <= 100),
    openness_change INTEGER CHECK (openness_change >= 0 AND openness_change <= 100),
    ideology_score INTEGER CHECK (ideology_score >= 0 AND ideology_score <= 100), -- 0=left, 100=right
    nationalism_score INTEGER CHECK (nationalism_score >= 0 AND nationalism_score <= 100),
    consistency_score INTEGER CHECK (consistency_score >= 0 AND consistency_score <= 100),

    -- Metadatos
    generation_prompt TEXT,                 -- Prompt usado para generar estos rasgos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para análisis
CREATE INDEX idx_traits_ideology ON agent_traits(ideology_score);
CREATE INDEX idx_traits_institutional_trust ON agent_traits(institutional_trust);
CREATE INDEX idx_traits_civic ON agent_traits(civic_interest);

-- Trigger para updated_at
CREATE TRIGGER update_agent_traits_updated_at
    BEFORE UPDATE ON agent_traits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. AGENT_MEMORIES - Memoria estructurada del agente
-- ============================================================================

CREATE TABLE agent_memories (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES synthetic_agents(id) ON DELETE CASCADE,

    -- Tipo de memoria
    memory_type TEXT NOT NULL CHECK (memory_type IN ('summary', 'position', 'topic', 'reflection')),

    -- Contenido
    topic TEXT,                             -- Tema al que aplica (para type='topic' o 'position')
    content TEXT NOT NULL,                  -- Texto de la memoria/resumen/posición
    stance TEXT,                            -- Postura específica (para type='position')

    -- Origen
    source TEXT CHECK (source IN ('survey', 'conversation', 'event', 'reflection', 'manual')),
    source_id TEXT,                         -- ID de la encuesta/conversación/evento origen

    -- Métricas
    importance INTEGER CHECK (importance >= 0 AND importance <= 100),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),

    -- Tiempos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ,

    -- Convex sync (opcional, para memoria caliente)
    convex_memory_id TEXT                   -- Referencia a memories table en Convex
);

-- Índices
CREATE INDEX idx_memories_agent ON agent_memories(agent_id);
CREATE INDEX idx_memories_type ON agent_memories(memory_type);
CREATE INDEX idx_memories_topic ON agent_memories(topic);
CREATE INDEX idx_memories_source ON agent_memories(source);

-- Trigger para updated_at
CREATE TRIGGER update_agent_memories_updated_at
    BEFORE UPDATE ON agent_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. AGENT_STATES - Estado dinámico del agente
-- ============================================================================

CREATE TABLE agent_states (
    -- Identificación
    agent_id UUID PRIMARY KEY REFERENCES synthetic_agents(id) ON DELETE CASCADE,

    -- Estado emocional (0-100)
    fatigue INTEGER CHECK (fatigue >= 0 AND fatigue <= 100),
    economic_stress INTEGER CHECK (economic_stress >= 0 AND economic_stress <= 100),
    survey_saturation INTEGER CHECK (survey_saturation >= 0 AND survey_saturation <= 100),

    -- Ánimo categórico
    mood TEXT CHECK (mood IN ('positive', 'neutral', 'negative', 'stressed')),

    -- Métricas de participación
    total_surveys_completed INTEGER DEFAULT 0,
    total_surveys_abandoned INTEGER DEFAULT 0,
    last_survey_at TIMESTAMPTZ,

    -- Tiempos
    last_activation_at TIMESTAMPTZ,
    last_deactivation_at TIMESTAMPTZ,

    -- Convex sync
    convex_player_id TEXT,                  -- Referencia a player en Convex

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_states_mood ON agent_states(mood);
CREATE INDEX idx_states_fatigue ON agent_states(fatigue);
CREATE INDEX idx_states_last_survey ON agent_states(last_survey_at);

-- Trigger para updated_at
CREATE TRIGGER update_agent_states_updated_at
    BEFORE UPDATE ON agent_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. RUNTIME_BINDINGS - Puente entre Supabase y Convex
-- ============================================================================

CREATE TABLE runtime_bindings (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Supabase side
    agent_id UUID NOT NULL REFERENCES synthetic_agents(id),

    -- Convex side
    convex_agent_id TEXT,                   -- ID del agent en Convex (ej: 'ag_123')
    convex_player_id TEXT,                  -- ID del player en Convex (ej: 'pl_456')
    convex_world_id TEXT,                   -- ID del world en Convex

    -- Contexto
    region_id TEXT REFERENCES territories(id), -- Región donde está activo

    -- Estado del binding
    status TEXT DEFAULT 'inactive'
        CHECK (status IN ('inactive', 'activating', 'active', 'deactivating', 'error')),

    -- Sincronización
    last_synced_at TIMESTAMPTZ,
    sync_error TEXT,                        -- Último error de sincronización

    -- Tiempos de vida
    activated_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,

    -- Metadatos
    activation_reason TEXT,                 -- 'survey', 'event', 'manual', 'scheduled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices críticos
CREATE UNIQUE INDEX idx_bindings_agent_active
    ON runtime_bindings(agent_id)
    WHERE status IN ('activating', 'active');

CREATE INDEX idx_bindings_convex_agent ON runtime_bindings(convex_agent_id);
CREATE INDEX idx_bindings_convex_player ON runtime_bindings(convex_player_id);
CREATE INDEX idx_bindings_status ON runtime_bindings(status);
CREATE INDEX idx_bindings_region ON runtime_bindings(region_id);

-- Índices únicos opcionales para convex IDs cuando no sean null
CREATE UNIQUE INDEX idx_bindings_convex_agent_unique
    ON runtime_bindings(convex_agent_id)
    WHERE convex_agent_id IS NOT NULL;

CREATE UNIQUE INDEX idx_bindings_convex_player_unique
    ON runtime_bindings(convex_player_id)
    WHERE convex_player_id IS NOT NULL;

-- Trigger para updated_at
CREATE TRIGGER update_runtime_bindings_updated_at
    BEFORE UPDATE ON runtime_bindings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VISTAS ÚTILES PARA EL FRONTEND
-- ============================================================================

-- Vista: Resumen de agente para listas
CREATE VIEW agent_summaries AS
SELECT
    sa.id,
    sa.public_id,
    sa.region_id,
    sa.commune,
    sa.urban_rural,
    sa.character_sprite,
    sa.status,
    ap.name,
    ap.age,
    ap.sex,
    ap.description,
    ast.mood,
    ast.fatigue,
    ast.survey_saturation,
    rb.status as binding_status,
    rb.convex_player_id
FROM synthetic_agents sa
LEFT JOIN agent_profiles ap ON sa.id = ap.agent_id
LEFT JOIN agent_states ast ON sa.id = ast.agent_id
LEFT JOIN runtime_bindings rb ON sa.id = rb.agent_id
    AND rb.status IN ('activating', 'active');

-- Vista: Agente completo para detalle
CREATE VIEW full_agents AS
SELECT
    sa.id as agent_id,
    sa.public_id,
    sa.region_id,
    sa.commune,
    sa.urban_rural,
    sa.weight,
    sa.character_sprite,
    sa.status as agent_status,
    sa.created_at,
    -- Perfil
    ap.name,
    ap.sex,
    ap.age,
    ap.education_level,
    ap.employment_status,
    ap.income_decile,
    ap.household_size,
    ap.household_type,
    ap.has_children,
    ap.connectivity_type,
    ap.digital_access_score,
    ap.description,
    -- Rasgos
    at.institutional_trust,
    at.risk_aversion,
    at.digital_literacy,
    at.patience,
    at.civic_interest,
    at.social_desirability,
    at.openness_change,
    at.ideology_score,
    at.nationalism_score,
    at.consistency_score,
    -- Estado
    ast.fatigue as state_fatigue,
    ast.economic_stress,
    ast.survey_saturation,
    ast.mood,
    ast.total_surveys_completed,
    ast.last_activation_at,
    ast.convex_player_id,
    -- Binding
    rb.status as binding_status,
    rb.convex_agent_id,
    rb.convex_world_id,
    rb.activated_at
FROM synthetic_agents sa
LEFT JOIN agent_profiles ap ON sa.id = ap.agent_id
LEFT JOIN agent_traits at ON sa.id = at.agent_id
LEFT JOIN agent_states ast ON sa.id = ast.agent_id
LEFT JOIN runtime_bindings rb ON sa.id = rb.agent_id
    AND rb.status IN ('activating', 'active');

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD BÁSICAS (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthetic_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_bindings ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden leer todo
CREATE POLICY "Authenticated users can view territories"
    ON territories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view agents"
    ON synthetic_agents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view profiles"
    ON agent_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view traits"
    ON agent_traits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view memories"
    ON agent_memories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view states"
    ON agent_states FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view bindings"
    ON runtime_bindings FOR SELECT TO authenticated USING (true);

-- Nota: Las políticas de escritura se agregarán en migraciones futuras
-- cuando se implemente la lógica de activación/desactivación

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE territories IS 'Jerarquía territorial de Chile para estratificación y análisis';
COMMENT ON TABLE synthetic_agents IS 'Registro maestro de agentes sintéticos';
COMMENT ON TABLE agent_profiles IS 'Características demográficas y socioeconómicas del agente';
COMMENT ON TABLE agent_traits IS 'Rasgos psicológicos y comportamentales que influyen en respuestas';
COMMENT ON TABLE agent_memories IS 'Memoria estructurada del agente (resúmenes, posiciones, temas)';
COMMENT ON TABLE agent_states IS 'Estado dinámico del agente (fatiga, estrés, ánimo)';
COMMENT ON TABLE runtime_bindings IS 'Mapeo entre agentes estructurales (Supabase) y entidades de runtime (Convex)';

COMMENT ON VIEW agent_summaries IS 'Vista resumida de agentes para listas y mapas';
COMMENT ON VIEW full_agents IS 'Vista completa de agentes para detalle e inspección';
