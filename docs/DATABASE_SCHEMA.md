# Diseño de modelo estructural

## 1. Principios de arquitectura

### 1.1 Separación de responsabilidades

| Sistema | Responsabilidad principal | Patrón de acceso |
|---------|--------------------------|------------------|
| **Supabase (Postgres)** | Fuente de verdad estructural, histórico, analítico | Lectura frecuente, escritura batch |
| **Convex** | Runtime de simulación, estado transitorio, memoria caliente | Tiempo real, eventos |
| **Frontend** | Composición de vistas, caché local, UI state | React Query / Zustand |

### 1.2 Modelo de agente dual

Cada agente sintético existe en dos planos:

1. **Estructural (Supabase)**: Quién es el agente (perfil, rasgos, historial)
   - Persistente, versionado, auditable
   - Usado para: estratificación, análisis, benchmarks

2. **Runtime (Convex)**: Qué está haciendo ahora (posición, conversación, actividad)
   - Transitorio, efímero, tiempo real
   - Usado para: visualización, interacción, simulación

### 1.3 Estados del agente

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENTE SINTÉTICO                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │   DORMIDO    │ ───▶ │  ACTIVANDO   │ ───▶ │  ACTIVO  │  │
│  │  (Supabase)  │      │   (Bridge)   │      │ (Convex) │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
│         ▲                                           │       │
│         │                                           │       │
│         └───────────────────────────────────────────┘       │
│                      DESACTIVANDO                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **Dormido**: Solo existe en Supabase, no consume recursos de Convex
- **Activando**: Se crea player/agent en Convex, se sincroniza binding
- **Activo**: Vive en Convex, actualiza estado en tiempo real
- **Desactivando**: Se archiva estado final en Supabase, se libera Convex

### 1.4 Principios de diseño

1. **Single Source of Truth**: Cada dato tiene un único sistema propietario
2. **Eventual Consistency**: Los bindings se sincronizan eventualmente, no en tiempo real
3. **Lazy Activation**: Los agentes se activan solo cuando se necesitan (encuesta, evento)
4. **Audit Trail**: Todo cambio estructural se versiona en Supabase
5. **Ephemeral Runtime**: Convex es descartable, Supabase es permanente

---

## 2. Tablas Supabase

### 2.1 territories

**Propósito**: Jerarquía territorial de Chile para estratificación y análisis.

```sql
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
    
    -- Códigos externos
    iso_code TEXT,                          -- 'CL-RM'
    ine_code TEXT,                          -- Código INE
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_territories_level ON territories(level);
CREATE INDEX idx_territories_parent ON territories(parent_id);
CREATE INDEX idx_territories_macro_zone ON territories(macro_zone);
```

**Relaciones**:
- `parent_id` → `territories` (self-reference para jerarquía)
- Referenciado por: `synthetic_agents.region_id`

---

### 2.2 synthetic_agents

**Propósito**: Registro maestro de agentes sintéticos. Uno por cada persona simulada.

```sql
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
    urban_rural TEXT CHECK (urban_rural IN ('urban', 'rural', 'semiurban')),
    
    -- Peso muestral
    weight NUMERIC(6,4) NOT NULL DEFAULT 1.0, -- Factor de expansión para representatividad
    
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

-- Índices
CREATE INDEX idx_agents_region ON synthetic_agents(region_id);
CREATE INDEX idx_agents_status ON synthetic_agents(status);
CREATE INDEX idx_agents_commune ON synthetic_agents(commune);
CREATE INDEX idx_agents_urban_rural ON synthetic_agents(urban_rural);
```

**Relaciones**:
- `region_id` → `territories`
- Referenciado por: `agent_profiles`, `agent_traits`, `agent_memories`, `agent_states`, `runtime_bindings`

---

### 2.3 agent_profiles

**Propósito**: Características demográficas y socioeconómicas del agente (datos censales).

```sql
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
```

**Relaciones**:
- `agent_id` → `synthetic_agents` (1:1)

---

### 2.4 agent_traits

**Propósito**: Rasgos psicológicos y comportamentales que influyen en respuestas.

```sql
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
```

**Relaciones**:
- `agent_id` → `synthetic_agents` (1:1)

---

### 2.5 agent_memories

**Propósito**: Memoria estructurada del agente (resúmenes, posiciones, temas).

```sql
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
    last_accessed TIMESTAMPTZ,
    
    -- Convex sync (opcional, para memoria caliente)
    convex_memory_id TEXT                   -- Referencia a memories table en Convex
);

-- Índices
CREATE INDEX idx_memories_agent ON agent_memories(agent_id);
CREATE INDEX idx_memories_type ON agent_memories(memory_type);
CREATE INDEX idx_memories_topic ON agent_memories(topic);
CREATE INDEX idx_memories_source ON agent_memories(source);
```

**Relaciones**:
- `agent_id` → `synthetic_agents`
- Referencia opcional a Convex memories

---

### 2.6 agent_states

**Propósito**: Estado dinámico del agente (fatiga, estrés, ánimo). Se actualiza periódicamente.

```sql
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
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_states_mood ON agent_states(mood);
CREATE INDEX idx_states_fatigue ON agent_states(fatigue);
CREATE INDEX idx_states_last_survey ON agent_states(last_survey_at);
```

**Relaciones**:
- `agent_id` → `synthetic_agents` (1:1)
- Referencia opcional a Convex player

---

### 2.7 events

**Propósito**: Catálogo de eventos del mundo real que pueden afectar opinión pública.

```sql
CREATE TABLE events (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,         -- 'evt_2024_01_reforma_pensiones'
    
    -- Contenido
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    summary TEXT,                           -- Resumen para agentes
    
    -- Categorización
    category TEXT CHECK (category IN ('political', 'economic', 'social', 'environmental', 'international', 'other')),
    tags TEXT[],                            -- Array de tags
    
    -- Alcance territorial
    affected_regions TEXT[],                -- Array de region_ids, NULL = nacional
    
    -- Intensidad y duración
    intensity INTEGER CHECK (intensity >= 0 AND intensity <= 100),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,                   -- NULL si es evento continuo
    
    -- Estado
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'ended', 'cancelled')),
    
    -- Fuentes
    source_url TEXT,
    source_name TEXT,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_dates ON events(started_at, ended_at);
CREATE INDEX idx_events_regions ON events USING GIN(affected_regions);
```

**Relaciones**:
- Referenciado por: `agent_event_exposures`

---

### 2.8 agent_event_exposures

**Propósito**: Qué eventos experimentó cada agente y cómo los interpretó.

```sql
CREATE TABLE agent_event_exposures (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES synthetic_agents(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Exposición
    exposure_probability NUMERIC(5,2) CHECK (exposure_probability >= 0 AND exposure_probability <= 100),
    exposure_level INTEGER CHECK (exposure_level >= 0 AND exposure_level <= 100),
    
    -- Interpretación
    interpreted_stance TEXT,                -- 'positive', 'negative', 'neutral', 'mixed'
    interpretation_rationale TEXT,          -- Por qué interpretó así
    
    -- Impacto
    mood_impact INTEGER CHECK (mood_impact >= -100 AND mood_impact <= 100),
    trust_impact INTEGER CHECK (trust_impact >= -100 AND trust_impact <= 100),
    
    -- Tiempos
    exposed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Convex sync (si el evento se simula en tiempo real)
    convex_conversation_id TEXT,            -- Si se discutió en Convex
    
    UNIQUE(agent_id, event_id)              -- Un agente, un evento
);

-- Índices
CREATE INDEX idx_exposures_agent ON agent_event_exposures(agent_id);
CREATE INDEX idx_exposures_event ON agent_event_exposures(event_id);
CREATE INDEX idx_exposures_stance ON agent_event_exposures(interpreted_stance);
```

**Relaciones**:
- `agent_id` → `synthetic_agents`
- `event_id` → `events`

---

### 2.9 surveys

**Propósito**: Definición de encuestas sintéticas.

```sql
CREATE TABLE surveys (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,         -- 'srv_2024_q1_nacional'
    
    -- Metadatos
    title TEXT NOT NULL,
    description TEXT,
    
    -- Alcance
    target_regions TEXT[],                  -- NULL = nacional
    target_population_size INTEGER,         -- Cuántos agentes objetivo
    
    -- Configuración
    estimated_duration_minutes INTEGER,     -- Duración estimada
    is_repeatable BOOLEAN DEFAULT FALSE,    -- Se puede aplicar múltiples veces
    
    -- Estado
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    
    -- Tiempos
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_dates ON surveys(starts_at, ends_at);
```

**Relaciones**:
- Referenciado por: `survey_questions`, `survey_runs`

---

### 2.10 survey_questions

**Propósito**: Preguntas individuales de una encuesta.

```sql
CREATE TABLE survey_questions (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    
    -- Contenido
    question_order INTEGER NOT NULL,        -- Orden en la encuesta
    question_text TEXT NOT NULL,
    question_type TEXT CHECK (question_type IN ('single_choice', 'multiple_choice', 'scale', 'open_ended', 'demographic')),
    
    -- Opciones (para choice questions)
    options JSONB,                          -- [{"value": "1", "label": "Muy de acuerdo"}]
    
    -- Configuración
    is_required BOOLEAN DEFAULT TRUE,
    
    -- Temas para análisis
    topic_tags TEXT[],                      -- ['economía', 'política']
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_questions_survey ON survey_questions(survey_id);
CREATE INDEX idx_questions_order ON survey_questions(survey_id, question_order);
```

**Relaciones**:
- `survey_id` → `surveys`

---

### 2.11 survey_runs

**Propósito**: Instancias de ejecución de una encuesta (cada vez que se "lanza").

```sql
CREATE TABLE survey_runs (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id),
    
    -- Configuración de esta ejecución
    run_name TEXT NOT NULL,                 -- 'Primera oleada', 'Seguimiento semana 2'
    
    -- Muestra
    sample_size INTEGER NOT NULL,           -- Cuántos agentes se encuestaron
    sample_strategy TEXT CHECK (sample_strategy IN ('random', 'stratified', 'quota', 'convenience')),
    
    -- Estado
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    
    -- Progreso
    agents_targeted INTEGER DEFAULT 0,      -- Cuántos se seleccionaron
    agents_responded INTEGER DEFAULT 0,     -- Cuántos respondieron
    agents_abandoned INTEGER DEFAULT 0,     -- Cuántos abandonaron
    
    -- Tiempos
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Resultados agregados (cache)
    results_summary JSONB,                  -- Resumen de resultados
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_runs_survey ON survey_runs(survey_id);
CREATE INDEX idx_runs_status ON survey_runs(status);
```

**Relaciones**:
- `survey_id` → `surveys`
- Referenciado por: `survey_responses`

---

### 2.12 survey_responses

**Propósito**: Respuestas individuales de agentes a encuestas.

```sql
CREATE TABLE survey_responses (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES survey_runs(id),
    agent_id UUID NOT NULL REFERENCES synthetic_agents(id),
    question_id UUID NOT NULL REFERENCES survey_questions(id),
    
    -- Respuesta
    response_value TEXT,                    -- Valor de la respuesta
    response_text TEXT,                     -- Texto completo (para open ended)
    
    -- Metadatos de respuesta
    response_time_seconds INTEGER,          -- Cuánto tardó en responder
    was_modified BOOLEAN DEFAULT FALSE,     -- Si cambió su respuesta
    
    -- Tiempos
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(run_id, agent_id, question_id)   -- Una respuesta por pregunta
);

-- Índices
CREATE INDEX idx_responses_run ON survey_responses(run_id);
CREATE INDEX idx_responses_agent ON survey_responses(agent_id);
CREATE INDEX idx_responses_question ON survey_responses(question_id);
```

**Relaciones**:
- `run_id` → `survey_runs`
- `agent_id` → `synthetic_agents`
- `question_id` → `survey_questions`

---

### 2.13 benchmarks

**Propósito**: Encuestas reales para validar/ calibrar agentes sintéticos.

```sql
CREATE TABLE benchmarks (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,         -- 'bch_cep_enero_2024'
    
    -- Metadatos
    title TEXT NOT NULL,
    description TEXT,
    source_organization TEXT,               -- 'CEP', 'Criteria', 'Pulso Ciudadano'
    source_url TEXT,
    
    -- Fechas
    fieldwork_start DATE,
    fieldwork_end DATE,
    published_at DATE,
    
    -- Muestra
    sample_size INTEGER,
    sample_error NUMERIC(4,2),              -- Error muestral (ej: 3.0)
    
    -- Cobertura
    coverage_type TEXT CHECK (coverage_type IN ('national', 'regional', 'communal')),
    covered_regions TEXT[],                 -- Regiones incluidas
    
    -- Datos
    raw_data_url TEXT,                      -- URL a datos brutos si disponible
    methodology TEXT,                       -- Descripción metodológica
    
    -- Estado
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_benchmarks_source ON benchmarks(source_organization);
CREATE INDEX idx_benchmarks_dates ON benchmarks(fieldwork_start, fieldwork_end);
```

**Relaciones**:
- Referenciado por: `benchmark_results`

---

### 2.14 benchmark_results

**Propósito**: Resultados agregados de benchmarks (para comparar con agentes).

```sql
CREATE TABLE benchmark_results (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_id UUID NOT NULL REFERENCES benchmarks(id) ON DELETE CASCADE,
    
    -- Pregunta/variable
    variable_name TEXT NOT NULL,            -- 'aprobacion_gobierno'
    variable_label TEXT,                    -- 'Aprobación del gobierno'
    question_text TEXT,                     -- Texto exacto de la pregunta
    
    -- Resultados
    result_type TEXT CHECK (result_type IN ('percentage', 'mean', 'median', 'distribution')),
    result_value NUMERIC(10,4),             -- Valor principal
    result_distribution JSONB,              -- { "muy_de_acuerdo": 25.5, "de_acuerdo": 30.2 }
    
    -- Desagregaciones
    segment_by TEXT,                        -- 'region', 'sex', 'age_group', 'income'
    segment_value TEXT,                     -- 'metropolitana', 'male', '18-24'
    
    -- Metadatos
    margin_of_error NUMERIC(5,2),
    confidence_level INTEGER DEFAULT 95
);

-- Índices
CREATE INDEX idx_bench_results_benchmark ON benchmark_results(benchmark_id);
CREATE INDEX idx_bench_results_variable ON benchmark_results(variable_name);
```

**Relaciones**:
- `benchmark_id` → `benchmarks`

---

### 2.15 calibration_runs

**Propósito**: Ejecuciones de calibración de agentes contra benchmarks.

```sql
CREATE TABLE calibration_runs (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Qué se calibró
    benchmark_id UUID REFERENCES benchmarks(id),
    agent_sample_size INTEGER,              -- Cuántos agentes se usaron
    
    -- Configuración
    calibration_strategy TEXT CHECK (calibration_strategy IN ('none', 'weight_adjustment', 'trait_adjustment', 'rejection_sampling')),
    
    -- Métricas de calidad
    mae NUMERIC(10,4),                      -- Mean Absolute Error
    rmse NUMERIC(10,4),                     -- Root Mean Square Error
    max_error NUMERIC(10,4),                -- Error máximo
    
    -- Resultados
    adjustments_applied JSONB,              -- Qué ajustes se hicieron
    agent_weights_adjusted BOOLEAN DEFAULT FALSE,
    
    -- Estado
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    
    -- Tiempos
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_calibration_benchmark ON calibration_runs(benchmark_id);
CREATE INDEX idx_calibration_status ON calibration_runs(status);
```

---

## 3. Relaciones entre tablas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE SCHEMA                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │   territories   │◄──────────────────────────────────────────┐            │
│  │  (jerarquía)    │                                           │            │
│  └────────┬────────┘                                           │            │
│           │ parent_id                                          │            │
│           ▼                                                    │            │
│  ┌─────────────────┐     ┌─────────────────┐                   │            │
│  │   territories   │     │ synthetic_agents│                   │            │
│  │   (comunas)     │◄────┤  (registro      │                   │            │
│  └─────────────────┘     │   maestro)      │                   │            │
│                          └────────┬────────┘                   │            │
│                                   │                            │            │
│           ┌───────────────────────┼───────────────────────┐    │            │
│           │                       │                       │    │            │
│           ▼                       ▼                       ▼    │            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │            │
│  │  agent_profiles │  │   agent_traits  │  │   agent_states  │ │            │
│  │  (1:1)          │  │    (1:1)        │  │    (1:1)        │ │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │            │
│                                                                │            │
│           ┌───────────────────────┐                           │            │
│           │                       │                           │            │
│           ▼                       ▼                           │            │
│  ┌─────────────────┐  ┌─────────────────┐                     │            │
│  │  agent_memories │  │agent_event_expos│◄────────────────────┘            │
│  │   (1:N)         │  │    ures (1:N)   │                                  │
│  └─────────────────┘  └─────────────────┘                                  │
│                                              ┌─────────────────┐           │
│                                              │     events      │           │
│                                              │   (catálogo)    │           │
│                                              └─────────────────┘           │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │     surveys     │──┤ survey_questions│  │   survey_runs   │             │
│  │   (definición)  │  │    (1:N)        │  │   (ejecución)   │             │
│  └─────────────────┘  └─────────────────┘  └────────┬────────┘             │
│                                                     │                       │
│                                                     ▼                       │
│                                          ┌─────────────────┐              │
│                                          │ survey_responses│              │
│                                          │    (1:N x M)    │              │
│                                          └─────────────────┘              │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │    benchmarks   │──┤ benchmark_results│  │ calibration_runs│             │
│  │  (encuestas     │  │    (1:N)        │  │   (validación)  │             │
│  │    reales)      │  └─────────────────┘  └─────────────────┘             │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Runtime bindings con Convex

### 4.1 Tabla puente: runtime_bindings

**Propósito**: Mapear agentes estructurales (Supabase) con entidades de runtime (Convex).

```sql
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices críticos
CREATE UNIQUE INDEX idx_bindings_agent_active 
    ON runtime_bindings(agent_id) 
    WHERE status IN ('activating', 'active');
    
CREATE INDEX idx_bindings_convex_agent ON runtime_bindings(convex_agent_id);
CREATE INDEX idx_bindings_convex_player ON runtime_bindings(convex_player_id);
CREATE INDEX idx_bindings_status ON runtime_bindings(status);
CREATE INDEX idx_bindings_region ON runtime_bindings(region_id);
```

**Restricciones**:
- Un agente solo puede tener un binding `active` a la vez
- Los IDs de Convex pueden ser NULL si el agente nunca se activó

### 4.2 Tabla de sincronización: sync_queue

**Propósito**: Cola de cambios para sincronizar entre Supabase y Convex.

```sql
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Qué entidad cambió
    entity_type TEXT NOT NULL 
        CHECK (entity_type IN ('agent', 'memory', 'state', 'event_exposure')),
    entity_id UUID NOT NULL,
    
    -- Qué operación
    operation TEXT NOT NULL 
        CHECK (operation IN ('create', 'update', 'delete')),
    
    -- Payload del cambio
    payload JSONB,
    
    -- Estado de procesamiento
    status TEXT DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- Reintentos
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Tiempos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Prioridad (menor = más prioritario)
    priority INTEGER DEFAULT 100
);

-- Índices
CREATE INDEX idx_sync_queue_status ON sync_queue(status, priority, created_at);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
```

### 4.3 Flujo de activación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Encuesta   │────▶│   Selección  │────▶│  Activación  │────▶│    Convex    │
│   Iniciada   │     │   de Agente  │     │   (Bridge)   │     │   Runtime    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
        │                      │                   │                   │
        ▼                      ▼                   ▼                   ▼
   survey_runs          synthetic_agents    runtime_bindings      worlds/
   status='running'     status='dormant'    status='activating'   players/
                                              ↓                   agents
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  Convex API  │
                                       │  createPlayer│
                                       │  createAgent │
                                       └──────────────┘
                                              │
                                              ▼
                                       runtime_bindings
                                       status='active'
                                       convex_player_id='...'
                                       convex_agent_id='...'
```

### 4.4 Flujo de desactivación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Encuesta   │────▶│   Archivo    │────▶│ Desactivación│────▶│    Convex    │
│  Completada  │     │   Estado     │     │   (Bridge)   │     │   Cleanup    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
        │                      │                   │                   │
        ▼                      ▼                   ▼                   ▼
   survey_responses      agent_states         runtime_bindings      archived*
   (guardadas)           (actualizado)        status='deactivating'  tables
                                              ↓
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  Convex API  │
                                       │  archivePlayer│
                                       │  archiveAgent │
                                       └──────────────┘
                                              │
                                              ▼
                                       runtime_bindings
                                       status='inactive'
                                       convex_*_id=NULL
```

---

## 5. Qué vive en Supabase vs Convex

### 5.1 Supabase (Fuente de verdad estructural)

| Categoría | Datos | Razón |
|-----------|-------|-------|
| **Identidad** | `synthetic_agents.id`, `public_id` | Persistente, referenciable |
| **Perfil** | Todo `agent_profiles` | Datos censales, no cambian |
| **Rasgos** | Todo `agent_traits` | Configuración psicológica |
| **Memoria estructurada** | `agent_memories` (resúmenes, posiciones) | Para análisis y consistencia |
| **Estado histórico** | `agent_states` (fatiga, estrés) | Tendencias temporales |
| **Eventos** | `events`, `agent_event_exposures` | Catálogo e interpretaciones |
| **Encuestas** | `surveys`, `questions`, `runs`, `responses` | Resultados permanentes |
| **Benchmarks** | `benchmarks`, `results`, `calibration_runs` | Validación externa |
| **Territorio** | `territories` | Jerarquía geográfica |
| **Bindings** | `runtime_bindings` | Mapeo Supabase↔Convex |

### 5.2 Convex (Runtime efímero)

| Categoría | Datos | Razón |
|-----------|-------|-------|
| **Posición** | `players.position`, `facing`, `speed` | Tiempo real, visualización |
| **Navegación** | `players.pathfinding` | Cálculo de rutas |
| **Actividad** | `players.activity` | Estado transitorio |
| **Conversaciones** | `conversations`, `messages` | Chat en tiempo real |
| **Memoria caliente** | `memories` (embeddings) | Búsqueda semántica rápida |
| **Operaciones** | `agents.inProgressOperation` | Estado de LLM calls |
| **Estado juego** | `worlds`, `worldStatus` | Simulación activa |

### 5.3 Tabla de decisión

| Dato | Supabase | Convex | Notas |
|------|----------|--------|-------|
| ID del agente | ✅ | ✅ | Mismo ID, dos contextos |
| Nombre | ✅ | ❌ | Solo en Supabase |
| Edad | ✅ | ❌ | Solo en Supabase |
| Posición (x,y) | ❌ | ✅ | Solo en Convex |
| Memoria de conversación | ✅ (resumen) | ✅ (embeddings) | Dual: estructural + semántica |
| Fatigue | ✅ (histórico) | ❌ | Solo estructural |
| Estado de conversación | ❌ | ✅ | Solo runtime |
| Respuestas a encuestas | ✅ | ❌ | Solo estructural |

---

## 6. Cómo se compone FullAgent

### 6.1 Arquitectura de composición

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FullAgent (Frontend)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AgentProfile                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Source: Supabase agent_profiles + synthetic_agents                 │   │
│  │  Query: SELECT * FROM agent_profiles WHERE agent_id = $1            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AgentTraits                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Source: Supabase agent_traits                                      │   │
│  │  Query: SELECT * FROM agent_traits WHERE agent_id = $1              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AgentMemory                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Source: Supabase agent_memories + Convex memories (opcional)       │   │
│  │  Query: SELECT * FROM agent_memories WHERE agent_id = $1            │   │
│  │  + Vector search en Convex si se necesita contexto conversacional   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AgentState                                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Source: Supabase agent_states (estructural)                        │   │
│  │  Query: SELECT * FROM agent_states WHERE agent_id = $1              │   │
│  │  NOTA: Convex NO tiene estado emocional persistente                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      AgentEventExposure[]                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Source: Supabase agent_event_exposures                             │   │
│  │  Query: SELECT * FROM agent_event_exposures WHERE agent_id = $1     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Estrategias de carga

#### Estrategia A: Carga completa (para AgentInspectorPanel)

```typescript
// Carga todos los datos del agente
async function loadFullAgent(agentId: string): Promise<FullAgent> {
  // Paralelizar queries a Supabase
  const [profile, traits, memories, state, events] = await Promise.all([
    supabase.from('agent_profiles').select('*').eq('agent_id', agentId).single(),
    supabase.from('agent_traits').select('*').eq('agent_id', agentId).single(),
    supabase.from('agent_memories').select('*').eq('agent_id', agentId),
    supabase.from('agent_states').select('*').eq('agent_id', agentId).single(),
    supabase.from('agent_event_exposures').select('*').eq('agent_id', agentId),
  ]);
  
  return {
    profile: profile.data,
    traits: traits.data,
    memory: aggregateMemories(memories.data),
    state: state.data,
    events: events.data,
  };
}
```

#### Estrategia B: Carga resumida (para listas)

```typescript
// Solo datos esenciales para RegionSceneView
async function loadAgentSummaries(regionId: string): Promise<AgentSummary[]> {
  const { data } = await supabase
    .from('synthetic_agents')
    .select(`
      id,
      public_id,
      character_sprite,
      agent_profiles!inner(name, age, sex),
      agent_states!inner(mood, is_active)
    `)
    .eq('region_id', regionId)
    .eq('status', 'active');
    
  return data.map(toAgentSummary);
}
```

#### Estrategia C: Carga híbrida (para interacción en tiempo real)

```typescript
// Datos estructurales de Supabase + posición de Convex
async function loadAgentForGame(agentId: string) {
  // Datos estructurales (cachéables)
  const structural = await loadAgentProfile(agentId);
  
  // Posición en tiempo real (Convex)
  const runtime = await convex.query(api.worlds.playerPosition, {
    playerId: getConvexPlayerId(agentId),
  });
  
  return { ...structural, position: runtime.position };
}
```

---

## 7. Propuesta de implementación inicial

### 7.1 Fase 1: Esqueleto estructural (Semana 1)

**Objetivo**: Tablas básicas para agentes y territorios.

**Tablas a crear**:
1. `territories` - Jerarquía territorial
2. `synthetic_agents` - Registro maestro
3. `agent_profiles` - Perfiles demográficos
4. `agent_traits` - Rasgos psicológicos
5. `runtime_bindings` - Puente con Convex

**Mocks a migrar**:
- Mover `src/mocks/territories.ts` → `territories` table
- Mover `src/mocks/agents.ts` → `synthetic_agents` + `agent_profiles` + `agent_traits`

**APIs a implementar**:
- `GET /api/agents/:id` - FullAgent completo
- `GET /api/agents?region=:id` - Lista de AgentSummary
- `GET /api/territories` - Lista de territorios

### 7.2 Fase 2: Memoria y estado (Semana 2)

**Objetivo**: Persistencia de memoria y estado.

**Tablas a crear**:
6. `agent_memories` - Memoria estructurada
7. `agent_states` - Estado dinámico

**Features**:
- Sincronización de memoria desde Convex a Supabase
- Actualización de estado post-encuesta

### 7.3 Fase 3: Eventos (Semana 3)

**Objetivo**: Sistema de eventos.

**Tablas a crear**:
8. `events` - Catálogo de eventos
9. `agent_event_exposures` - Exposiciones

**Features**:
- Creación de eventos desde UI
- Simulación de exposición de agentes

### 7.4 Fase 4: Encuestas (Semana 4)

**Objetivo**: Sistema de encuestas sintéticas.

**Tablas a crear**:
10. `surveys` - Definición de encuestas
11. `survey_questions` - Preguntas
12. `survey_runs` - Ejecuciones
13. `survey_responses` - Respuestas

**Features**:
- Creación de encuestas
- Ejecución de encuestas a agentes
- Agregación de resultados

### 7.5 Fase 5: Benchmarks (Semana 5)

**Objetivo**: Validación con datos reales.

**Tablas a crear**:
14. `benchmarks` - Encuestas reales
15. `benchmark_results` - Resultados
16. `calibration_runs` - Calibraciones

**Features**:
- Carga de benchmarks
- Comparación agentes vs reales
- Calibración automática

### 7.6 Orden de implementación

```
Fase 1 ──▶ Fase 2 ──▶ Fase 3 ──▶ Fase 4 ──▶ Fase 5
(Agentes)  (Memoria)  (Eventos)  (Encuestas) (Validación)
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
territories agent_    events    surveys   benchmarks
synthetic_  memories            questions benchmark_
agents      agent_              survey_   results
agent_      states              runs      calibration_
profiles                        survey_   runs
agent_                          responses
traits
runtime_
bindings
```

---

## 8. Riesgos y decisiones pendientes

### 8.1 Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **Doble fuente de verdad** | Alta | Alto | Definir claramente qué sistema es propietario de cada dato |
| **Latencia de sincronización** | Media | Medio | Usar colas async, no bloquear UI |
| **Inconsistencia de IDs** | Media | Alto | Usar UUIDs en Supabase, mapear a Convex IDs |
| **Escalabilidad de Convex** | Baja | Alto | Diseñar para que Convex sea descartable |
| **Complejidad de queries** | Media | Medio | Crear vistas materializadas para lecturas frecuentes |

### 8.2 Decisiones pendientes

#### DP1: ¿Dónde vive la memoria semántica?

**Opción A**: Solo Convex (memories table con embeddings)
- Pros: Búsqueda vectorial nativa, rápida
- Cons: No persistente, no auditable

**Opción B**: Dual (Convex + Supabase)
- Pros: Persistencia + performance
- Cons: Complejidad de sincronización

**Opción C**: Solo Supabase (con pgvector)
- Pros: Una sola fuente de verdad
- Cons: Requiere migrar embeddings

**Recomendación**: Opción B (dual) por ahora, evaluar C en el futuro.

#### DP2: ¿Cómo se activan los agentes?

**Opción A**: Bajo demanda (lazy)
- Pros: Eficiente, solo activos cuando se necesitan
- Cons: Latencia al primer uso

**Opción B**: Proactivo (pre-warm)
- Pros: Siempre listos
- Cons: Costo de recursos

**Opción C**: Híbrido (scheduled)
- Pros: Balance
- Cons: Complejidad

**Recomendación**: Opción A para MVP, evaluar C para producción.

#### DP3: ¿Cómo se manejan las conversaciones?

**Opción A**: Solo Convex (como está ahora)
- Pros: Simple, funciona
- Cons: No persistente, no analizable

**Opción B**: Convex + Supabase (sync)
- Pros: Persistencia + tiempo real
- Cons: Complejidad

**Opción C**: Solo Supabase (async)
- Pros: Persistente, analizable
- Cons: Sin tiempo real

**Recomendación**: Opción B, archivar conversaciones completadas en Supabase.

#### DP4: ¿Cómo se calibran los agentes?

**Opción A**: Offline (batch)
- Pros: Simple, controlado
- Cons: No adaptativo

**Opción B**: Online (continuo)
- Pros: Adaptativo
- Cons: Complejo, puede diverger

**Opción C**: Híbrido (periódico)
- Pros: Balance
- Cons: Requiere scheduling

**Recomendación**: Opción A para MVP, C para producción.

### 8.3 Supuestos críticos

1. **Convex es descartable**: Si Convex falla o se reinicia, los agentes pueden reactivarse desde Supabase sin pérdida de datos críticos.

2. **Supabase es la fuente de verdad**: Cualquier conflicto entre sistemas se resuelve a favor de Supabase.

3. **Los agentes son stateless en Convex**: El estado emocional y la memoria se reconstruyen desde Supabase al activar.

4. **Las encuestas son el driver de activación**: Los agentes se activan principalmente para participar en encuestas.

5. **Los benchmarks son externos**: Los datos de validación vienen de fuentes externas, no se generan.

---

## 9. Anexos

### 9.1 Diagrama ER completo

```
[Ver sección 3 para diagrama detallado]
```

### 9.2 Ejemplos de queries

#### Query: Agentes disponibles para encuesta

```sql
SELECT 
    sa.id,
    sa.public_id,
    ap.name,
    ap.age,
    ap.sex,
    ast.fatigue,
    ast.survey_saturation
FROM synthetic_agents sa
JOIN agent_profiles ap ON sa.id = ap.agent_id
JOIN agent_states ast ON sa.id = ast.agent_id
WHERE sa.status = 'dormant'
    AND ast.fatigue < 80
    AND ast.survey_saturation < 5
    AND sa.region_id = 'metropolitana'
ORDER BY sa.weight DESC
LIMIT 100;
```

#### Query: Resultados de encuesta agregados

```sql
SELECT 
    sq.question_text,
    sr.response_value,
    COUNT(*) as count,
    AVG(ap.age) as avg_age,
    MODE() WITHIN GROUP (ORDER BY ap.sex) as mode_sex
FROM survey_responses sr
JOIN survey_questions sq ON sr.question_id = sq.id
JOIN agent_profiles ap ON sr.agent_id = ap.agent_id
WHERE sr.run_id = '...'
GROUP BY sq.question_text, sr.response_value;
```

#### Query: Comparación agentes vs benchmark

```sql
WITH agent_results AS (
    SELECT 
        sq.topic_tags[1] as topic,
        sr.response_value,
        COUNT(*) * AVG(sa.weight) as weighted_count
    FROM survey_responses sr
    JOIN synthetic_agents sa ON sr.agent_id = sa.id
    JOIN survey_questions sq ON sr.question_id = sq.id
    WHERE sr.run_id = '...'
    GROUP BY sq.topic_tags[1], sr.response_value
),
benchmark_results AS (
    SELECT 
        variable_name as topic,
        result_distribution
    FROM benchmark_results
    WHERE benchmark_id = '...'
)
SELECT 
    ar.topic,
    ar.response_value,
    ar.weighted_count as agent_count,
    br.result_distribution->>ar.response_value as benchmark_pct
FROM agent_results ar
LEFT JOIN benchmark_results br ON ar.topic = br.topic;
```

### 9.3 Políticas de RLS (Row Level Security)

```sql
-- Ejemplo: Solo usuarios autenticados pueden ver agentes
ALTER TABLE synthetic_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view agents"
    ON synthetic_agents
    FOR SELECT
    TO authenticated
    USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Only admins can modify agents"
    ON synthetic_agents
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
```

---

**Documento versión**: 1.0  
**Última actualización**: 2024-01-XX  
**Autor**: AI Assistant  
**Estado**: Propuesta para revisión
